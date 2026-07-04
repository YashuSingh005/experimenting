-- ============================================================================
-- YASHU AI — Complete Supabase Schema
-- Run this in the Supabase SQL Editor to initialize the database.
-- ============================================================================

-- 0. Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- 1.1 Profiles
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default '',
  email         text not null unique,
  role          text not null default 'user' check (role in ('user', 'admin')),
  avatar_url    text,
  status        text not null default 'active' check (status in ('active', 'banned', 'suspended')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 1.2 Chat Sessions
create table if not exists public.chat_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null default 'New Chat',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 1.3 Messages
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.chat_sessions(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null default '',
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- 1.4 AI Settings (single-row configuration)
create table if not exists public.settings (
  id              uuid primary key default gen_random_uuid(),
  system_prompt   text not null default 'You are a helpful AI assistant.',
  temperature     real not null default 0.7 check (temperature >= 0 and temperature <= 2),
  max_tokens      integer not null default 4096 check (max_tokens > 0),
  top_p           real not null default 0.9 check (top_p >= 0 and top_p <= 1),
  context_length  integer not null default 8192 check (context_length > 0),
  model_name      text not null default 'openai/gpt-4o-mini',
  updated_at      timestamptz not null default now(),
  updated_by      uuid references public.profiles(id)
);

-- 1.5 Logs
create table if not exists public.logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  details     text,
  ip          text,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index if not exists idx_chat_sessions_created_at on public.chat_sessions(created_at desc);

create index if not exists idx_messages_chat_id on public.messages(chat_id);
create index if not exists idx_messages_created_at on public.messages(created_at);
create index if not exists idx_messages_chat_id_created_at on public.messages(chat_id, created_at);

create index if not exists idx_logs_created_at on public.logs(created_at desc);
create index if not exists idx_logs_user_id on public.logs(user_id);
create index if not exists idx_logs_action on public.logs(action);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    case
      when new.email = coalesce(current_setting('app.admin_email', true), 'admin@example.com') then 'admin'
      else 'user'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger update_chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function public.update_updated_at();

create trigger update_settings_updated_at
  before update on public.settings
  for each row execute function public.update_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

-- 4.1 Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4.2 Chat Sessions
alter table public.chat_sessions enable row level security;

create policy "Users can view own chats"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can create own chats"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chats"
  on public.chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own chats"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

create policy "Admins can view all chats"
  on public.chat_sessions for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete any chat"
  on public.chat_sessions for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4.3 Messages
alter table public.messages enable row level security;

create policy "Users can view own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.chat_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own chats"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.chat_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete own messages"
  on public.messages for delete
  using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.chat_id
        and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Admins can view all messages"
  on public.messages for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete any message"
  on public.messages for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4.4 Settings
alter table public.settings enable row level security;

create policy "Anyone can view settings"
  on public.settings for select
  using (true);

create policy "Only admins can update settings"
  on public.settings for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Only admins can update settings"
  on public.settings for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4.5 Logs
alter table public.logs enable row level security;

create policy "Only admins can view logs"
  on public.logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Service can insert logs"
  on public.logs for insert
  with check (true);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Get total user count
create or replace function public.get_total_users()
returns bigint
language sql
security definer
as $$
  select count(*) from public.profiles;
$$;

-- Get today's message count
create or replace function public.get_today_messages()
returns bigint
language sql
security definer
as $$
  select count(*) from public.messages
  where created_at >= current_date;
$$;

-- Get total chat count
create or replace function public.get_total_chats()
returns bigint
language sql
security definer
as $$
  select count(*) from public.chat_sessions;
$$;

-- Get dashboard stats (admin)
create or replace function public.get_dashboard_stats()
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'today_messages', (select count(*) from public.messages where created_at >= current_date),
    'total_chats', (select count(*) from public.chat_sessions)
  ) into result;
  return result;
end;
$$;

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

-- Settings row (inserted once, used as singleton)
insert into public.settings (system_prompt, temperature, max_tokens, top_p, context_length, model_name)
values (
  'You are YASHU, an intelligent AI assistant. You help users with coding, analysis, and general questions. Respond in markdown format. Be concise, accurate, and helpful.',
  0.7,
  4096,
  0.9,
  8192,
  'openai/gpt-4o-mini'
)
on conflict do nothing;

-- ============================================================================
-- Fix 1: Grant service_role full access to all tables
-- ============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- Fix 2: Create security definer function to check admin role (breaks RLS recursion)
-- ============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- Fix 3: Replace recursive RLS policies with non-recursive versions
-- ============================================================================

-- Drop recursive admin policies on profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

-- Drop recursive admin policies on chat_sessions
drop policy if exists "Admins can view all chats" on public.chat_sessions;
create policy "Admins can view all chats"
  on public.chat_sessions for select
  using (public.is_admin());

drop policy if exists "Admins can delete any chat" on public.chat_sessions;
create policy "Admins can delete any chat"
  on public.chat_sessions for delete
  using (public.is_admin());

-- Drop recursive admin policies on messages
drop policy if exists "Admins can view all messages" on public.messages;
create policy "Admins can view all messages"
  on public.messages for select
  using (public.is_admin());

drop policy if exists "Admins can delete any message" on public.messages;
create policy "Admins can delete any message"
  on public.messages for delete
  using (public.is_admin());

-- Drop recursive admin policies on settings
drop policy if exists "Only admins can insert settings" on public.settings;
create policy "Only admins can insert settings"
  on public.settings for insert
  with check (public.is_admin());

drop policy if exists "Only admins can update settings" on public.settings;
create policy "Only admins can update settings"
  on public.settings for update
  using (public.is_admin());

-- Drop recursive admin policies on logs
drop policy if exists "Only admins can view logs" on public.logs;
create policy "Only admins can view logs"
  on public.logs for select
  using (public.is_admin());

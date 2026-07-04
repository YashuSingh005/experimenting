-- ============================================================================
-- Seed Data
-- Run after schema.sql is applied and at least one user has signed up.
-- ============================================================================

-- Ensure settings singleton (there should always be exactly one row)
-- This is idempotent — it updates if exists, inserts if not.
insert into public.settings (system_prompt, temperature, max_tokens, top_p, context_length, model_name)
values (
  'You are YASHU, an intelligent AI assistant. You help users with coding, analysis, and general questions. Respond in markdown format. Be concise, accurate, and helpful.',
  0.7,
  4096,
  0.9,
  8192,
  'openai/gpt-4o-mini'
)
on conflict on constraint settings_pkey do nothing;

-- Promote the first user whose email matches ADMIN_EMAIL to admin role.
-- Set this via a custom session variable before running:
--   set app.admin_email = 'admin@example.com';
do $$
declare
  admin_email text;
begin
  admin_email := current_setting('app.admin_email', true);
  if admin_email is not null then
    update public.profiles
    set role = 'admin'
    where email = admin_email;
  end if;
end;
$$;

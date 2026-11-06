-- Newsletter addresses for RIVERMINDSTYLE.
-- Dashboard → SQL Editor → New query → Run.
-- The studio server writes this table with the secret key. The shop cannot read it.

create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint newsletter_email_shape check (
    email = lower(email)
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

alter table public.newsletter enable row level security;
revoke all on table public.newsletter from anon, authenticated;

notify pgrst, 'reload schema';

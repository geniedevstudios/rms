-- Shop accounts for RIVERMINDSTYLE.
-- Dashboard → SQL Editor → New query → Run.
-- The studio server writes these with the secret key. The shop cannot read them.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  given_name text not null,
  family_name text not null,
  password text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint customers_email_shape check (
    email = lower(email)
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint customers_name_length check (
    char_length(given_name) between 1 and 40
    and char_length(family_name) between 1 and 40
  )
);

create table if not exists public.customer_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists customer_codes_email_idx
  on public.customer_codes (email, created_at desc);

create table if not exists public.customer_sessions (
  token text primary key,
  customer_id uuid not null references public.customers (id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.customer_carts (
  customer_id uuid primary key references public.customers (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.customer_codes enable row level security;
alter table public.customer_sessions enable row level security;
alter table public.customer_carts enable row level security;

revoke all on table public.customers from anon, authenticated;
revoke all on table public.customer_codes from anon, authenticated;
revoke all on table public.customer_sessions from anon, authenticated;
revoke all on table public.customer_carts from anon, authenticated;

notify pgrst, 'reload schema';

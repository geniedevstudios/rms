-- Studio records for RIVERMINDSTYLE, one row per order, consultation, email, and checkout.
-- The catalogue draft stays one document because the studio saves it as a whole.
-- The shop cannot read these tables. The public catalogue stays in public.storefront.

create table if not exists public.orders (
  id text primary key,
  placed_at timestamptz not null,
  email text not null,
  name text not null,
  phone text not null default '',
  status text not null,
  total numeric not null,
  paid boolean not null default true,
  items jsonb not null,
  address jsonb not null,
  record jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status, placed_at desc);
create index if not exists orders_email_idx on public.orders (email);

create table if not exists public.consultations (
  id text primary key,
  date timestamptz not null,
  name text not null,
  email text not null,
  phone text not null,
  service text not null,
  meeting text not null,
  vision text not null default '',
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists consultations_status_idx on public.consultations (status, date desc);

create table if not exists public.catalogue (
  id text primary key default 'draft',
  document jsonb not null,
  updated_at timestamptz not null default now(),
  constraint catalogue_draft check (id = 'draft')
);

create table if not exists public.studio_profile (
  id text primary key default 'owner',
  name text not null,
  image text not null default '',
  constraint studio_profile_owner check (id = 'owner')
);

create table if not exists public.studio_admins (
  email text primary key,
  name text not null,
  password text not null,
  image text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.studio_invites (
  email text primary key,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_sessions (
  token text primary key,
  email text not null,
  expires_at timestamptz not null
);

create table if not exists public.checkouts (
  token text primary key,
  email text,
  completed boolean not null default false,
  cancelled boolean not null default false,
  document jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.mail_jobs (
  id text primary key,
  kind text not null,
  audience text not null,
  state text not null,
  email text,
  token text,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists mail_jobs_state_idx on public.mail_jobs (state, kind);

create table if not exists public.mail_opt_outs (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_wishlists (
  customer_id uuid primary key references public.customers (id) on delete cascade,
  product_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.consultations enable row level security;
alter table public.catalogue enable row level security;
alter table public.studio_profile enable row level security;
alter table public.studio_admins enable row level security;
alter table public.studio_invites enable row level security;
alter table public.studio_sessions enable row level security;
alter table public.checkouts enable row level security;
alter table public.mail_jobs enable row level security;
alter table public.mail_opt_outs enable row level security;
alter table public.customer_wishlists enable row level security;

revoke all on table public.orders from anon, authenticated;
revoke all on table public.consultations from anon, authenticated;
revoke all on table public.catalogue from anon, authenticated;
revoke all on table public.studio_profile from anon, authenticated;
revoke all on table public.studio_admins from anon, authenticated;
revoke all on table public.studio_invites from anon, authenticated;
revoke all on table public.studio_sessions from anon, authenticated;
revoke all on table public.checkouts from anon, authenticated;
revoke all on table public.mail_jobs from anon, authenticated;
revoke all on table public.mail_opt_outs from anon, authenticated;
revoke all on table public.customer_wishlists from anon, authenticated;

notify pgrst, 'reload schema';

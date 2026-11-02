-- Run this in the RivermindStyle project: dlxtdthicumafphnduwe
-- Dashboard → SQL Editor → New query → Run.
-- Linking Resend under Authentication → SMTP does not create this table.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  reference text not null,
  consent text not null,
  consent_version text not null,
  finish text not null default 'obsidian',
  created_at timestamptz not null default now(),
  constraint waitlist_name_length check (char_length(name) between 1 and 80),
  constraint waitlist_email_length check (char_length(email) between 3 and 254),
  constraint waitlist_email_lower check (email = lower(email)),
  constraint waitlist_email_shape check (email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint waitlist_reference_shape check (reference ~ '^RMS-[A-Z0-9]{8}$'),
  constraint waitlist_consent check (consent = 'RMS launch updates'),
  constraint waitlist_finish check (finish in ('obsidian', 'pearl')),
  constraint waitlist_email_unique unique (email),
  constraint waitlist_reference_unique unique (reference)
);

alter table public.waitlist enable row level security;

revoke all on table public.waitlist from anon, authenticated;
grant insert on table public.waitlist to anon, authenticated;

drop policy if exists "Anyone can join the launch list" on public.waitlist;
create policy "Anyone can join the launch list"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

alter table public.waitlist add column if not exists finish text not null default 'obsidian';
alter table public.waitlist drop constraint if exists waitlist_finish;
alter table public.waitlist
  add constraint waitlist_finish check (finish in ('obsidian', 'pearl'));
notify pgrst, 'reload schema';

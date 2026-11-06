-- Live storefront snapshot for RIVERMINDSTYLE.
-- Dashboard → SQL Editor → New query → Run.
-- The studio writes this row with the secret key. The storefront only reads it.

create table if not exists public.storefront (
  id text primary key default 'live',
  revision integer not null,
  published_at timestamptz,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  constraint storefront_live check (id = 'live')
);

alter table public.storefront enable row level security;
alter table public.storefront replica identity full;

revoke all on table public.storefront from anon, authenticated;
grant select on table public.storefront to anon, authenticated;

drop policy if exists "Anyone can read the live storefront" on public.storefront;
create policy "Anyone can read the live storefront"
  on public.storefront
  for select
  to anon, authenticated
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'storefront'
  ) then
    alter publication supabase_realtime add table public.storefront;
  end if;
end $$;

notify pgrst, 'reload schema';

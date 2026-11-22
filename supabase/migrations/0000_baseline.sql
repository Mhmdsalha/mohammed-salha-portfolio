-- D1-2 baseline (docs/DECISIONS.md D-003): the projects table as it was created from README.md,
-- before any migration existed. It lets every later migration apply to a fresh database as well
-- as to production, where all of this already exists and the file changes nothing.
--
-- Safe to re-run after 0002_rebuild.sql: the original open read policy is only created on a
-- brand-new table that has no policies yet, so re-running this can never reopen unpublished rows.

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  category text not null,
  tags text[] default '{}',
  thumbnail_url text,
  images text[] default '{}',
  live_url text,
  github_url text,
  featured boolean default false,
  order_num integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

grant select on public.projects to anon, authenticated;
grant all on public.projects to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'projects'
  ) then
    create policy "Public read" on public.projects for select to anon using (true);
    create policy "Service role full access" on public.projects for all to service_role
      using (true);
  end if;
end
$$;

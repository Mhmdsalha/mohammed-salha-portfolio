-- D1-2: the rebuild's data model (docs/PLAN.md "Data model changes", docs/DECISIONS.md D-002,
-- D-004, D-028). One transaction: if any step fails, nothing changes. Safe to re-run.
--
-- Owner decisions (2026-11-23):
--   * categories: salla -> store, pos -> system, anything else unknown -> webapp;
--   * GitHub links for Arzaq, Saree3 and Oud are filled in;
--   * Lamsa and Lolo stay in the table but are hidden (no repository yet) until their links are
--     added from the dashboard: the public can only read published projects with a GitHub URL.

begin;

-- 1. Categories -----------------------------------------------------------------------------
alter table public.projects drop constraint if exists projects_category_check;
update public.projects set category = 'store' where category = 'salla';
update public.projects set category = 'system' where category = 'pos';
update public.projects set category = 'webapp'
  where category not in ('webapp', 'system', 'platform', 'store');
alter table public.projects add constraint projects_category_check
  check (category in ('webapp', 'system', 'platform', 'store'));

-- 2. GitHub links the owner confirmed (only where none is set) ------------------------------
update public.projects set github_url = 'https://github.com/Mhmdsalha/arzaq'
  where slug = 'arzaq-marketplace' and github_url is null;
update public.projects set github_url = 'https://github.com/Mhmdsalha/saree3-pos-project'
  where slug = 'saree3-pos' and github_url is null;
update public.projects set github_url = 'https://github.com/Mhmdsalha/oud-store-design'
  where slug = 'oud-abaya-store' and github_url is null;

-- 3. New columns ----------------------------------------------------------------------------
alter table public.projects
  add column if not exists label text,
  add column if not exists featured_order integer,
  add column if not exists highlights_ar text[] not null default '{}',
  add column if not exists highlights_en text[] not null default '{}',
  add column if not exists published boolean not null default true;

alter table public.projects drop constraint if exists projects_label_check;
alter table public.projects add constraint projects_label_check
  check (label is null or label in ('training', 'graduation', 'applied'));

-- Arzaq and Saree3 keep the design's "training project" label (owner, CONTENT.md C-2).
update public.projects set label = 'training'
  where slug in ('arzaq-marketplace', 'saree3-pos') and label is null;

-- Featured projects without a carousel position get one, in their current order.
with ranked as (
  select id,
    coalesce((select max(featured_order) from public.projects), 0)
      + row_number() over (order by order_num, created_at) as position
  from public.projects
  where featured and featured_order is null
)
update public.projects p set featured_order = ranked.position
  from ranked where p.id = ranked.id;

-- 4. Tighten the original columns, so the generated types have no needless nulls ------------
update public.projects set tags = '{}' where tags is null;
update public.projects set images = '{}' where images is null;
update public.projects set featured = false where featured is null;
update public.projects set order_num = 0 where order_num is null;
update public.projects set created_at = now() where created_at is null;
update public.projects set updated_at = now() where updated_at is null;
alter table public.projects
  alter column tags set not null,
  alter column images set not null,
  alter column featured set not null,
  alter column order_num set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

-- updated_at follows every edit (the sitemap's lastmod reads it).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- 5. Public read: published projects with a repository only (D-004, R17) --------------------
drop policy if exists "Public read" on public.projects;
drop policy if exists "Public read published projects" on public.projects;
create policy "Public read published projects" on public.projects
  for select to anon, authenticated
  using (published and github_url is not null);

-- 6. Skills ---------------------------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  abbr text not null,
  category text not null check (category in ('frontend', 'backend', 'database', 'infra')),
  order_num integer not null default 0
);

create table if not exists public.project_skills (
  project_id uuid not null references public.projects (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (project_id, skill_id)
);

create index if not exists project_skills_skill_idx on public.project_skills (skill_id);

alter table public.skills enable row level security;
alter table public.project_skills enable row level security;

grant select on public.skills, public.project_skills to anon, authenticated;
grant all on public.skills, public.project_skills to service_role;

drop policy if exists "Public read skills" on public.skills;
create policy "Public read skills" on public.skills
  for select to anon, authenticated using (true);

-- A link is public only when its project is: the subquery runs under the caller's RLS.
drop policy if exists "Public read project skills" on public.project_skills;
create policy "Public read project skills" on public.project_skills
  for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id));

commit;

-- D1-1: failed dashboard login attempts, for the 5-per-15-minutes rate limit.
-- Only the service role touches this table: RLS is on and there are no policies,
-- so the anon and authenticated roles can neither read nor write it.

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  key_hash text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_key_time_idx
  on public.login_attempts (key_hash, attempted_at desc);

alter table public.login_attempts enable row level security;

revoke all on public.login_attempts from anon, authenticated;

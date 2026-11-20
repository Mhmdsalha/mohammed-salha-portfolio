-- D1-1: dashboard login attempts, for the login rate limit (docs/DECISIONS.md D-018).
-- Only the service role touches this table and function: RLS is on with no policies,
-- and anon/authenticated have no grants, so they can neither read nor write it.

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  key_hash text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_key_time_idx
  on public.login_attempts (key_hash, attempted_at desc);

create index if not exists login_attempts_time_idx
  on public.login_attempts (attempted_at desc);

alter table public.login_attempts enable row level security;

revoke all on public.login_attempts from anon, authenticated;

-- Records one attempt and returns the counts that include it, in one transaction.
-- The advisory lock serialises concurrent logins, so a burst of parallel requests cannot all
-- read a count below the limit before any of them is recorded.
create or replace function public.register_login_attempt(
  p_key_hash text,
  p_window_seconds integer
)
returns table (key_count integer, global_count integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('public.login_attempts'));

  delete from public.login_attempts where attempted_at < now() - interval '1 day';

  insert into public.login_attempts (key_hash) values (p_key_hash);

  return query
    select
      (select count(*) from public.login_attempts a
        where a.key_hash = p_key_hash
          and a.attempted_at > now() - make_interval(secs => p_window_seconds))::integer,
      (select count(*) from public.login_attempts a
        where a.attempted_at > now() - make_interval(secs => p_window_seconds))::integer;
end;
$$;

revoke all on function public.register_login_attempt(text, integer) from public, anon, authenticated;
grant execute on function public.register_login_attempt(text, integer) to service_role;

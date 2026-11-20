-- D1-1: dashboard login attempts, for the login rate limit (docs/DECISIONS.md D-018).
-- Only the service role touches this table and function: RLS is on with no policies,
-- anon/authenticated have no grants, and the service role is granted exactly what it needs.

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
grant select, insert, delete on public.login_attempts to service_role;

-- Records one attempt and returns counts that include it, in one transaction.
--  * The advisory lock serialises concurrent logins, so a burst of parallel requests cannot all
--    read a count below the limit before any of them is recorded.
--  * A client already at p_max_per_key is answered "over the limit" WITHOUT storing the attempt,
--    and each client contributes at most p_max_per_key to the global count. One address can
--    therefore never push the global count up by itself; locking everyone out needs
--    (global limit / p_max_per_key) distinct addresses.
create or replace function public.register_login_attempt(
  p_key_hash text,
  p_window_seconds integer,
  p_max_per_key integer
)
returns table (key_count integer, global_count integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_since timestamptz := now() - make_interval(secs => p_window_seconds);
  v_key_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('public.login_attempts'));

  delete from public.login_attempts where attempted_at < now() - interval '1 day';

  select count(*)::integer into v_key_count
    from public.login_attempts a
    where a.key_hash = p_key_hash and a.attempted_at > v_since;

  if v_key_count < p_max_per_key then
    insert into public.login_attempts (key_hash) values (p_key_hash);
  end if;

  -- Counted as an attempt either way, so the caller sees max + 1 and refuses it.
  v_key_count := v_key_count + 1;

  return query
    select
      v_key_count,
      coalesce(sum(least(per_key.n, p_max_per_key)), 0)::integer
    from (
      select count(*) as n
        from public.login_attempts a
        where a.attempted_at > v_since
        group by a.key_hash
    ) per_key;
end;
$$;

revoke all on function public.register_login_attempt(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.register_login_attempt(text, integer, integer) to service_role;

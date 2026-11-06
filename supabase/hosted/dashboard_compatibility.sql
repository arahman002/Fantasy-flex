-- Audit copy of the migration already applied to the existing Fantasy flex project.
-- This is NOT a fresh-project migration: it requires the pre-existing membership schema.
alter table public.leagues
  add column if not exists scoring text not null default 'Points' check (scoring in ('Points','PPR','Half PPR','Head-to-head')),
  add column if not exists team_count integer not null default 12 check (team_count between 4 and 20),
  add column if not exists season integer not null default extract(year from now())::integer check (season between 2000 and 2200);
create schema if not exists flex_internal;
revoke all on schema flex_internal from public,anon,authenticated;
create function flex_internal.normalize_league_sport() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.sport := lower(new.sport); return new; end $$;
revoke all on function flex_internal.normalize_league_sport() from public,anon,authenticated;
create trigger flex_normalize_league_sport before insert on public.leagues for each row execute function flex_internal.normalize_league_sport();
-- Deferred membership creation preserves the existing create_league RPC, which
-- inserts its own commissioner membership before the transaction commits.
create function flex_internal.ensure_league_commissioner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is not null and (select auth.uid()) <> new.owner_id then
    raise exception 'League ownership mismatch' using errcode = '42501';
  end if;
  insert into public.memberships(league_id,user_id,role)
    values(new.id,new.owner_id,'commissioner') on conflict (league_id,user_id) do nothing;
  return new;
end $$;
revoke all on function flex_internal.ensure_league_commissioner() from public,anon,authenticated;
create constraint trigger flex_ensure_league_commissioner after insert on public.leagues
deferrable initially deferred for each row execute function flex_internal.ensure_league_commissioner();
-- Preserve the existing membership read policy. Owners must also be able to
-- read the INSERT RETURNING row before the deferred membership trigger runs.
create policy flex_owner_read on public.leagues for select to authenticated using ((select auth.uid())=owner_id);
create policy flex_owner_insert on public.leagues for insert to authenticated with check ((select auth.uid())=owner_id);
revoke all on public.leagues from anon;
revoke insert,update,delete,truncate,references,trigger on public.leagues from authenticated;
grant select on public.leagues to authenticated;
grant insert(name,sport,scoring,team_count,season,owner_id) on public.leagues to authenticated;
create index if not exists flex_leagues_owner_created_idx on public.leagues(owner_id,created_at desc);
notify pgrst,'reload schema';

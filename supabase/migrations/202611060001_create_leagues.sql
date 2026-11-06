-- Owned leagues only: no client can read or mutate another manager's data.
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(trim(name)) between 3 and 60),
  sport text not null check (sport in ('Football', 'Basketball', 'Baseball', 'Hockey')),
  scoring text not null check (scoring in ('Points', 'PPR', 'Half PPR', 'Head-to-head')),
  team_count integer not null check (team_count between 4 and 20),
  season integer not null check (season between 2000 and 2200),
  created_at timestamptz not null default now()
);
create index leagues_owner_created_idx on public.leagues(owner_id, created_at desc);
alter table public.leagues enable row level security;
revoke all on public.leagues from anon;
grant select, insert, update, delete on public.leagues to authenticated;
create policy "Owners can read leagues" on public.leagues for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners can create leagues" on public.leagues for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners can update leagues" on public.leagues for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners can delete leagues" on public.leagues for delete to authenticated using ((select auth.uid()) = owner_id);

-- Hosted-project verification. All synthetic users and leagues are rolled back.
begin;
insert into auth.users(id) values ('7abda17c-58df-48b3-b479-2087be5fae01'),('7abda17c-58df-48b3-b479-2087be5fae02');
select set_config('request.jwt.claim.sub','7abda17c-58df-48b3-b479-2087be5fae01',true);
set local role authenticated;
insert into public.leagues(name,sport,scoring,team_count,season,owner_id) values ('Flex verification temporary','Football','PPR',12,2026,'7abda17c-58df-48b3-b479-2087be5fae01');
select public.create_league(p_name=>'Existing RPC verification',p_sport=>'football',p_weeks=>16,p_contribution=>0,p_frequency=>'weekly',p_reserve=>0);
set constraints all immediate;
do $$ begin
 if (select count(*) from public.leagues where name='Flex verification temporary') <> 1 then raise exception 'Owner read failed'; end if;
 if not exists(select 1 from public.memberships m join public.leagues l on m.league_id=l.id where l.name='Flex verification temporary' and m.role='commissioner') then raise exception 'Commissioner membership missing'; end if;
 if (select sport from public.leagues where name='Flex verification temporary') <> 'football' then raise exception 'Sport normalization failed'; end if;
end $$;
select set_config('request.jwt.claim.sub','7abda17c-58df-48b3-b479-2087be5fae02',true);
do $$ begin
 if exists(select 1 from public.leagues where name in ('Flex verification temporary','Existing RPC verification')) then raise exception 'Other account read was allowed'; end if;
 begin
 insert into public.leagues(name,sport,scoring,team_count,season,owner_id) values ('Forbidden verification','Football','PPR',12,2026,'7abda17c-58df-48b3-b479-2087be5fae01');
 raise exception 'Other account insert was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
 perform 1 from public.leagues limit 1;
 raise exception 'Anonymous read was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: authenticated create/read, sport normalization, automatic commissioner membership, existing create_league RPC, cross-account isolation, anonymous denial. All test data rolled back.' as result;

-- Supabase backend functions for pickonemeal.com
-- Run these in the Supabase SQL editor after applying supabase_schema.sql

------------------------------------------------------------
-- 1) Enforce subscription on Dining Table creation
------------------------------------------------------------

create or replace function public.create_dining_table(
  p_name text,
  p_date date,
  p_meal_slot text
)
returns public.dining_tables
language plpgsql
security definer
as $$
declare
  v_owner_id uuid := auth.uid();
  v_table public.dining_tables;
  v_has_active_sub boolean;
  v_invite_token text := gen_random_uuid()::text;
begin
  if v_owner_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check active subscription
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = v_owner_id
      and s.status = 'active'
      and (s.renews_at is null or s.renews_at > now())
  ) into v_has_active_sub;

  if not v_has_active_sub then
    raise exception 'Subscription required to create Dining Tables';
  end if;

  insert into public.dining_tables (
    owner_id,
    name,
    date,
    meal_slot,
    status,
    invite_token
  )
  values (
    v_owner_id,
    p_name,
    p_date,
    p_meal_slot,
    'not_started',
    v_invite_token
  )
  returning * into v_table;

  -- Ensure owner is also a participant
  insert into public.dining_table_participants (table_id, user_id, role)
  values (v_table.id, v_owner_id, 'owner')
  on conflict (table_id, user_id) do nothing;

  return v_table;
end;
$$;

grant execute on function public.create_dining_table(text, date, text) to authenticated;

------------------------------------------------------------
-- 2) Start a voting round
------------------------------------------------------------

create or replace function public.start_round(p_table_id uuid)
returns public.voting_rounds
language plpgsql
security definer
as $$
declare
  v_owner_id uuid;
  v_caller_id uuid := auth.uid();
  v_next_round int;
  v_round public.voting_rounds;
begin
  if v_caller_id is null then
    raise exception 'Not authenticated';
  end if;

  select owner_id
  into v_owner_id
  from public.dining_tables
  where id = p_table_id;

  if v_owner_id is null then
    raise exception 'Dining Table not found';
  end if;

  if v_owner_id <> v_caller_id then
    raise exception 'Only the table owner can start a round';
  end if;

  -- Prevent multiple active rounds
  if exists (
    select 1 from public.voting_rounds
    where table_id = p_table_id and status = 'active'
  ) then
    raise exception 'There is already an active round for this table';
  end if;

  select coalesce(max(round_number), 0) + 1
  into v_next_round
  from public.voting_rounds
  where table_id = p_table_id;

  insert into public.voting_rounds (
    table_id,
    round_number,
    status,
    started_at,
    ends_at
  )
  values (
    p_table_id,
    v_next_round,
    'active',
    now(),
    now() + interval '1 hour'
  )
  returning * into v_round;

  -- Select 10 random active meals as candidates
  insert into public.round_meals (round_id, meal_id, position)
  select v_round.id, m.id, row_number() over ()
  from public.meals m
  where m.is_active = true
  order by random()
  limit 10;

  return v_round;
end;
$$;

grant execute on function public.start_round(uuid) to authenticated;

------------------------------------------------------------
-- 3) End a voting round with timeout logic
------------------------------------------------------------

create or replace function public.end_round(p_round_id uuid)
returns public.voting_rounds
language plpgsql
security definer
as $$
declare
  v_round public.voting_rounds;
  v_table_id uuid;
  v_winner_meal_id uuid;
begin
  select * into v_round
  from public.voting_rounds
  where id = p_round_id;

  if not found then
    raise exception 'Round not found';
  end if;

  if v_round.status <> 'active' then
    -- nothing to do
    return v_round;
  end if;

  v_table_id := v_round.table_id;

  -- 1) Try to pick a random meal from liked candidates in this round
  select rv.meal_id
  into v_winner_meal_id
  from public.round_votes rv
  where rv.round_id = p_round_id
    and rv.vote = 'like'
  order by random()
  limit 1;

  -- 2) If there are no liked votes, fallback to one of the last 3 winners for this table
  if v_winner_meal_id is null then
    select decided_meal_id
    into v_winner_meal_id
    from public.voting_rounds
    where table_id = v_table_id
      and decided_meal_id is not null
    order by started_at desc
    limit 1;
  end if;

  update public.voting_rounds
  set
    decided_meal_id = v_winner_meal_id,
    decision_reason = case when v_winner_meal_id is null then 'timeout_random' else 'timeout_random' end,
    status = 'timeout',
    updated_at = now()
  where id = p_round_id
  returning * into v_round;

  -- Award gamification points for this round (winner + participation)
  perform public.award_gamification_for_round(p_round_id);

  return v_round;
end;
$$;

grant execute on function public.end_round(uuid) to authenticated;

------------------------------------------------------------
-- 4) Process all expired rounds (for cron / scheduler)
------------------------------------------------------------

create or replace function public.process_expired_rounds()
returns integer
language plpgsql
security definer
as $$
declare
  v_round record;
  v_count integer := 0;
begin
  for v_round in
    select id
    from public.voting_rounds
    where status = 'active'
      and ends_at < now()
  loop
    perform public.end_round(v_round.id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.process_expired_rounds() to authenticated;

------------------------------------------------------------
-- 5) Gamification summary RPC (per user, current season)
------------------------------------------------------------

create or replace function public.get_gamification_summary(
  p_user_id uuid default auth.uid(),
  p_season_year integer default public.current_season_year()
)
returns table (
  table_id uuid,
  table_name text,
  season_year integer,
  total_points integer,
  meals_won integer,
  participation_rounds integer
)
language sql
security definer
as $$
  select
    gp.table_id,
    dt.name as table_name,
    gp.season_year,
    gp.total_points,
    gp.meals_won,
    gp.participation_rounds
  from public.gamification_points gp
  left join public.dining_tables dt
    on dt.id = gp.table_id
  where gp.user_id = coalesce(p_user_id, auth.uid())
    and gp.season_year = p_season_year
  order by gp.total_points desc nulls last;
$$;

grant execute on function public.get_gamification_summary(uuid, integer) to authenticated;

------------------------------------------------------------
-- 6) Create a meal function
------------------------------------------------------------

create or replace function public.create_meal(
  p_title text,
  p_description text default null,
  p_prep_time_minutes integer default null,
  p_image_url text default null
)
returns public.meals
language plpgsql
security definer
as $$
declare
  v_caller_id uuid := auth.uid();
  v_meal public.meals;
begin
  if v_caller_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.meals (
    title,
    description,
    prep_time_minutes,
    image_url,
    is_active
  )
  values (
    p_title,
    p_description,
    p_prep_time_minutes,
    p_image_url,
    true
  )
  returning * into v_meal;

  return v_meal;
end;
$$;

grant execute on function public.create_meal(text, text, integer, text) to authenticated;




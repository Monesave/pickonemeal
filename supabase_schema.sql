-- Supabase schema for pickonemeal.com
-- Run this in the Supabase SQL editor or via migrations.

-- 1) Profiles (extend auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email_normalized text unique,
  display_name text,
  avatar_url text,
  is_guest boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_profile_updated()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.handle_profile_updated();

-- 2) Subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text check (platform in ('web')),
  provider text,
  provider_sub_id text,
  status text check (status in ('active','canceled','expired','trial')),
  started_at timestamptz not null default now(),
  renews_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);

-- 3) Meals & taxonomy
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  prep_time_minutes integer,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cuisines (
  id serial primary key,
  name text not null unique
);

create table if not exists public.dietary_tags (
  id serial primary key,
  code text not null unique,
  label text not null
);

create table if not exists public.meal_cuisines (
  meal_id uuid not null references public.meals (id) on delete cascade,
  cuisine_id integer not null references public.cuisines (id) on delete cascade,
  primary key (meal_id, cuisine_id)
);

create table if not exists public.meal_dietary_tags (
  meal_id uuid not null references public.meals (id) on delete cascade,
  dietary_tag_id integer not null references public.dietary_tags (id) on delete cascade,
  primary key (meal_id, dietary_tag_id)
);

-- 4) Dining tables & rounds
create table if not exists public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  date date not null,
  meal_slot text not null check (meal_slot in ('breakfast','lunch','dinner')),
  status text not null default 'not_started'
    check (status in ('not_started','active','completed','archived')),
  invite_token text not null unique,
  dietary_filter_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  archived_at timestamptz
);

create index if not exists idx_dining_tables_owner_id on public.dining_tables (owner_id);

create table if not exists public.dining_table_participants (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.dining_tables (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz default now(),
  last_active_at timestamptz,
  unique (table_id, user_id)
);

create index if not exists idx_participants_table_id on public.dining_table_participants (table_id);
create index if not exists idx_participants_user_id on public.dining_table_participants (user_id);

create table if not exists public.voting_rounds (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.dining_tables (id) on delete cascade,
  round_number integer not null,
  status text not null default 'active'
    check (status in ('active','completed','timeout')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  decided_meal_id uuid references public.meals (id),
  decision_reason text check (decision_reason in ('consensus','timeout_random','timeout_history')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (table_id, round_number)
);

create index if not exists idx_voting_rounds_table_id on public.voting_rounds (table_id);

create table if not exists public.round_meals (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.voting_rounds (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  position integer,
  unique (round_id, meal_id)
);

create index if not exists idx_round_meals_round_id on public.round_meals (round_id);

create table if not exists public.round_votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.voting_rounds (id) on delete cascade,
  meal_id uuid not null references public.meals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote text not null check (vote in ('like','dislike','skip')),
  created_at timestamptz default now(),
  unique (round_id, meal_id, user_id)
);

create index if not exists idx_round_votes_round_id on public.round_votes (round_id);
create index if not exists idx_round_votes_user_id on public.round_votes (user_id);

-- 5) Solo planning & limits
create table if not exists public.user_daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  meal_slot text not null check (meal_slot in ('breakfast','lunch','dinner')),
  status text not null check (status in ('decided','skipped','none')),
  meal_id uuid references public.meals (id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, date, meal_slot)
);

create index if not exists idx_user_daily_plans_user_date on public.user_daily_plans (user_id, date);

create table if not exists public.user_swipe_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  swipe_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, date)
);

create index if not exists idx_swipe_counters_user_date on public.user_swipe_counters (user_id, date);

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dietary_tags_json jsonb,
  cuisine_ids_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_user_preferences_user_id on public.user_preferences (user_id);

-- 6) RLS (high-level; fine-tune in Supabase UI or additional scripts)
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.dining_tables enable row level security;
alter table public.dining_table_participants enable row level security;
alter table public.voting_rounds enable row level security;
alter table public.round_meals enable row level security;
alter table public.round_votes enable row level security;
alter table public.user_daily_plans enable row level security;
alter table public.user_swipe_counters enable row level security;
alter table public.user_preferences enable row level security;

alter table public.meals enable row level security;

create policy "Meals are viewable by everyone"
  on public.meals for select
  using (true);

create policy "Authenticated users can insert meals"
  on public.meals for insert
  with check (auth.role() = 'authenticated');

-- Example policy: user can view/update their own profile
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on public.profiles
  for update
  using (auth.uid() = id);



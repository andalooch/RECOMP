-- Run this in your Supabase SQL Editor (supabase.com → project → SQL Editor)

-- User profiles (extends Supabase auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  height_in integer default 74, -- 6'2" = 74 inches
  weight_lb numeric default 208,
  goal_weight_lb numeric default 195,
  age integer default 38,
  cal_goal integer default 2800,
  protein_goal integer default 215,
  carbs_goal integer default 270,
  fat_goal integer default 75,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Food logs
create table public.food_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  logged_date date not null,
  meal text not null check (meal in ('Breakfast','Lunch','Dinner','Snacks')),
  name text not null,
  calories integer not null default 0,
  protein numeric default 0,
  carbs numeric default 0,
  fat numeric default 0,
  portion_note text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Workout sessions
create table public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  logged_date date not null,
  workout_name text,
  rating numeric,
  cals_burned integer,
  analysis text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Exercises within a workout session
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.workout_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  sets jsonb not null default '[]', -- [{weight, reps}, ...]
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Weight check-ins for progress tracking
create table public.weight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  logged_date date not null,
  weight_lb numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, logged_date)
);

-- Row Level Security (users can only see their own data)
alter table public.profiles enable row level security;
alter table public.food_logs enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercises enable row level security;
alter table public.weight_logs enable row level security;

create policy "Users can manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users can manage own food" on public.food_logs for all using (auth.uid() = user_id);
create policy "Users can manage own workouts" on public.workout_sessions for all using (auth.uid() = user_id);
create policy "Users can manage own exercises" on public.exercises for all using (auth.uid() = user_id);
create policy "Users can manage own weight" on public.weight_logs for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

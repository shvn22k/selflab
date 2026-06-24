-- ============================================================================
-- SelfLab — initial schema (single-user, RLS-scoped to auth.uid())
-- Postgres / Supabase. Apply via `supabase db push` or the SQL editor.
-- ============================================================================

-- gen_random_uuid() is available in Supabase by default (pgcrypto).

-- ---------------------------------------------------------------------------
-- Profile (one row per user)
-- ---------------------------------------------------------------------------
create table if not exists public.profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade default auth.uid(),
  display_name text,
  sex text check (sex in ('male', 'female', 'other')),
  dob date,
  height_cm numeric,
  weight_kg numeric,
  target_weight_kg numeric,
  activity_level text default 'moderate'
    check (activity_level in ('sedentary','light','moderate','active','very_active')),
  goal text default 'lose_fat'
    check (goal in ('lose_fat','build_muscle','maintain','performance')),
  units text default 'metric' check (units in ('metric','imperial')),
  -- computed targets (kept on the row so the whole app reads one source)
  bmr numeric,
  tdee numeric,
  calorie_target numeric,
  protein_target_g numeric,
  carb_target_g numeric,
  fat_target_g numeric,
  water_target_ml numeric default 3000,
  step_target int default 9000,
  -- coach
  coach_name text default 'Atlas',
  coach_proactivity text default 'high' check (coach_proactivity in ('high','balanced','minimal')),
  integrations jsonb default '{}'::jsonb,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Exercise library (global rows have null user_id; users may add custom)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text,
  equipment text,
  category text default 'strength' check (category in ('strength','cardio','mobility','core')),
  is_compound boolean default false,
  instructions text,
  met numeric, -- metabolic equivalent for calorie estimates
  created_at timestamptz default now()
);

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  focus text,
  day_of_week int, -- 0..6, null = unscheduled
  color text,
  created_at timestamptz default now()
);

create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  exercise_name text not null,
  target_sets int default 3,
  target_reps int default 10,
  target_weight_kg numeric,
  rest_seconds int default 90,
  position int default 0
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  template_id uuid references public.workout_templates (id) on delete set null,
  name text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds int,
  total_volume_kg numeric,
  calories numeric,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.session_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  exercise_name text not null,
  set_index int default 1,
  reps int,
  weight_kg numeric,
  rpe numeric,
  is_warmup boolean default false,
  is_pr boolean default false,
  completed boolean default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Scheduling
-- ---------------------------------------------------------------------------
create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  kind text default 'workout' check (kind in ('workout','cardio','rest','meal','habit','custom')),
  date date not null,
  time time,
  template_id uuid references public.workout_templates (id) on delete set null,
  reminder_minutes int,
  done boolean default false,
  color text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Activity (Strava/Fit) + steps
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type text not null default 'run' check (type in ('run','walk','ride','hike','other')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds int,
  distance_m numeric,
  avg_pace_s_per_km numeric,
  elevation_gain_m numeric,
  calories numeric,
  avg_hr int,
  route jsonb, -- array of {lat,lng,t,alt}
  source text default 'app' check (source in ('app','health_connect','manual')),
  created_at timestamptz default now()
);

create table if not exists public.activity_splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  km int not null,
  pace_s numeric,
  elevation_m numeric
);

create table if not exists public.daily_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null,
  steps int default 0,
  distance_m numeric default 0,
  floors int default 0,
  active_minutes int default 0,
  source text default 'app',
  unique (user_id, date)
);

-- ---------------------------------------------------------------------------
-- Nutrition
-- ---------------------------------------------------------------------------
create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  serving_label text default '1 serving',
  serving_grams numeric,
  kcal numeric not null default 0,
  protein_g numeric default 0,
  carb_g numeric default 0,
  fat_g numeric default 0,
  barcode text,
  created_at timestamptz default now()
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  meal text default 'breakfast' check (meal in ('breakfast','lunch','dinner','snack')),
  food_id uuid references public.foods (id) on delete set null,
  name text not null,
  servings numeric default 1,
  kcal numeric default 0,
  protein_g numeric default 0,
  carb_g numeric default 0,
  fat_g numeric default 0,
  source text default 'manual' check (source in ('manual','search','barcode','ai_photo','ai_text')),
  created_at timestamptz default now()
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  ml int not null,
  created_at timestamptz default now()
);

create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  dose text,
  schedule_times text[], -- e.g. {'08:00','20:00'}
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  supplement_id uuid references public.supplements (id) on delete cascade,
  name text,
  taken_at timestamptz default now()
);

create table if not exists public.intake_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  kind text not null check (kind in ('caffeine','alcohol')),
  amount numeric, -- mg caffeine, or standard drinks
  label text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Body, recovery & health sync
-- ---------------------------------------------------------------------------
create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  weight_kg numeric,
  body_fat_pct numeric,
  waist_cm numeric,
  chest_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  resting_hr int,
  hrv_ms numeric,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  storage_path text not null,
  pose text default 'front' check (pose in ('front','side','back')),
  created_at timestamptz default now()
);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null,
  bedtime timestamptz,
  wake_time timestamptz,
  duration_minutes int,
  deep_minutes int,
  rem_minutes int,
  light_minutes int,
  awake_minutes int,
  quality int check (quality between 0 and 100),
  source text default 'manual',
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists public.readiness_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null,
  score int check (score between 0 and 100),
  recommendation text,
  factors jsonb,
  unique (user_id, date)
);

create table if not exists public.health_samples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type text not null, -- steps|heart_rate|resting_hr|hrv|sleep|weight|distance|active_energy
  value numeric,
  unit text,
  start_time timestamptz,
  end_time timestamptz,
  source text default 'health_connect',
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Wellbeing
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null,
  icon text,
  color text,
  schedule text default 'daily',
  target_per_day int default 1,
  reminder_time time,
  archived boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null default current_date,
  count int default 1,
  created_at timestamptz default now(),
  unique (user_id, habit_id, date)
);

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  mood int check (mood between 1 and 5),
  energy int check (energy between 1 and 5),
  stress int check (stress between 1 and 5),
  note text,
  created_at timestamptz default now()
);

create table if not exists public.meditation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind text default 'meditation' check (kind in ('meditation','breathwork')),
  minutes numeric,
  preset text,
  created_at timestamptz default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  mood int,
  energy int,
  stress int,
  soreness int,
  note text,
  created_at timestamptz default now(),
  unique (user_id, date)
);

-- ---------------------------------------------------------------------------
-- Coach
-- ---------------------------------------------------------------------------
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null,
  kind text not null check (kind in ('morning','evening')),
  content text,
  data jsonb,
  created_at timestamptz default now(),
  unique (user_id, date, kind)
);

create table if not exists public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null,
  plan jsonb,
  created_at timestamptz default now(),
  unique (user_id, date)
);

create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind text not null,
  message text not null,
  created_at timestamptz default now(),
  acknowledged boolean default false
);

-- ---------------------------------------------------------------------------
-- Meta
-- ---------------------------------------------------------------------------
create table if not exists public.health_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null,
  score int check (score between 0 and 100),
  breakdown jsonb,
  unique (user_id, date)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  metric text,
  target_value numeric,
  current_value numeric default 0,
  due_date date,
  achieved boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  code text not null,
  title text not null,
  description text,
  icon text,
  unlocked_at timestamptz default now(),
  unique (user_id, code)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  description text,
  metric text,
  target numeric,
  progress numeric default 0,
  start_date date default current_date,
  end_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  date date not null default current_date,
  title text,
  body text,
  voice_path text,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  owned_tables text[] := array[
    'profile','workout_templates','template_exercises','workout_sessions','session_sets',
    'schedule_blocks','activities','activity_splits','daily_steps','food_logs','water_logs',
    'supplements','supplement_logs','intake_logs','body_metrics','progress_photos','sleep_logs',
    'readiness_scores','health_samples','habits','habit_logs','mood_logs','meditation_sessions',
    'checkins','ai_messages','briefings','daily_plans','nudges','health_scores','goals',
    'achievements','challenges','journal_entries'
  ];
begin
  foreach t in array owned_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "owner_all" on public.%I;', t);
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end $$;

-- exercises & foods: global reference rows (null user_id) are readable by all;
-- users fully own their custom rows.
alter table public.exercises enable row level security;
drop policy if exists "exercises_read" on public.exercises;
create policy "exercises_read" on public.exercises for select to authenticated
  using (user_id is null or user_id = auth.uid());
drop policy if exists "exercises_write" on public.exercises;
create policy "exercises_write" on public.exercises for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.foods enable row level security;
drop policy if exists "foods_read" on public.foods;
create policy "foods_read" on public.foods for select to authenticated
  using (user_id is null or user_id = auth.uid());
drop policy if exists "foods_write" on public.foods;
create policy "foods_write" on public.foods for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Helpful indexes for date-range reads
-- ---------------------------------------------------------------------------
create index if not exists idx_food_logs_user_date on public.food_logs (user_id, date);
create index if not exists idx_water_logs_user_date on public.water_logs (user_id, date);
create index if not exists idx_sessions_user_started on public.workout_sessions (user_id, started_at);
create index if not exists idx_activities_user_started on public.activities (user_id, started_at);
create index if not exists idx_body_user_date on public.body_metrics (user_id, date);
create index if not exists idx_health_samples_user_type on public.health_samples (user_id, type, start_time);
create index if not exists idx_habit_logs_user_date on public.habit_logs (user_id, date);

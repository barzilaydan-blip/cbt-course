-- =========================================================
-- CBT Course — Database Schema
-- Run this in Supabase SQL Editor
-- =========================================================

-- ─── PROFILES ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  email text not null default '',
  role text not null default 'student' check (role in ('admin', 'student')),
  total_points integer not null default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins read all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins update all profiles"
  on profiles for update
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── MODULES ──────────────────────────────────────────────
create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  order_number integer not null unique,
  title_he text not null,
  description_he text,
  video_url text,
  article_url text,
  podcast_url text,
  is_published boolean default false,
  created_at timestamptz default now()
);

alter table modules enable row level security;

create policy "Authenticated users read published modules"
  on modules for select
  using (auth.uid() is not null and is_published = true);

create policy "Admins manage all modules"
  on modules for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── QUIZZES ──────────────────────────────────────────────
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules on delete cascade not null unique,
  questions jsonb not null default '[]'
  -- shape: [{question_he, options_he: string[], correct_index: number, explanation_he}]
);

alter table quizzes enable row level security;

create policy "Authenticated users read quizzes"
  on quizzes for select
  using (auth.uid() is not null);

create policy "Admins manage quizzes"
  on quizzes for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── PROGRESS ─────────────────────────────────────────────
create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  module_id uuid references modules on delete cascade not null,
  video_watched boolean default false,
  article_read boolean default false,
  quiz_completed boolean default false,
  quiz_score integer,
  practice_completed boolean default false,
  points_earned integer default 0,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique (user_id, module_id)
);

alter table progress enable row level security;

create policy "Users manage own progress"
  on progress for all
  using (auth.uid() = user_id);

create policy "Admins read all progress"
  on progress for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── DYNAMIC FORMULATION (Running Case) ───────────────────
create table if not exists dynamic_formulation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null unique,
  -- Presenting problem
  presenting_problem text,
  -- ABC / situational
  triggering_situation text,
  automatic_thoughts text,
  emotions text,
  physical_sensations text,
  behaviors text,
  -- Core beliefs (Schema level)
  core_beliefs_self text,
  core_beliefs_others text,
  core_beliefs_world text,
  -- Intermediate level
  intermediate_beliefs text,
  -- Behavioral patterns
  safety_behaviors text,
  avoidance_patterns text,
  -- Cognitive
  cognitive_distortions text[],
  -- Behavioral experiments (JSONB array)
  behavioral_experiments jsonb,
  -- Goals & history
  therapy_goals text,
  developmental_history text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table dynamic_formulation enable row level security;

create policy "Users manage own formulation"
  on dynamic_formulation for all
  using (auth.uid() = user_id);

create policy "Admins read all formulations"
  on dynamic_formulation for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ─── PRACTICE SESSIONS ────────────────────────────────────
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  module_id uuid references modules on delete cascade not null,
  conversation jsonb not null default '[]',
  -- shape: [{role: 'user'|'assistant', content: string, timestamp: string}]
  ai_feedback text,
  created_at timestamptz default now()
);

alter table practice_sessions enable row level security;

create policy "Users manage own sessions"
  on practice_sessions for all
  using (auth.uid() = user_id);

create policy "Admins read all sessions"
  on practice_sessions for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

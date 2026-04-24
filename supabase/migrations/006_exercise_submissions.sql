-- Migration 006: Clinical exercise submissions + AI pre-review
-- Run this in Supabase SQL Editor

create table if not exists exercise_submissions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references profiles on delete cascade not null,
  module_id           uuid references modules on delete cascade not null,
  answers             jsonb not null,
  status              text not null default 'submitted'
                        check (status in ('submitted', 'reviewed')),
  admin_feedback      text,
  points_awarded      integer default 0,
  ai_draft_feedback   text,
  ai_suggested_points integer,
  submitted_at        timestamptz not null default now(),
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now(),
  constraint exercise_submissions_unique unique (user_id, module_id)
);

alter table exercise_submissions enable row level security;

create policy "Users manage own submissions"
on exercise_submissions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins manage all submissions"
on exercise_submissions for all
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create index if not exists exercise_submissions_status_idx on exercise_submissions (status);
create index if not exists exercise_submissions_user_id_idx on exercise_submissions (user_id);

-- Add exercise_points to progress table
alter table progress add column if not exists exercise_points integer not null default 0;

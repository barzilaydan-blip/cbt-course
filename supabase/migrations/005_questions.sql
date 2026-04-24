-- Migration 005: Questions to lecturer
-- Run this in Supabase SQL Editor

create table if not exists questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles on delete cascade not null,
  group_id    uuid references groups on delete set null,
  type        text not null check (type in ('technical', 'professional')),
  content     text not null,
  status      text not null default 'pending' check (status in ('pending', 'answered')),
  admin_reply text,
  answered_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table questions enable row level security;

-- Students can insert and read their own questions
create policy "Users manage own questions"
on questions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Admins can read and update all questions
create policy "Admins manage all questions"
on questions for all
using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create index if not exists questions_user_id_idx on questions (user_id);
create index if not exists questions_status_idx on questions (status);
create index if not exists questions_group_id_idx on questions (group_id);

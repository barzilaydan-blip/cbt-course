-- =========================================================
-- Migration 002: Groups (Cohorts) + Resources + Chat
-- Run in Supabase SQL Editor AFTER 001_schema.sql
-- =========================================================

-- ─── GROUPS (Cohorts) ─────────────────────────────────────
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table groups enable row level security;

create policy "Admins manage groups"
  on groups for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Authenticated users read active groups"
  on groups for select
  using (auth.uid() is not null);

-- ─── ADD group_id TO PROFILES ─────────────────────────────
alter table profiles add column if not exists group_id uuid references groups(id) on delete set null;
create index if not exists profiles_group_id_idx on profiles(group_id);

-- ─── RESOURCES ────────────────────────────────────────────
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title_he text not null,
  description_he text,
  category text not null default 'כללי',
  file_url text not null,
  file_name text,
  file_type text,
  module_id uuid references modules(id) on delete set null,
  is_published boolean default false,
  created_at timestamptz default now()
);

alter table resources enable row level security;

create policy "Admins manage resources"
  on resources for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Students read published resources"
  on resources for select
  using (auth.uid() is not null and is_published = true);

-- ─── MESSAGES (Group Chat) ────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  group_id uuid references groups(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- Students can only read messages from their own group
create policy "Students read own group messages"
  on messages for select
  using (
    auth.uid() is not null
    and group_id = (select group_id from profiles where id = auth.uid())
  );

-- Students can only insert messages into their own group
create policy "Students insert own group messages"
  on messages for insert
  with check (
    auth.uid() = user_id
    and group_id = (select group_id from profiles where id = auth.uid())
  );

-- Admins can read all messages across all groups
create policy "Admins read all messages"
  on messages for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Admins can delete messages for moderation
create policy "Admins delete messages"
  on messages for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Enable Realtime for messages table
-- Run this in the Supabase dashboard: Realtime > Tables > enable for 'messages'
-- OR run: alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table messages;

-- ─── STORAGE BUCKET for resources ─────────────────────────
-- Run separately in Supabase dashboard > Storage > New bucket
-- Name: "resources", Public: true
-- OR uncomment:
-- insert into storage.buckets (id, name, public) values ('resources', 'resources', true) on conflict do nothing;

-- Storage RLS: allow admins to upload, everyone to read
-- insert into storage.policies (name, bucket_id, operation, definition) values
-- ('Admin upload', 'resources', 'INSERT', '{"role":"authenticated","check":{"exists":{"from":"profiles","where":{"id":"auth.uid()","role":"admin"}}}}'),
-- ('Public read', 'resources', 'SELECT', '{"role":"authenticated"}');

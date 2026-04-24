-- =========================================================
-- Migration 002: Groups (Cohorts) + Resources
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
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Students read active groups"
  on groups for select
  using (auth.uid() is not null and is_active = true);

-- ─── ADD group_id TO PROFILES ─────────────────────────────
alter table profiles
  add column if not exists group_id uuid references groups(id) on delete set null;

-- Index for fast group filtering
create index if not exists profiles_group_id_idx on profiles(group_id);

-- ─── RESOURCES ────────────────────────────────────────────
-- Storage bucket (run separately in Supabase dashboard if preferred):
-- insert into storage.buckets (id, name, public) values ('resources', 'resources', true);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title_he text not null,
  description_he text,
  category text not null default 'כללי',
  -- categories: 'טפסים וכלים' | 'חשיפה' | 'ניטור' | 'הרפיה' | 'כללי'
  file_url text not null,
  file_name text,
  file_type text,
  -- optional link to a specific module
  module_id uuid references modules(id) on delete set null,
  is_published boolean default false,
  created_at timestamptz default now()
);

alter table resources enable row level security;

create policy "Admins manage resources"
  on resources for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Students read published resources"
  on resources for select
  using (auth.uid() is not null and is_published = true);

-- ─── STORAGE BUCKET POLICY (run after creating 'resources' bucket) ──
-- Allow authenticated users to read
-- insert into storage.policies (bucket_id, name, definition)
-- values ('resources', 'Public read', '{"role":"authenticated","operation":"SELECT"}');

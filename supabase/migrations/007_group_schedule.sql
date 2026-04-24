-- Add course_start_date to groups
alter table groups add column if not exists course_start_date date;

-- Table for per-group per-module date overrides
create table if not exists group_module_dates (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups on delete cascade not null,
  module_id   uuid references modules on delete cascade not null,
  unlock_date date not null,
  created_at  timestamptz not null default now(),
  constraint group_module_dates_unique unique (group_id, module_id)
);
alter table group_module_dates enable row level security;
create policy "Admins manage group_module_dates" on group_module_dates for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Students read own group dates" on group_module_dates for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and group_id = group_module_dates.group_id
    )
  );

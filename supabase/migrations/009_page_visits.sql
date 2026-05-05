create table if not exists page_visits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles on delete cascade not null,
  module_id        uuid references modules on delete cascade not null,
  entered_at       timestamptz not null default now(),
  exited_at        timestamptz,
  duration_seconds integer,
  created_at       timestamptz not null default now()
);

alter table page_visits enable row level security;

create policy "Users insert own visits" on page_visits
  for insert with check (auth.uid() = user_id);

create policy "Users update own visits" on page_visits
  for update using (auth.uid() = user_id);

create policy "Admins read all visits" on page_visits
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create index if not exists page_visits_user_id_idx   on page_visits (user_id);
create index if not exists page_visits_module_id_idx on page_visits (module_id);
create index if not exists page_visits_entered_at_idx on page_visits (entered_at desc);

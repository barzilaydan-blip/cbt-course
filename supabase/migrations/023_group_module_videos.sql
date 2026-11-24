-- Session recordings are per-group (uploaded after each group's own live meeting),
-- unlike the rest of a module's content which is shared curriculum.
create table if not exists group_module_videos (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid references groups on delete cascade not null,
  module_id   uuid references modules on delete cascade not null,
  video_url   text not null,
  created_at  timestamptz not null default now(),
  constraint group_module_videos_unique unique (group_id, module_id)
);
alter table group_module_videos enable row level security;
create policy "Admins manage group_module_videos" on group_module_videos for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Students read own group videos" on group_module_videos for select
  using (exists (select 1 from profiles where id = auth.uid() and group_id = group_module_videos.group_id));

-- Migrate existing recordings (currently global) to the group they actually belong to
insert into group_module_videos (group_id, module_id, video_url)
select g.id, m.id, m.video_url
from modules m
cross join groups g
where m.video_url is not null and g.name = 'קורס מאי 2026'
on conflict (group_id, module_id) do nothing;

-- Clear the now-unused global field so no code path can accidentally leak it to another group
update modules set video_url = null;

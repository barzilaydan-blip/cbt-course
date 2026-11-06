-- Approved emails can be pre-tagged with a group so students are auto-assigned on first login
alter table approved_emails add column if not exists group_id uuid references groups(id) on delete set null;

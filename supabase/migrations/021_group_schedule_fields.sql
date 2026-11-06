-- Per-group schedule fields (Zoom, meeting day/time, syllabus) replacing the single global course_settings row
alter table groups add column if not exists zoom_url text;
alter table groups add column if not exists zoom_password text;
alter table groups add column if not exists meeting_day_he text;
alter table groups add column if not exists meeting_time text;
alter table groups add column if not exists syllabus_url text;

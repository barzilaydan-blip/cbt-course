-- Add is_async flag and publish the async modules
alter table modules add column if not exists is_async boolean not null default false;

update modules set is_async = true, is_published = true where order_number in (10, 11);

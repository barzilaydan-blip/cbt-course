-- Store individual question answers for analytics
alter table progress add column if not exists quiz_answers jsonb;

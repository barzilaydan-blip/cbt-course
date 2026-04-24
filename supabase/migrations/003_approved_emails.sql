-- Migration 003: Purchase-gated Google OAuth whitelist
-- Run this in Supabase SQL Editor

create table if not exists approved_emails (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  status            text not null default 'active'
                      check (status in ('active', 'pending_link', 'used', 'revoked')),
  source            text not null default 'manual'
                      check (source in ('manual', 'csv_import', 'smoove_webhook', 'zapier')),
  smoove_contact_id text,
  linked_user_id    uuid references auth.users on delete set null,
  notes             text,
  approved_at       timestamptz not null default now(),
  used_at           timestamptz,
  created_at        timestamptz not null default now(),
  constraint approved_emails_email_unique unique (email)
);

create index if not exists approved_emails_status_idx on approved_emails (status);

alter table approved_emails enable row level security;
-- No RLS policies = deny all for anon/authenticated roles
-- Only service role (SUPABASE_SERVICE_ROLE_KEY) can access this table

-- Function to mark an email as used when a user first logs in
create or replace function mark_approved_email_used(p_email text, p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  update approved_emails
  set
    status         = 'used',
    linked_user_id = p_user_id,
    used_at        = now()
  where email = p_email
    and status = 'active';
end;
$$;

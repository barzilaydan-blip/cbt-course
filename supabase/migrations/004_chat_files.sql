-- Migration 004: File uploads in group chat
-- Run this in Supabase SQL Editor

-- Add file columns to messages table
alter table messages add column if not exists file_url  text;
alter table messages add column if not exists file_name text;
alter table messages add column if not exists file_type text;

-- Allow content to be empty (for file-only messages)
alter table messages alter column content set default '';

-- Create storage bucket for chat files (public so images load inline)
insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', true)
on conflict (id) do nothing;

-- Storage RLS: authenticated users can upload
create policy "Authenticated users can upload chat files"
on storage.objects for insert to authenticated
with check (bucket_id = 'chat-files');

-- Storage RLS: authenticated users can read
create policy "Authenticated users can read chat files"
on storage.objects for select to authenticated
using (bucket_id = 'chat-files');

-- Storage RLS: users can delete their own files
create policy "Users can delete own chat files"
on storage.objects for delete to authenticated
using (bucket_id = 'chat-files' and auth.uid()::text = (storage.foldername(name))[1]);

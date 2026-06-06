-- ==========================================
-- Add profile fields for enhanced settings
-- Run this in Supabase SQL Editor
-- ==========================================

-- Add new columns to profiles
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists website text;
alter table profiles add column if not exists skills text[] default '{}';

-- Create avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload avatars
create policy "Users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Anyone can read avatars (public bucket)
create policy "Anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can update their own avatars
create policy "Users can update own avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatars
create policy "Users can delete own avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

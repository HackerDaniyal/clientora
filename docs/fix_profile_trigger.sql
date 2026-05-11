-- ==========================================
-- Quick Fix: Profile Trigger Setup
-- Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: Check if profiles table exists
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin', 'freelancer', 'member', 'client')),
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Step 2: Enable RLS
alter table profiles enable row level security;

-- Step 3: Drop old trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Step 4: Create the trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'freelancer'),
    coalesce(new.raw_user_meta_data->>'full_name', 'New User')
  );
  return new;
end;
$$;

-- Step 5: Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Step 6: Verify trigger exists
select trigger_name, event_object_table 
from information_schema.triggers 
where trigger_name = 'on_auth_user_created';

-- ==========================================
-- Test: Create a test profile manually
-- Uncomment the lines below to test
-- ==========================================

-- INSERT INTO auth.users (id, email, raw_user_meta_data)
-- VALUES (gen_random_uuid(), 'test@example.com', '{"role": "freelancer", "full_name": "Test User"}');
-- -- Check if profile was created:
-- SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;

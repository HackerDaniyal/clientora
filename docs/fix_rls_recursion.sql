-- ==========================================
-- Fix: Infinite Recursion in RLS Policy
-- Run this in Supabase SQL Editor
-- ==========================================

-- Drop ALL existing policies on profiles
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Enable insert for authentication" on profiles;

-- Recreate policies without recursion
-- Policy 1: Users can view their own profile
create policy "Users can view own profile" 
  on profiles for select 
  using (auth.uid() = id);

-- Policy 2: Users can update their own profile  
create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

-- Policy 3: Allow insert (for the trigger to work)
create policy "Enable insert for new users" 
  on profiles for insert 
  with check (true);

-- Policy 4: Admin view - uses JWT claim instead of querying profiles table
-- This avoids infinite recursion!
create policy "Admins can view all profiles" 
  on profiles for select 
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );

-- ==========================================
-- Alternative: Simpler approach without admin policy
-- If the above doesn't work, run this instead:
-- ==========================================

-- drop policy if exists "Admins can view all profiles" on profiles;
-- create policy "Users can view profiles" 
--   on profiles for select 
--   using (
--     auth.uid() = id OR 
--     auth.jwt() ->> 'role' = 'admin'
--   );

-- ==========================================
-- Verify policies
-- ==========================================
select schemaname, tablename, policyname, permissive, roles, cmd, qual
from pg_policies
where tablename = 'profiles';

-- =======================================================================================
-- Admin Dashboard RLS Bypass
-- =======================================================================================

-- 1. Create a secure function to check admin status without triggering RLS recursion
create or replace function public.is_admin()
returns boolean as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where id = auth.uid();
  return coalesce(user_role = 'admin', false);
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Grant Admins full SELECT access to profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" 
on public.profiles for select 
using ( public.is_admin() );

-- 3. Grant Admins full SELECT access to workspaces
drop policy if exists "Admins can view all workspaces" on public.workspaces;
create policy "Admins can view all workspaces" 
on public.workspaces for select 
using ( public.is_admin() );

-- 4. Grant Admins full SELECT access to project_requests
drop policy if exists "Admins can view all project_requests" on public.project_requests;
create policy "Admins can view all project_requests" 
on public.project_requests for select 
using ( public.is_admin() );

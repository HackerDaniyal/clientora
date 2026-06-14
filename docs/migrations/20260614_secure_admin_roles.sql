-- =======================================================================================
-- Secure Admin Roles: Prevent Privilege Escalation
-- =======================================================================================

-- 1. Modify the `handle_new_user` trigger to forcefully reject the 'admin' role.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text;
  assigned_role text;
begin
  requested_role := new.raw_user_meta_data->>'role';
  
  -- NEVER allow a user to sign up as admin
  if requested_role = 'admin' then
    assigned_role := 'freelancer'; -- Force fallback
  else
    assigned_role := coalesce(requested_role, 'freelancer');
  end if;

  insert into public.profiles (id, full_name, role, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    assigned_role,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create a trigger to prevent users from updating their own role column to admin.
create or replace function public.prevent_role_escalation()
returns trigger as $$
declare
  is_service_role boolean;
  current_role text;
begin
  -- If the role is being updated...
  if new.role is distinct from old.role then
    -- Allow the Supabase service_role (backend API) to do anything
    is_service_role := current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
    
    if not is_service_role then
      -- Check if the current user making the request is already an admin
      -- We must query the profiles table because metadata can't be fully trusted
      select role into current_role from public.profiles where id = auth.uid();
      
      if current_role != 'admin' then
        raise exception 'Permission denied: Only administrators can modify roles.';
      end if;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- 3. Attach the trigger to the profiles table
drop trigger if exists ensure_secure_role_update on public.profiles;

create trigger ensure_secure_role_update
  before update on public.profiles
  for each row execute procedure public.prevent_role_escalation();

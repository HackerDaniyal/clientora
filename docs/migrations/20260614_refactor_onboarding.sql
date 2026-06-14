-- 1. Drop NOT NULL constraint on role
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- 2. Add onboarding_completed column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 3. Update the trigger function to insert null role and onboarding_completed = false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url, onboarding_completed)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'), 
    NULL,
    NEW.raw_user_meta_data->>'avatar_url',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the prevent_role_escalation trigger to allow users to set their role during onboarding
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger AS $$
DECLARE
  is_service_role boolean;
  current_role text;
BEGIN
  -- If the role is being updated...
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow the Supabase service_role (backend API) to do anything
    is_service_role := current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
    
    IF NOT is_service_role THEN
      -- If the user's role is currently NULL, they are in onboarding and can set it to client or freelancer
      IF OLD.role IS NULL AND NEW.role IN ('client', 'freelancer') AND auth.uid() = OLD.id THEN
        -- Allow the update
      ELSE
        -- Check if the current user making the request is already an admin
        SELECT role INTO current_role FROM public.profiles WHERE id = auth.uid();
        
        IF current_role != 'admin' THEN
          RAISE EXCEPTION 'Permission denied: Only administrators can modify roles.';
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

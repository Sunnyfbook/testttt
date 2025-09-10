-- Fix the search path security issue
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing profiles
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- If this is the first user, make them admin
  IF user_count = 0 THEN
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (NEW.id, NEW.email, 'admin');
  ELSE
    INSERT INTO public.profiles (user_id, username, role)
    VALUES (NEW.id, NEW.email, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;
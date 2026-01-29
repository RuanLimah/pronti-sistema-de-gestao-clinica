
-- 1. ADD PHONE COLUMN TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2. UPDATE TRIGGER FUNCTION TO INCLUDE PHONE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_plan_id uuid;
BEGIN
  -- Get default plan (Basic)
  SELECT id INTO default_plan_id FROM public.plans WHERE type = 'basico' LIMIT 1;

  -- Create Profile
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone',
    'client'
  );

  -- Create Client entry
  INSERT INTO public.clients (id, plan_id, status, subscription_status)
  VALUES (new.id, default_plan_id, 'active', 'trial');
  
  -- Create Addon entries (all inactive by default)
  INSERT INTO public.client_addons (client_id, addon_id, status)
  SELECT new.id, id, 'inactive' FROM public.addons;

  RETURN new;
END;
$$;

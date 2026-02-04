-- ==============================================================================
-- FIX: CONSOLIDATED USER CREATION TRIGGER (V3)
-- This script fixes missing columns and creates a robust user creation flow.
-- ==============================================================================

-- 0. SCHEMA FIXES: Ensure profiles table has necessary columns
DO $$
BEGIN
    -- Add full_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name text;
    END IF;

    -- Add role if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;

    -- Drop constraint if exists to ensure we can use 'user' role
    -- We will re-add a check constraint if needed, but for now flexibility is safer
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- Add check constraint that accepts both 'user' and 'admin' (and maybe 'client' for legacy)
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'user', 'client'));
END $$;


-- 1. CLEANUP: Drop all possible existing triggers and functions to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP TRIGGER IF EXISTS on_new_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_main ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user_setup();
DROP FUNCTION IF EXISTS public.handle_new_user_client();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_main();

-- 2. CREATE FUNCTION: Single robust function to handle everything
CREATE OR REPLACE FUNCTION public.handle_new_user_main()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_plan_id uuid;
  user_role text;
  user_full_name text;
BEGIN
  -- Determine role based on email (Admin safety check)
  IF NEW.email = 'iruanlimah@gmail.com' THEN
    user_role := 'admin';
  ELSE
    user_role := 'user';
  END IF;

  -- Get full name safely
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  IF user_full_name IS NULL THEN
    user_full_name := split_part(NEW.email, '@', 1);
  END IF;

  -- 1. Create PROFILE
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    role = CASE WHEN public.profiles.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END;

  -- 2. Create CLIENT (Always 'CLIENTE', linked to 'user' profile)
  
  -- Get default plan (Gratuito)
  SELECT id INTO default_plan_id FROM public.plans WHERE type = 'gratuito' LIMIT 1;
  
  -- Fallback if gratuito not found, take any plan
  IF default_plan_id IS NULL THEN
    SELECT id INTO default_plan_id FROM public.plans LIMIT 1;
  END IF;

  -- If absolutely no plans exist, create a basic one
  IF default_plan_id IS NULL THEN
    INSERT INTO public.plans (name, type, price, limits, features) 
    VALUES ('Gratuito', 'gratuito', 0.00, '{"max_patients": 5}', '["prontuario_basico"]')
    RETURNING id INTO default_plan_id;
  END IF;

  INSERT INTO public.clients (id, name, email, plan_id, role, status, subscription_status)
  VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    default_plan_id,
    'CLIENTE', -- Always CLIENTE in this table
    'active',
    'trial'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user_main: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. CREATE TRIGGER: The one and only trigger
CREATE TRIGGER on_auth_user_created_main
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_main();

-- 4. VERIFICATION: Ensure existing users have data (Idempotent fix)
DO $$
DECLARE
  r record;
  default_plan_id uuid;
BEGIN
  SELECT id INTO default_plan_id FROM public.plans WHERE type = 'gratuito' LIMIT 1;
  
  FOR r IN SELECT * FROM auth.users LOOP
    -- Ensure Profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      r.id, 
      r.email, 
      COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)),
      CASE WHEN r.email = 'iruanlimah@gmail.com' THEN 'admin' ELSE 'user' END
    )
    ON CONFLICT (id) DO NOTHING;

    -- Ensure Client
    INSERT INTO public.clients (id, name, email, plan_id, role, status, subscription_status)
    VALUES (
      r.id,
      COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)),
      r.email,
      default_plan_id,
      'CLIENTE',
      'active',
      'trial'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;

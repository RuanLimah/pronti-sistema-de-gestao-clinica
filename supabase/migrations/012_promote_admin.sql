-- Grant admin role to iruanlimah@gmail.com
-- Run this in Supabase Dashboard > SQL Editor

UPDATE auth.users
SET raw_app_meta_data = 
  CASE 
    WHEN raw_app_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE jsonb_set(raw_app_meta_data, '{role}', '"admin"')
  END
WHERE email = 'iruanlimah@gmail.com';

-- Optional: Ensure profile exists (if you use profiles table for other things)
-- Note: The admin check primarily uses app_metadata, so this is secondary.

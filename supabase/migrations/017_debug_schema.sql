-- DIAGNOSTIC AND REPAIR SCRIPT
-- Run this to check schema and try to force repair permissions

BEGIN;

-- 1. Check if tables exist (this is for debug output in SQL Editor)
SELECT 
    table_schema, 
    table_name, 
    is_insertable_into
FROM 
    information_schema.tables 
WHERE 
    table_name IN ('addons', 'plans', 'client_addons');

-- 2. Force Permissions AGAIN (Brute force fix)
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addons ENABLE ROW LEVEL SECURITY;

-- Allow everything for postgres/service_role
GRANT ALL ON public.addons TO postgres, service_role, authenticated;
GRANT ALL ON public.client_addons TO postgres, service_role, authenticated;

-- Recreate Policies with simplest possible logic
DROP POLICY IF EXISTS "Public read addons" ON public.addons;
CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage addons" ON public.addons;
CREATE POLICY "Admin manage addons" ON public.addons FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS "Admin manage client_addons" ON public.client_addons;
CREATE POLICY "Admin manage client_addons" ON public.client_addons FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 3. CRITICAL: Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

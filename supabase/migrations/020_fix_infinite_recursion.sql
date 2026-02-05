BEGIN;

-- 1. Create a Secure Function to Check Admin Status
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres),
-- bypassing RLS checks on the 'clients' table to avoid infinite recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'ADMIN')
  );
$$;

-- 2. Fix Recursive Policy on 'clients' table
DROP POLICY IF EXISTS "Admin can read all clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can view all clients" ON public.clients; -- Drop potential duplicate names
DROP POLICY IF EXISTS "Admin can read all clients" ON public.clients;

-- Re-create with the safe function
CREATE POLICY "Admins can manage all clients" ON public.clients
FOR ALL
USING (is_admin());

-- Ensure users can still read their own data (non-recursive)
DROP POLICY IF EXISTS "User can read own client" ON public.clients;
CREATE POLICY "User can read own client" ON public.clients
FOR SELECT
USING (auth.uid() = id);

-- 3. Update 'plans' Policy to use the safe function
DROP POLICY IF EXISTS "Admin manage plans" ON public.plans;
CREATE POLICY "Admin manage plans" ON public.plans FOR ALL USING (is_admin());

-- 4. Update 'addons' Policy to use the safe function
DROP POLICY IF EXISTS "Admin manage addons" ON public.addons;
CREATE POLICY "Admin manage addons" ON public.addons FOR ALL USING (is_admin());

-- 5. Update 'client_addons' Policy to use the safe function
DROP POLICY IF EXISTS "Admin manage client_addons" ON public.client_addons;
CREATE POLICY "Admin manage client_addons" ON public.client_addons FOR ALL USING (is_admin());

-- 6. Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;

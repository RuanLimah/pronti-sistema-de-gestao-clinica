BEGIN;

-- 1. Fix RLS for Plans
DROP POLICY IF EXISTS "Admin manage plans" ON public.plans;
CREATE POLICY "Admin manage plans" ON public.plans FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
  ) OR 
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 2. Fix RLS for Addons
DROP POLICY IF EXISTS "Admin manage addons" ON public.addons;
CREATE POLICY "Admin manage addons" ON public.addons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
  ) OR 
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 3. Fix RLS for Client Addons
DROP POLICY IF EXISTS "Admin manage client_addons" ON public.client_addons;
CREATE POLICY "Admin manage client_addons" ON public.client_addons FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'ADMIN')
  ) OR 
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Force schema reload
NOTIFY pgrst, 'reload schema';

COMMIT;

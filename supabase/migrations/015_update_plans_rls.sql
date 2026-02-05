-- 1. Enable RLS and Policies for Plans (Admin CRUD)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read plans" ON public.plans;
CREATE POLICY "Public read plans" ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage plans" ON public.plans;
CREATE POLICY "Admin manage plans" ON public.plans FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'service_role' OR -- Fallback if role in metadata
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 2. Enable RLS and Policies for Addons (Admin CRUD)
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read addons" ON public.addons;
CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage addons" ON public.addons;
CREATE POLICY "Admin manage addons" ON public.addons FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 3. Enable RLS and Policies for Client Addons (Admin CRUD)
ALTER TABLE public.client_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage client_addons" ON public.client_addons;
CREATE POLICY "Admin manage client_addons" ON public.client_addons FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- FIX: Ensure Addons table exists and Schema Cache is reloaded
-- Run this in Supabase Dashboard > SQL Editor

BEGIN;

-- 1. Ensure Addons Table exists
CREATE TABLE IF NOT EXISTS public.addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    price numeric NOT NULL DEFAULT 0,
    active boolean DEFAULT true,
    category text,
    icon text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Ensure Client Addons Table exists
CREATE TABLE IF NOT EXISTS public.client_addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    addon_id uuid REFERENCES public.addons(id) ON DELETE CASCADE,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. Reset RLS Policies to ensure visibility
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addons ENABLE ROW LEVEL SECURITY;

-- Addons: Public Read, Admin Write
DROP POLICY IF EXISTS "Public read addons" ON public.addons;
CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage addons" ON public.addons;
CREATE POLICY "Admin manage addons" ON public.addons FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Client Addons: Admin Full Access
DROP POLICY IF EXISTS "Admin manage client_addons" ON public.client_addons;
CREATE POLICY "Admin manage client_addons" ON public.client_addons FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- 4. Grant Permissions explicitly (fixes some visibility issues)
GRANT SELECT ON public.addons TO anon, authenticated, service_role;
GRANT ALL ON public.addons TO service_role;
GRANT ALL ON public.client_addons TO service_role;

-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';

COMMIT;

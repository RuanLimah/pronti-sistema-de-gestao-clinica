-- MIGRATION: Create Addons Tables (Robust Version)
-- Run this entire script in Supabase SQL Editor to fix "relation does not exist" errors.

BEGIN;

-- 1. Create Addons Table
CREATE TABLE IF NOT EXISTS public.addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric NOT NULL DEFAULT 0,
    active boolean DEFAULT true,
    category text,
    icon text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Safely add unique constraint to slug if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'addons_slug_key') THEN
        ALTER TABLE public.addons ADD CONSTRAINT addons_slug_key UNIQUE (slug);
    END IF;
END $$;

-- 2. Create Client Addons Table
CREATE TABLE IF NOT EXISTS public.client_addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    addon_id uuid REFERENCES public.addons(id) ON DELETE CASCADE,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addons ENABLE ROW LEVEL SECURITY;

-- 4. Grant Permissions (Broad permissions to fix access issues)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.addons TO postgres, service_role, authenticated, anon;
GRANT ALL ON TABLE public.client_addons TO postgres, service_role, authenticated, anon;

-- 5. Create/Recreate Policies

-- Addons Policies
DROP POLICY IF EXISTS "Public read addons" ON public.addons;
CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage addons" ON public.addons;
CREATE POLICY "Admin manage addons" ON public.addons FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'service_role'
);

-- Client Addons Policies
DROP POLICY IF EXISTS "Admin manage client_addons" ON public.client_addons;
CREATE POLICY "Admin manage client_addons" ON public.client_addons FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'service_role'
);

-- 6. Seed Data (Only if empty)
INSERT INTO public.addons (name, slug, price, description, active, category)
VALUES 
    ('Exportação PDF Extra', 'pdf_extra', 19.90, 'Pacote adicional de exportações', true, 'recursos'),
    ('Profissional Extra', 'user_extra', 49.90, 'Adicione mais um profissional à equipe', true, 'usuarios'),
    ('Relatórios Avançados', 'reports_advanced', 29.90, 'Relatórios de BI e insights', true, 'recursos'),
    ('Auditoria Premium', 'audit_premium', 39.90, 'Logs detalhados de 5 anos', true, 'seguranca')
ON CONFLICT (slug) DO NOTHING;

-- 7. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';

COMMIT;

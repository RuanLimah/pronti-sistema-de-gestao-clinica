-- Migration: Setup Addons
-- Defines tables for Addons and Client Addons

BEGIN;

-- 1. Addons Table
CREATE TABLE IF NOT EXISTS public.addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    price numeric NOT NULL DEFAULT 0,
    active boolean DEFAULT true,
    category text, -- 'relatorios', 'usuarios', 'integracao', etc.
    icon text,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Client Addons (Link between Clients and Addons)
CREATE TABLE IF NOT EXISTS public.client_addons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    addon_id uuid REFERENCES public.addons(id) ON DELETE CASCADE,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addons ENABLE ROW LEVEL SECURITY;

-- Public read access for addons
CREATE POLICY "Public read addons" ON public.addons FOR SELECT USING (true);

-- Admin read access for client_addons
CREATE POLICY "Admin read client_addons" ON public.client_addons FOR SELECT USING (true);

-- 4. Seed Addons
INSERT INTO public.addons (name, slug, price, description, active, category)
VALUES 
    ('Exportação PDF Extra', 'pdf_extra', 19.90, 'Pacote adicional de exportações', true, 'recursos'),
    ('Profissional Extra', 'user_extra', 49.90, 'Adicione mais um profissional à equipe', true, 'usuarios'),
    ('Relatórios Avançados', 'reports_advanced', 29.90, 'Relatórios de BI e insights', true, 'recursos'),
    ('Auditoria Premium', 'audit_premium', 39.90, 'Logs detalhados de 5 anos', true, 'seguranca');

COMMIT;

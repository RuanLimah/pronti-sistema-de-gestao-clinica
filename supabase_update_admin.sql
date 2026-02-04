
-- Create client_addons table to link clients (doctors) with addons
CREATE TABLE IF NOT EXISTS public.client_addons (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  addon_slug text references public.addons(slug) on delete cascade not null,
  status text check (status in ('active', 'inactive', 'trial')) default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(client_id, addon_slug)
);

-- Enable RLS
ALTER TABLE public.client_addons ENABLE ROW LEVEL SECURITY;

-- Policies for client_addons
DROP POLICY IF EXISTS "Admins can manage client addons" ON public.client_addons;
CREATE POLICY "Admins can manage client addons" ON public.client_addons
  USING (is_admin());

DROP POLICY IF EXISTS "Clients can view own addons" ON public.client_addons;
CREATE POLICY "Clients can view own addons" ON public.client_addons
  FOR SELECT USING (auth.uid() = client_id);

-- Add modules column to clients table for feature toggles
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS modules jsonb default '{"agenda": true, "financeiro": true, "whatsapp": true, "relatorios": true, "prontuario": true}';

-- Ensure is_admin function exists
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

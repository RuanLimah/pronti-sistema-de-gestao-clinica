-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- ADDONS TABLE
CREATE TABLE IF NOT EXISTS public.addons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null,
  icon text,
  active boolean default true,
  category text,
  created_at timestamp with time zone default now()
);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid,
  admin_name text,
  target_id uuid,
  target_name text,
  action text,
  details text,
  old_value text,
  new_value text,
  created_at timestamp with time zone default now()
);

-- RLS
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES for ADDONS
DROP POLICY IF EXISTS "Public can view addons" ON public.addons;
CREATE POLICY "Public can view addons" ON public.addons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage addons" ON public.addons;
CREATE POLICY "Authenticated can manage addons" ON public.addons USING (auth.role() = 'authenticated');

-- POLICIES for AUDIT LOGS
DROP POLICY IF EXISTS "Authenticated can view audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can view audit logs" ON public.audit_logs FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default addons if not exist
INSERT INTO public.addons (name, slug, description, price, icon, category)
VALUES 
('WhatsApp Automático', 'whatsapp-auto', 'Lembretes automáticos, confirmação de consulta e mensagens personalizadas via WhatsApp.', 29.90, 'message-square', 'comunicacao'),
('Armazenamento Extra', 'storage-extra', 'Expansão de espaço para exames, documentos, PDFs e imagens médicas.', 19.90, 'hard-drive', 'armazenamento'),
('Relatórios Avançados', 'advanced-reports', 'Filtros por período, gráficos comparativos, histórico completo e exportação detalhada.', 14.90, 'bar-chart', 'relatorios')
ON CONFLICT (slug) DO NOTHING;

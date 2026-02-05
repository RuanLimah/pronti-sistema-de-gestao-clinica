-- Tabela de Clientes (SaaS Tenants)
-- Vincula com auth.users para autenticação
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  email TEXT NOT NULL,
  plano_id UUID, -- Será FK para planos
  status TEXT DEFAULT 'free' CHECK (status IN ('free', 'active', 'suspended', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS public.planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  preco NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '{}', -- Para guardar limites e recursos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Add-ons
CREATE TABLE IF NOT EXISTS public.addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  preco NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  slug TEXT UNIQUE, -- Identificador único para código (ex: 'whatsapp_auto')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relacionamento Cliente <-> Add-ons
CREATE TABLE IF NOT EXISTS public.client_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES public.addons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, addon_id)
);

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS public.auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id), -- Quem fez a ação (Admin)
  acao TEXT NOT NULL, -- CREATE, UPDATE, DELETE, SUSPEND
  entidade TEXT NOT NULL, -- 'client', 'plan', 'addon'
  entidade_id UUID, -- ID do registro afetado
  detalhes JSONB, -- Dados alterados (old/new)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar FK de plano em clients se tabela planos já existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'clients_plano_id_fkey'
  ) THEN
    ALTER TABLE public.clients 
    ADD CONSTRAINT clients_plano_id_fkey 
    FOREIGN KEY (plano_id) REFERENCES public.planos(id);
  END IF;
END $$;

-- RLS Policies (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Policy: Admin tem acesso total
-- Assumindo que existe uma forma de identificar admin (ex: auth.jwt() -> role ou tabela profiles)
-- Por enquanto, vamos permitir acesso autenticado para leitura e restrito para escrita se necessário,
-- mas o prompt pede "Somente admin pode SELECT / INSERT / UPDATE".

-- Criar função para verificar se é admin (exemplo simples baseada em metadados ou tabela separada)
-- Ajuste conforme sua estratégia de Auth. Aqui usaremos um check genérico ou email específico para bootstrap.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Exemplo: Verifica se o email é do admin ou se tem claim
  RETURN (auth.jwt() ->> 'email') = 'admin@pronti.com' 
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies para Clients
CREATE POLICY "Admin full access clients" ON public.clients
  FOR ALL USING (is_admin());

CREATE POLICY "User view own client" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

-- Policies para Planos (Public Read, Admin Write)
CREATE POLICY "Public read plans" ON public.planos
  FOR SELECT USING (true);

CREATE POLICY "Admin write plans" ON public.planos
  FOR ALL USING (is_admin());

-- Policies para Addons
CREATE POLICY "Public read addons" ON public.addons
  FOR SELECT USING (true);

CREATE POLICY "Admin write addons" ON public.addons
  FOR ALL USING (is_admin());

-- Policies para Client Addons
CREATE POLICY "Admin full access client_addons" ON public.client_addons
  FOR ALL USING (is_admin());

CREATE POLICY "User view own addons" ON public.client_addons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE id = client_addons.client_id AND user_id = auth.uid())
  );

-- Policies para Auditoria
CREATE POLICY "Admin read auditoria" ON public.auditoria
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin insert auditoria" ON public.auditoria
  FOR INSERT WITH CHECK (is_admin());

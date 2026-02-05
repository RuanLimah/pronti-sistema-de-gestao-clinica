-- ==============================================================================
-- SCRIPT DE ATUALIZAÇÃO DA TABELA CLIENTS (SAAS) E TRIGGERS
-- Execute este script no SQL Editor do Supabase para garantir a estrutura correta.
-- ==============================================================================

-- 1. Garantir que a tabela clients existe e tem a estrutura base
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nome text,
  plan_id uuid references public.plans(id), -- Referência à tabela plans (inglês)
  status text default 'active',
  role text default 'CLIENTE',
  limite_pacientes integer default 10,
  limite_armazenamento integer default 50,
  last_sign_in_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Adicionar colunas caso a tabela já exista (migração segura)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CLIENTE';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS limite_pacientes INTEGER DEFAULT 10;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS limite_armazenamento INTEGER DEFAULT 50;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE;

-- 3. Corrigir FK se estiver apontando para tabela errada ou com nome antigo
-- (Se existir coluna plano_id antiga, podemos renomear ou manter como legado, 
--  mas aqui focamos em garantir plan_id)
DO $$
BEGIN
  -- Se plan_id não existir mas plano_id existir, renomear (opcional, cuidado com dados)
  -- IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='plano_id') THEN
  --   ALTER TABLE public.clients RENAME COLUMN plano_id TO plan_id;
  -- END IF;
  NULL;
END $$;

-- 4. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. TRIGGER AUTOMÁTICO: Criar Cliente ao criar Usuário (Auth)
-- Garante que todo usuário novo tenha um registro em clients com plano FREE
CREATE OR REPLACE FUNCTION public.handle_new_user_client()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id uuid;
BEGIN
  -- Buscar ID do plano gratuito (type = 'free' ou 'gratuito')
  SELECT id INTO v_plan_id FROM public.plans WHERE type IN ('free', 'gratuito') LIMIT 1;
  
  INSERT INTO public.clients (id, email, nome, plan_id, status, role, limite_pacientes, limite_armazenamento)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    v_plan_id, -- Pode ser null se não achar plano, mas o registro é criado
    'active',
    'CLIENTE',
    10, -- Limites padrão do Free
    50
  )
  ON CONFLICT (id) DO NOTHING; -- Se já existir (criado por outro trigger), não faz nada
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger antigo se existir com outro nome
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;

-- Cria o trigger
CREATE TRIGGER on_auth_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_client();

-- 6. Atualizar clientes existentes que não tenham limites definidos
UPDATE public.clients SET limite_pacientes = 10 WHERE limite_pacientes IS NULL;
UPDATE public.clients SET limite_armazenamento = 50 WHERE limite_armazenamento IS NULL;
UPDATE public.clients SET status = 'active' WHERE status IS NULL;

-- 7. Garantir RLS (Segurança)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access clients" ON public.clients;
CREATE POLICY "Admin full access clients" ON public.clients
  FOR ALL USING (
    -- Admin check simplificado: verifica se o usuário atual tem role 'admin' em profiles ou clients
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM public.clients WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "User view own client" ON public.clients;
CREATE POLICY "User view own client" ON public.clients
  FOR SELECT USING (auth.uid() = id);

-- 8. Tabela de Auditoria (para logs do admin)
CREATE TABLE IF NOT EXISTS public.auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  detalhes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read auditoria" ON public.auditoria;
CREATE POLICY "Admin read auditoria" ON public.auditoria
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin insert auditoria" ON public.auditoria;
CREATE POLICY "Admin insert auditoria" ON public.auditoria
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

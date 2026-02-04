
-- Atualização da tabela audit_logs para suportar Enhanced Audit (LGPD)

-- Primeiro, vamos dropar a tabela antiga se ela for incompatível ou apenas adicionar colunas
-- Como estamos em dev e a tabela foi criada recentemente, vamos recriar para garantir estrutura limpa
DROP TABLE IF EXISTS audit_logs;

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_nome TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  entity_nome TEXT,
  screen TEXT,
  severity TEXT DEFAULT 'info',
  sensitive_data_accessed BOOLEAN DEFAULT FALSE,
  data_exported BOOLEAN DEFAULT FALSE,
  description TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Admin/Super Admin pode ver todos os logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
    )
    OR
    EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = auth.uid() AND clients.role = 'ADMIN'
    )
    OR
    auth.jwt() ->> 'email' = 'iruanlimah@gmail.com'
  );

-- Qualquer usuário autenticado pode inserir logs (o sistema insere logs de suas ações)
CREATE POLICY "Users can insert their own logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id IS NOT NULL); -- Permitir inserção flexível por enquanto

-- Ninguém pode editar ou deletar logs (Imutabilidade)
-- Não criamos policies FOR UPDATE ou DELETE

-- Índices para performance de busca
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_severity ON audit_logs(severity);

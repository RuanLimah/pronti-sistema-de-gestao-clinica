-- ============================================================
-- SCRIPT DE CORREÇÃO DOS PLANOS (SEM DELETE)
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Garante que o campo 'type' seja único para permitir o UPSERT
-- Se houver duplicatas de 'type' no banco, este passo pode falhar. 
-- Nesse caso, você precisará remover as duplicatas manualmente antes.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plans_type_key') THEN
        ALTER TABLE public.plans ADD CONSTRAINT plans_type_key UNIQUE (type);
    END IF;
EXCEPTION
    WHEN OTHERS THEN 
        RAISE NOTICE 'Não foi possível adicionar constraint unique em type. Verifique duplicatas.';
END $$;

-- 2. Insere ou Atualiza os planos oficiais
INSERT INTO public.plans (name, type, price, subtitle, highlighted, marketing_features, limits, features, active)
VALUES 
(
  'Gratuito', 
  'gratuito', 
  0, 
  'Para conhecer', 
  false, 
  '[
    {"text": "Agenda básica", "included": true},
    {"text": "Até 10 pacientes", "included": true},
    {"text": "10 atendimentos/mês", "included": true},
    {"text": "Prontuário básico", "included": true},
    {"text": "Financeiro", "included": true},
    {"text": "Relatórios", "included": true},
    {"text": "Começar grátis", "included": true}
  ]',
  '{"max_patients": 10, "max_medical_records": null, "max_users": 1}',
  '["agenda", "prontuario", "financeiro", "relatorios"]',
  true
),
(
  'Essencial', 
  'essencial', 
  79, 
  'COMEÇAR', 
  true, 
  '[
    {"text": "Agenda completa", "included": true},
    {"text": "Até 50 pacientes", "included": true},
    {"text": "Prontuário digital", "included": true},
    {"text": "Financeiro básico", "included": true},
    {"text": "Relatórios simples", "included": true},
    {"text": "Suporte por email", "included": true},
    {"text": "Auditoria", "included": true},
    {"text": "Exportação PDF", "included": true},
    {"text": "Assinar Essencial", "included": true}
  ]',
  '{"max_patients": 50, "max_medical_records": null, "max_users": 1}',
  '["agenda", "prontuario", "financeiro", "relatorios", "suporte_email", "auditoria", "export_pdf"]',
  true
),
(
  'Profissional', 
  'profissional', 
  149, 
  'CRESCER', 
  false, 
  '[
    {"text": "Tudo do Essencial +", "included": true},
    {"text": "Pacientes ilimitados", "included": true},
    {"text": "Financeiro avançado", "included": true},
    {"text": "Relatórios completos", "included": true},
    {"text": "Exportação PDF", "included": true},
    {"text": "Auditoria completa", "included": true},
    {"text": "Suporte prioritário", "included": true},
    {"text": "Assinar Profissional", "included": true}
  ]',
  '{"max_patients": null, "max_medical_records": null, "max_users": 1}',
  '["agenda", "prontuario", "financeiro_avancado", "relatorios_completos", "export_pdf", "auditoria_completa", "suporte_prioritario"]',
  true
),
(
  'Clínica', 
  'clinica', 
  299, 
  'ESCALAR', 
  false, 
  '[
    {"text": "Tudo do Profissional +", "included": true},
    {"text": "Múltiplos profissionais", "included": true},
    {"text": "Gestão de equipe", "included": true},
    {"text": "Relatórios gerenciais", "included": true},
    {"text": "API de integração", "included": true},
    {"text": "Suporte dedicado", "included": true},
    {"text": "Treinamento incluso", "included": true},
    {"text": "Falar com vendas", "included": true}
  ]',
  '{"max_patients": null, "max_medical_records": null, "max_users": 10}',
  '["agenda", "prontuario", "financeiro_avancado", "relatorios_gerenciais", "api", "suporte_dedicado", "treinamento", "multi_usuario"]',
  true
)
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  subtitle = EXCLUDED.subtitle,
  highlighted = EXCLUDED.highlighted,
  marketing_features = EXCLUDED.marketing_features,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  active = EXCLUDED.active;

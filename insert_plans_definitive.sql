-- ============================================================
-- SCRIPT DE CORREÇÃO DEFINITIVA DOS PLANOS
-- Execute este script completo no SQL Editor do Supabase
-- ============================================================

-- 1. Remove planos antigos que não sejam os 4 oficiais (opcional, para limpar duplicatas antigas)
-- CUIDADO: Isso remove planos que não tenham os tipos abaixo.
DELETE FROM public.plans 
WHERE type NOT IN ('gratuito', 'essencial', 'profissional', 'clinica');

-- 2. Insere ou Atualiza os 4 planos oficiais
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
    {"text": "Relatórios", "included": true}
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
    {"text": "Exportação PDF", "included": true}
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
    {"text": "Suporte prioritário", "included": true}
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
    {"text": "Treinamento incluso", "included": true}
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

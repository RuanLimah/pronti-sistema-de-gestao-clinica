-- Migration: Setup Plans Schema
-- Defines tables for Plans with all required fields

BEGIN;

-- 1. Plans Table
CREATE TABLE IF NOT EXISTS public.plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL, -- 'gratuito', 'essencial', 'profissional', 'clinica'
    price numeric NOT NULL DEFAULT 0,
    subtitle text,
    description text,
    active boolean DEFAULT true,
    highlighted boolean DEFAULT false,
    
    -- Limits (stored as JSONB for flexibility)
    -- { max_patients: number, max_appointments: number, max_users: number, etc. }
    limits jsonb DEFAULT '{}'::jsonb,
    
    -- Features (System-level flags)
    -- ['agenda_completa', 'prontuario_digital', 'financeiro_avancado', 'auditoria', 'exportacao_pdf', 'api_integracao']
    features text[] DEFAULT '{}',
    
    -- Marketing Features (Display only)
    -- [{ text: "Agenda Básica", included: true }, { text: "Suporte 24h", included: false }]
    marketing_features jsonb DEFAULT '[]'::jsonb,
    
    -- CTA
    cta_text text DEFAULT 'Começar agora',
    cta_link text DEFAULT '/login?mode=signup',
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. RLS Policies
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read plans" ON public.plans FOR SELECT USING (true);

-- 3. Seed Data (Upsert based on 'type')
-- Gratuito
INSERT INTO public.plans (name, type, price, subtitle, limits, features, marketing_features, cta_text, highlighted)
VALUES (
    'Gratuito', 'gratuito', 0, 'Para conhecer',
    '{"max_patients": 10, "max_appointments": 10, "max_users": 1}',
    ARRAY['agenda_basica', 'prontuario_basico', 'financeiro_simples', 'relatorios_basicos'],
    '[
        {"text": "Agenda Básica", "included": true},
        {"text": "Limite de 10 Pacientes", "included": true},
        {"text": "Prontuário Simples", "included": true},
        {"text": "Auditoria", "included": false},
        {"text": "Exportação PDF", "included": false},
        {"text": "Suporte", "included": false}
    ]'::jsonb,
    'Começar grátis',
    false
);

-- Essencial (Mais Popular)
INSERT INTO public.plans (name, type, price, subtitle, limits, features, marketing_features, cta_text, highlighted)
VALUES (
    'Essencial', 'essencial', 79, 'Para começar',
    '{"max_patients": 50, "max_appointments": 100, "max_users": 1}',
    ARRAY['agenda_completa', 'prontuario_digital', 'financeiro_basico', 'relatorios_simples', 'auditoria', 'exportacao_pdf'],
    '[
        {"text": "Agenda Completa", "included": true},
        {"text": "Até 50 Pacientes", "included": true},
        {"text": "Prontuário Digital", "included": true},
        {"text": "Auditoria de Ações", "included": true},
        {"text": "Exportação PDF", "included": true},
        {"text": "Suporte por Email", "included": true}
    ]'::jsonb,
    'Assinar Essencial',
    true
);

-- Profissional
INSERT INTO public.plans (name, type, price, subtitle, limits, features, marketing_features, cta_text, highlighted)
VALUES (
    'Profissional', 'profissional', 149, 'Para crescer',
    '{"max_patients": null, "max_appointments": null, "max_users": 1}', -- null = unlimited
    ARRAY['agenda_completa', 'prontuario_digital', 'financeiro_avancado', 'relatorios_completos', 'auditoria_completa', 'exportacao_pdf'],
    '[
        {"text": "Pacientes Ilimitados", "included": true},
        {"text": "Prontuário Completo", "included": true},
        {"text": "Financeiro Avançado", "included": true},
        {"text": "Relatórios Completos", "included": true},
        {"text": "Auditoria Completa", "included": true},
        {"text": "Suporte Prioritário", "included": true}
    ]'::jsonb,
    'Assinar Profissional',
    false
);

-- Clínica
INSERT INTO public.plans (name, type, price, subtitle, limits, features, marketing_features, cta_text, highlighted)
VALUES (
    'Clínica', 'clinica', 299, 'Para escalar',
    '{"max_patients": null, "max_appointments": null, "max_users": 5}',
    ARRAY['agenda_completa', 'prontuario_digital', 'financeiro_avancado', 'relatorios_gerenciais', 'api_integracao', 'gestao_equipe'],
    '[
        {"text": "Múltiplos Profissionais", "included": true},
        {"text": "Gestão de Equipe", "included": true},
        {"text": "Relatórios Gerenciais", "included": true},
        {"text": "API de Integração", "included": true},
        {"text": "Suporte Dedicado", "included": true},
        {"text": "Treinamento Incluso", "included": true}
    ]'::jsonb,
    'Falar com vendas',
    false
);

COMMIT;

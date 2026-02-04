
-- ==============================================================================
-- PRONTI SAAS - COMPLETE DATABASE SETUP
-- Run this script in Supabase SQL Editor to set up all tables and triggers.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES & ADMIN CHECK
-- ==========================================

-- Create profiles table (User Roles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using ( true );

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" on profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using ( auth.uid() = id );

-- Helper function for Admin check
create or replace function is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- ==========================================
-- 2. PLANS TABLE
-- ==========================================

create table if not exists public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null unique, -- 'gratuito', 'essencial', 'profissional', 'clinica'
  price numeric(10, 2) not null default 0,
  limits jsonb default '{"max_patients": null, "max_medical_records": null, "max_users": 1}',
  features jsonb default '[]', -- Functional features (backend logic)
  marketing_features jsonb default '[]', -- Display features for Landing Page
  subtitle text, -- 'Para conhecer', 'COMEÇAR', etc.
  highlighted boolean default false, -- 'Mais popular'
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- RLS for Plans
alter table public.plans enable row level security;

drop policy if exists "Public can view plans" on public.plans;
create policy "Public can view plans" on public.plans for select using (true);

drop policy if exists "Admins can manage plans" on public.plans;
create policy "Admins can manage plans" on public.plans using (is_admin());

-- Insert/Update Default Plans
insert into public.plans (name, type, price, limits, features, marketing_features, subtitle, highlighted) values
(
  'Gratuito', 
  'gratuito', 
  0.00, 
  '{"max_patients": 10, "max_medical_records": null, "max_users": 1}', 
  '["agenda", "prontuario", "financeiro", "relatorios"]',
  '[
    {"text": "Agenda básica", "included": true},
    {"text": "Até 10 pacientes", "included": true},
    {"text": "10 atendimentos/mês", "included": true},
    {"text": "Prontuário básico", "included": true},
    {"text": "Financeiro", "included": true},
    {"text": "Relatórios", "included": true}
  ]',
  'Para conhecer',
  false
),
(
  'Essencial', 
  'essencial', 
  79.00, 
  '{"max_patients": 50, "max_medical_records": null, "max_users": 1}', 
  '["agenda", "prontuario", "financeiro", "relatorios", "suporte_email", "auditoria", "export_pdf"]',
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
  'COMEÇAR',
  true
),
(
  'Profissional', 
  'profissional', 
  149.00, 
  '{"max_patients": null, "max_medical_records": null, "max_users": 1}', 
  '["agenda", "prontuario", "financeiro_avancado", "relatorios_completos", "export_pdf", "auditoria_completa", "suporte_prioritario"]',
  '[
    {"text": "Tudo do Essencial +", "included": true},
    {"text": "Pacientes ilimitados", "included": true},
    {"text": "Financeiro avançado", "included": true},
    {"text": "Relatórios completos", "included": true},
    {"text": "Exportação PDF", "included": true},
    {"text": "Auditoria completa", "included": true},
    {"text": "Suporte prioritário", "included": true}
  ]',
  'CRESCER',
  false
),
(
  'Clínica', 
  'clinica', 
  299.00, 
  '{"max_patients": null, "max_medical_records": null, "max_users": 10}', 
  '["agenda", "prontuario", "financeiro_avancado", "relatorios_gerenciais", "api", "suporte_dedicado", "treinamento", "multi_usuario"]',
  '[
    {"text": "Tudo do Profissional +", "included": true},
    {"text": "Múltiplos profissionais", "included": true},
    {"text": "Gestão de equipe", "included": true},
    {"text": "Relatórios gerenciais", "included": true},
    {"text": "API de integração", "included": true},
    {"text": "Suporte dedicado", "included": true},
    {"text": "Treinamento incluso", "included": true}
  ]',
  'ESCALAR',
  false
)
on conflict (type) do update set
  name = excluded.name,
  price = excluded.price,
  limits = excluded.limits,
  features = excluded.features,
  marketing_features = excluded.marketing_features,
  subtitle = excluded.subtitle,
  highlighted = excluded.highlighted;

-- ==========================================
-- 3. CLIENTS TABLE (Doctors/Customers)
-- ==========================================

create table if not exists public.clients (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  status text default 'active' check (status in ('active', 'inactive', 'blocked')),
  plan_id uuid references public.plans(id),
  modules jsonb default '{"agenda": true, "financeiro": true, "whatsapp": true, "relatorios": true, "prontuario": true}',
  custom_limits jsonb,
  subscription_status text default 'trial',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS for Clients
alter table public.clients enable row level security;

drop policy if exists "Admins can view all clients" on public.clients;
create policy "Admins can view all clients" on public.clients for select using (is_admin());

drop policy if exists "Admins can update clients" on public.clients;
create policy "Admins can update clients" on public.clients for update using (is_admin());

drop policy if exists "Clients can view own data" on public.clients;
create policy "Clients can view own data" on public.clients for select using (auth.uid() = id);

-- ==========================================
-- 4. ADDONS TABLE
-- ==========================================

create table if not exists public.addons (
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

-- RLS for Addons
alter table public.addons enable row level security;

drop policy if exists "Public can view addons" on public.addons;
create policy "Public can view addons" on public.addons for select using (true);

drop policy if exists "Admins can manage addons" on public.addons using (is_admin());

-- Insert Default Addons
insert into public.addons (name, slug, description, price, icon, category) values
('WhatsApp Automático', 'whatsapp-auto', 'Lembretes automáticos, confirmação de consulta e mensagens personalizadas via WhatsApp.', 29.90, 'message-square', 'comunicacao'),
('Armazenamento Extra', 'storage-extra', 'Expansão de espaço para exames, documentos, PDFs e imagens médicas.', 19.90, 'hard-drive', 'armazenamento'),
('Relatórios Avançados', 'advanced-reports', 'Filtros por período, gráficos comparativos, histórico completo e exportação detalhada.', 14.90, 'bar-chart', 'relatorios')
on conflict (slug) do nothing;

-- ==========================================
-- 5. CLIENT ADDONS (Relation)
-- ==========================================

create table if not exists public.client_addons (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete cascade not null,
  addon_slug text references public.addons(slug) on delete cascade not null,
  status text check (status in ('active', 'inactive', 'trial')) default 'active',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(client_id, addon_slug)
);

-- RLS for Client Addons
alter table public.client_addons enable row level security;

drop policy if exists "Admins can manage client addons" on public.client_addons;
create policy "Admins can manage client addons" on public.client_addons using (is_admin());

drop policy if exists "Clients can view own addons" on public.client_addons;
create policy "Clients can view own addons" on public.client_addons for select using (
  exists ( select 1 from public.clients where id = client_addons.client_id and id = auth.uid() )
);

-- ==========================================
-- 6. AUDIT LOGS
-- ==========================================

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid,
  admin_nome text,
  doctor_id uuid,
  doctor_nome text,
  acao text not null,
  detalhes text,
  valor_anterior text,
  valor_novo text,
  created_at timestamp with time zone default now()
);

-- RLS for Audit Logs
alter table public.audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs for select using (is_admin());

drop policy if exists "Admins can insert audit logs" on public.audit_logs;
create policy "Admins can insert audit logs" on public.audit_logs for insert with check (is_admin());

-- ==========================================
-- 7. NEW USER SETUP TRIGGER
-- ==========================================

create or replace function public.handle_new_user_setup()
returns trigger
language plpgsql
security definer
as $$
declare
  default_plan_id uuid;
begin
  -- 1. Create Profile
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case when new.email = 'iruanlimah@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do nothing;

  -- 2. Create Client Record (if not admin, or even if admin for consistency)
  -- Get default plan (Gratuito)
  select id into default_plan_id from public.plans where type = 'gratuito' limit 1;
  
  -- Fallback if gratuito not found
  if default_plan_id is null then
    select id into default_plan_id from public.plans limit 1;
  end if;

  insert into public.clients (id, name, email, plan_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    default_plan_id
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Drop existing trigger if exists to avoid conflicts
drop trigger if exists on_auth_user_created on auth.users;

-- Create Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_setup();

-- ==========================================
-- 8. DATA MIGRATION (Fix missing clients)
-- ==========================================

do $$
declare
  r record;
  default_plan_id uuid;
begin
  select id into default_plan_id from public.plans where type = 'gratuito' limit 1;
  
  for r in select * from auth.users loop
    -- Ensure profile exists
    insert into public.profiles (id, email, full_name, role)
    values (
      r.id,
      r.email,
      r.raw_user_meta_data->>'full_name',
      case when r.email = 'iruanlimah@gmail.com' then 'admin' else 'user' end
    )
    on conflict (id) do nothing;

    -- Ensure client exists
    insert into public.clients (id, name, email, plan_id)
    values (
      r.id,
      r.raw_user_meta_data->>'full_name',
      r.email,
      default_plan_id
    )
    on conflict (id) do nothing;
  end loop;
end;
$$;

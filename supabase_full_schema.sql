-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. PLANS (Required by Clients)
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null unique, -- basico, profissional, premium
  price numeric(10, 2) not null,
  limits jsonb default '{}'::jsonb, -- { "max_patients": 20 }
  features jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Insert Default Plans if they don't exist
INSERT INTO public.plans (name, type, price, limits, features) 
SELECT 'Básico', 'basico', 49.90, '{"max_patients": 20}', '["agenda_basica"]'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE type = 'basico');

INSERT INTO public.plans (name, type, price, limits, features)
SELECT 'Profissional', 'profissional', 99.90, '{"max_patients": null}', '["agenda_completa", "financeiro", "whatsapp"]'
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE type = 'profissional');

-- 2. PROFILES (Optional but good to have)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'client' check (role in ('admin', 'client')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. CLIENTS (The business entity for the user)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid primary key references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id),
  status text default 'active' check (status in ('active', 'inactive', 'blocked')),
  subscription_status text default 'trial' check (subscription_status in ('active', 'past_due', 'canceled', 'trial')),
  trial_ends_at timestamp with time zone,
  email text,
  role text default 'CLIENTE',
  name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. PATIENTS (Owned by clients)
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  birth_date date,
  cpf text,
  address text,
  status text default 'active',
  observations text,
  consultation_value numeric(10, 2),
  lgpd_consent boolean default false,
  lgpd_consent_date timestamp with time zone,
  main_complaint text,
  current_illness_history text,
  personal_history text,
  family_history text,
  allergies text,
  medications text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  date date not null,
  time text not null, -- 'HH:MM' format
  status text default 'agendado' check (status in ('agendado', 'realizado', 'cancelado')),
  price numeric(10, 2),
  notes text,
  whatsapp_reminder_sent boolean default false,
  whatsapp_reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 7. MEDICAL RECORDS (Prontuarios - History)
CREATE TABLE IF NOT EXISTS public.medical_records (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  content text not null,
  professional_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 8. EXAMS
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  type text not null, -- laboratorio, imagem, laudo, etc.
  description text,
  file_url text,
  file_name text,
  file_type text,
  file_size integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 9. PAYMENTS (If not exists)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id),
  patient_id uuid references public.patients(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  amount numeric(10, 2) not null,
  status text not null check (status in ('pending', 'paid', 'failed')),
  method text,
  type text check (type in ('pix', 'cartao', 'dinheiro', 'transferencia', 'convenio')),
  reference_id text, 
  description text,
  payment_date timestamp with time zone,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- PLANS (Read only)
DROP POLICY IF EXISTS "Public can view plans" ON public.plans;
CREATE POLICY "Public can view plans" ON public.plans FOR SELECT USING (true);

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CLIENTS
DROP POLICY IF EXISTS "User can create own client" ON public.clients;
CREATE POLICY "User can create own client" ON public.clients FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "User can read own client" ON public.clients;
CREATE POLICY "User can read own client" ON public.clients FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "User can update own client" ON public.clients;
CREATE POLICY "User can update own client" ON public.clients FOR UPDATE USING (auth.uid() = id);

-- PATIENTS
DROP POLICY IF EXISTS "Clients can view own patients" ON public.patients;
CREATE POLICY "Clients can view own patients" ON public.patients FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can insert own patients" ON public.patients;
CREATE POLICY "Clients can insert own patients" ON public.patients FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own patients" ON public.patients;
CREATE POLICY "Clients can update own patients" ON public.patients FOR UPDATE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can delete own patients" ON public.patients;
CREATE POLICY "Clients can delete own patients" ON public.patients FOR DELETE USING (client_id = auth.uid());

-- APPOINTMENTS
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
CREATE POLICY "Clients can view own appointments" ON public.appointments FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can insert own appointments" ON public.appointments;
CREATE POLICY "Clients can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own appointments" ON public.appointments;
CREATE POLICY "Clients can update own appointments" ON public.appointments FOR UPDATE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can delete own appointments" ON public.appointments;
CREATE POLICY "Clients can delete own appointments" ON public.appointments FOR DELETE USING (client_id = auth.uid());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Clients can view own notifications" ON public.notifications;
CREATE POLICY "Clients can view own notifications" ON public.notifications FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own notifications" ON public.notifications;
CREATE POLICY "Clients can update own notifications" ON public.notifications FOR UPDATE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can delete own notifications" ON public.notifications;
CREATE POLICY "Clients can delete own notifications" ON public.notifications FOR DELETE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can insert own notifications" ON public.notifications;
CREATE POLICY "Clients can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (client_id = auth.uid());

-- MEDICAL RECORDS
DROP POLICY IF EXISTS "Clients can view own medical records" ON public.medical_records;
CREATE POLICY "Clients can view own medical records" ON public.medical_records FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can insert own medical records" ON public.medical_records;
CREATE POLICY "Clients can insert own medical records" ON public.medical_records FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own medical records" ON public.medical_records;
CREATE POLICY "Clients can update own medical records" ON public.medical_records FOR UPDATE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can delete own medical records" ON public.medical_records;
CREATE POLICY "Clients can delete own medical records" ON public.medical_records FOR DELETE USING (client_id = auth.uid());

-- EXAMS
DROP POLICY IF EXISTS "Clients can view own exams" ON public.exams;
CREATE POLICY "Clients can view own exams" ON public.exams FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can insert own exams" ON public.exams;
CREATE POLICY "Clients can insert own exams" ON public.exams FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own exams" ON public.exams;
CREATE POLICY "Clients can update own exams" ON public.exams FOR UPDATE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can delete own exams" ON public.exams;
CREATE POLICY "Clients can delete own exams" ON public.exams FOR DELETE USING (client_id = auth.uid());

-- GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

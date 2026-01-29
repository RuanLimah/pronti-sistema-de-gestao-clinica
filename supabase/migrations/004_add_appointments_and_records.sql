
-- 1. APPOINTMENTS
create table public.appointments (
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

-- 2. MEDICAL RECORDS (Prontuarios - History)
create table public.medical_records (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  content text not null,
  professional_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. EXAMS
create table public.exams (
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

-- 4. UPDATE PAYMENTS
alter table public.payments
add column patient_id uuid references public.patients(id) on delete set null,
add column appointment_id uuid references public.appointments(id) on delete set null,
add column payment_date timestamp with time zone,
add column type text check (type in ('pix', 'cartao', 'dinheiro', 'transferencia', 'convenio')); -- Mapping formaPagamento

-- 5. ENABLE RLS
alter table public.appointments enable row level security;
alter table public.medical_records enable row level security;
alter table public.exams enable row level security;

-- 6. RLS POLICIES

-- APPOINTMENTS
create policy "Clients can view own appointments" on public.appointments for select using (client_id = auth.uid());
create policy "Clients can insert own appointments" on public.appointments for insert with check (client_id = auth.uid());
create policy "Clients can update own appointments" on public.appointments for update using (client_id = auth.uid());
create policy "Clients can delete own appointments" on public.appointments for delete using (client_id = auth.uid());

-- MEDICAL RECORDS
create policy "Clients can view own medical records" on public.medical_records for select using (client_id = auth.uid());
create policy "Clients can insert own medical records" on public.medical_records for insert with check (client_id = auth.uid());
create policy "Clients can update own medical records" on public.medical_records for update using (client_id = auth.uid());
create policy "Clients can delete own medical records" on public.medical_records for delete using (client_id = auth.uid());

-- EXAMS
create policy "Clients can view own exams" on public.exams for select using (client_id = auth.uid());
create policy "Clients can insert own exams" on public.exams for insert with check (client_id = auth.uid());
create policy "Clients can update own exams" on public.exams for update using (client_id = auth.uid());
create policy "Clients can delete own exams" on public.exams for delete using (client_id = auth.uid());

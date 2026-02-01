
-- Create patients table if it doesn't exist
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  observations text,
  birth_date date,
  cpf text,
  address text,
  consultation_value numeric,
  lgpd_consent boolean default false,
  lgpd_consent_date timestamp,
  status text default 'active',
  
  -- Clinical data
  main_complaint text,
  current_illness_history text,
  personal_history text,
  family_history text,
  allergies text,
  medications text,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable RLS
alter table public.patients enable row level security;

-- Drop existing policies to ensure clean state
drop policy if exists "Users can manage own patients" on public.patients;
drop policy if exists "Admins can manage all patients" on public.patients;

-- Policy for Clients (Users): Can manage only their own patients
create policy "Users can manage own patients"
on public.patients
for all
using (client_id = auth.uid())
with check (client_id = auth.uid());

-- Policy for Admins: Can manage all patients
create policy "Admins can manage all patients"
on public.patients
for all
using (
  exists (
    select 1 from public.clients c
    where c.id = auth.uid()
    and c.role = 'ADMIN'
  )
);

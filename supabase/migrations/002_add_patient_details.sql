
-- Add missing columns to patients table to match frontend requirements

alter table public.patients
add column birth_date date,
add column cpf text,
add column address text,
add column consultation_value numeric,
add column lgpd_consent boolean default false,
add column lgpd_consent_date timestamp with time zone,
add column last_appointment timestamp with time zone,
add column total_appointments integer default 0;

-- Add index for better performance on common queries if needed
create index if not exists idx_patients_cpf on public.patients(cpf);

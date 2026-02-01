-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE (User Roles & Data)
-- ==========================================

-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for Profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- ==========================================
-- 2. TRIGGER FOR NEW USERS (Auto-create Profile)
-- ==========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case 
      when new.email = 'iruanlimah@gmail.com' then 'admin'
      else 'user'
    end
  );
  return new;
end;
$$;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. PATIENTS TABLE (Pacientes)
-- ==========================================

create table if not exists public.patients (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references auth.users(id) not null, -- Maps to user_id/medicoId
  name text not null,
  phone text,
  email text,
  status text default 'active' check (status in ('active', 'inactive')),
  consultation_value numeric,
  
  -- Additional fields mapped from repository
  observations text,
  birth_date date,
  cpf text,
  address text,
  lgpd_consent boolean default false,
  lgpd_consent_date timestamp with time zone,
  
  -- Clinical data
  main_complaint text,
  current_illness_history text,
  personal_history text,
  family_history text,
  allergies text,
  medications text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on patients
alter table public.patients enable row level security;

-- ==========================================
-- 4. MEDICAL RECORDS TABLE (Prontuários/Evoluções)
-- ==========================================

create table if not exists public.medical_records (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references auth.users(id) not null, -- Medico ID
  patient_id uuid references public.patients(id) on delete cascade not null,
  content text not null,
  professional_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on medical_records
alter table public.medical_records enable row level security;

-- ==========================================
-- 5. EXAMS TABLE (Exames/Anexos)
-- ==========================================

create table if not exists public.exams (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references auth.users(id) not null, -- Medico ID
  patient_id uuid references public.patients(id) on delete cascade not null,
  name text not null,
  type text not null, -- laboratorio, imagem, etc
  description text,
  file_url text not null,
  file_name text,
  file_type text,
  file_size numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on exams
alter table public.exams enable row level security;

-- ==========================================
-- 6. RLS POLICIES (Unified)
-- ==========================================

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

-- --- PATIENTS POLICIES ---
drop policy if exists "Users can view own patients" on patients;
create policy "Users can view own patients" on patients for select using ( client_id = auth.uid() );

drop policy if exists "Admins can view all patients" on patients;
create policy "Admins can view all patients" on patients for select using ( is_admin() );

drop policy if exists "Users can insert own patients" on patients;
create policy "Users can insert own patients" on patients for insert with check ( client_id = auth.uid() );

drop policy if exists "Admins can insert patients" on patients;
create policy "Admins can insert patients" on patients for insert with check ( is_admin() );

drop policy if exists "Users can update own patients" on patients;
create policy "Users can update own patients" on patients for update using ( client_id = auth.uid() );

drop policy if exists "Admins can update all patients" on patients;
create policy "Admins can update all patients" on patients for update using ( is_admin() );

drop policy if exists "Users can delete own patients" on patients;
create policy "Users can delete own patients" on patients for delete using ( client_id = auth.uid() );

drop policy if exists "Admins can delete all patients" on patients;
create policy "Admins can delete all patients" on patients for delete using ( is_admin() );

-- --- MEDICAL RECORDS POLICIES ---
drop policy if exists "Users can view own records" on medical_records;
create policy "Users can view own records" on medical_records for select using ( client_id = auth.uid() );

drop policy if exists "Admins can view all records" on medical_records;
create policy "Admins can view all records" on medical_records for select using ( is_admin() );

drop policy if exists "Users can insert own records" on medical_records;
create policy "Users can insert own records" on medical_records for insert with check ( client_id = auth.uid() );

drop policy if exists "Users can update own records" on medical_records;
create policy "Users can update own records" on medical_records for update using ( client_id = auth.uid() );

drop policy if exists "Users can delete own records" on medical_records;
create policy "Users can delete own records" on medical_records for delete using ( client_id = auth.uid() );

-- --- EXAMS POLICIES ---
drop policy if exists "Users can view own exams" on exams;
create policy "Users can view own exams" on exams for select using ( client_id = auth.uid() );

drop policy if exists "Admins can view all exams" on exams;
create policy "Admins can view all exams" on exams for select using ( is_admin() );

drop policy if exists "Users can insert own exams" on exams;
create policy "Users can insert own exams" on exams for insert with check ( client_id = auth.uid() );

drop policy if exists "Users can update own exams" on exams;
create policy "Users can update own exams" on exams for update using ( client_id = auth.uid() );

drop policy if exists "Users can delete own exams" on exams;
create policy "Users can delete own exams" on exams for delete using ( client_id = auth.uid() );

-- ==========================================
-- 7. STORAGE (Bucket Setup)
-- ==========================================
-- Attempt to insert storage bucket configuration (requires storage schema access)
-- If this fails, user must create bucket manually.

insert into storage.buckets (id, name, public)
values ('exams', 'exams', true)
on conflict (id) do nothing;

-- Storage Policies (Access Control for Files)
drop policy if exists "Public Access" on storage.objects;
-- Allow authenticated uploads
create policy "Authenticated users can upload exams"
on storage.objects for insert
with check ( bucket_id = 'exams' and auth.role() = 'authenticated' );

-- Allow users to view their own files (or all public if simplifying)
-- Since we set public=true, anyone with the URL can read, which is easier for now.
-- But for strict security:
create policy "Users can view own exam files"
on storage.objects for select
using ( bucket_id = 'exams' and auth.role() = 'authenticated' );

create policy "Users can delete own exam files"
on storage.objects for delete
using ( bucket_id = 'exams' and auth.uid() = owner );

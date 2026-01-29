-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. PLANS
create table public.plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null unique, -- basico, profissional, premium
  price numeric(10, 2) not null,
  limits jsonb default '{}'::jsonb, -- { "max_patients": 20 }
  features jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 2. ADDONS
create table public.addons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  price numeric(10, 2) not null,
  plan_dependency_id uuid references public.plans(id),
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 3. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'client' check (role in ('admin', 'client')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. CLIENTS (The business entity for the user)
create table public.clients (
  id uuid primary key references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id),
  status text default 'active' check (status in ('active', 'inactive', 'blocked')),
  subscription_status text default 'trial' check (subscription_status in ('active', 'past_due', 'canceled', 'trial')),
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. CLIENT_ADDONS
create table public.client_addons (
  client_id uuid references public.clients(id) on delete cascade,
  addon_id uuid references public.addons(id) on delete cascade,
  status text default 'inactive' check (status in ('active', 'inactive', 'blocked')),
  created_at timestamp with time zone default now(),
  primary key (client_id, addon_id)
);

-- 6. PATIENTS (Owned by clients)
create table public.patients (
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. PAYMENTS
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id),
  amount numeric(10, 2) not null,
  status text not null check (status in ('pending', 'paid', 'failed')),
  method text,
  reference_id text, -- External payment gateway ID
  description text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 8. AUDIT LOGS
create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references auth.users(id),
  action text not null,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- INSERT DEFAULT DATA (PLANS)
insert into public.plans (name, type, price, limits, features) values
('Básico', 'basico', 49.90, '{"max_patients": 20}', '["agenda_basica"]'),
('Profissional', 'profissional', 99.90, '{"max_patients": null}', '["agenda_completa", "financeiro", "whatsapp"]'),
('Premium', 'premium', 199.90, '{"max_patients": null}', '["tudo_liberado"]');

-- TRIGGER FOR NEW USER CREATION
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_plan_id uuid;
begin
  -- Get default plan (Basic)
  select id into default_plan_id from public.plans where type = 'basico' limit 1;

  -- Create Profile
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'client');

  -- Create Client entry
  insert into public.clients (id, plan_id, status, subscription_status)
  values (new.id, default_plan_id, 'active', 'trial');
  
  -- Create Addon entries (all inactive by default)
  insert into public.client_addons (client_id, addon_id, status)
  select new.id, id, 'inactive' from public.addons;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ENABLE RLS
alter table public.plans enable row level security;
alter table public.addons enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_addons enable row level security;
alter table public.patients enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

-- RLS POLICIES

-- PLANS & ADDONS (Publicly visible or authenticated)
create policy "Plans are viewable by everyone" on public.plans for select using (true);
create policy "Addons are viewable by everyone" on public.addons for select using (true);

-- PROFILES
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- CLIENTS
create policy "Clients can view own data" on public.clients for select using (auth.uid() = id);
create policy "Admins can view all clients" on public.clients for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- CLIENT_ADDONS
create policy "Clients can view own addons" on public.client_addons for select using (client_id = auth.uid());
create policy "Admins can view all client addons" on public.client_addons for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- PATIENTS
create policy "Clients can view own patients" on public.patients for select using (client_id = auth.uid());
create policy "Clients can insert own patients" on public.patients for insert with check (client_id = auth.uid());
create policy "Clients can update own patients" on public.patients for update using (client_id = auth.uid());
create policy "Clients can delete own patients" on public.patients for delete using (client_id = auth.uid());
create policy "Admins can view all patients" on public.patients for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- PAYMENTS
create policy "Clients can view own payments" on public.payments for select using (client_id = auth.uid());
create policy "Admins can view all payments" on public.payments for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- AUDIT LOGS
create policy "Admins can view all audit logs" on public.audit_logs for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
-- Clients might want to see their own logs, optional
create policy "Clients can view own audit logs" on public.audit_logs for select using (actor_id = auth.uid());

-- Function to check active plan features (Helper)
create or replace function public.check_feature(feature_key text)
returns boolean
language plpgsql
security definer
as $$
declare
  user_plan_features jsonb;
begin
  select p.features into user_plan_features
  from public.clients c
  join public.plans p on c.plan_id = p.id
  where c.id = auth.uid();

  return (user_plan_features @> jsonb_build_array(feature_key));
end;
$$;

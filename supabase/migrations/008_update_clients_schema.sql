-- 1. Disable the trigger's insert into clients to avoid conflict with frontend insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Only create Profile, let frontend handle Client creation
  -- We keep profile creation as it might be used by other parts of the system
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'client');
  
  return new;
end;
$$;

-- 2. Modify clients table to match user requirements
-- We change the foreign key to reference auth.users directly
alter table public.clients 
  drop constraint if exists clients_id_fkey;

alter table public.clients
  add constraint clients_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- Add new columns requested
alter table public.clients
  add column if not exists email text,
  add column if not exists role text default 'CLIENTE';

-- Update existing rows if any to have valid data
update public.clients 
set role = 'CLIENTE' 
where role is null;

update public.clients 
set email = (select email from auth.users where auth.users.id = clients.id) 
where email is null;

-- 3. Enable RLS (already enabled, but ensuring)
alter table public.clients enable row level security;

-- 4. Update Policies
-- Drop existing conflicting policies
drop policy if exists "Clients can view own data" on public.clients;
drop policy if exists "Admins can view all clients" on public.clients;
drop policy if exists "User can create own client" on public.clients;
drop policy if exists "User can read own client" on public.clients;
drop policy if exists "Admin can read all clients" on public.clients;

-- Create requested policies
create policy "User can create own client" 
on public.clients 
for insert 
with check (auth.uid() = id); 

create policy "User can read own client" 
on public.clients 
for select 
using (auth.uid() = id); 

create policy "Admin can read all clients" 
on public.clients 
for select 
using ( 
  exists ( 
    select 1 from public.clients c 
    where c.id = auth.uid() 
    and c.role = 'ADMIN' 
  ) 
);

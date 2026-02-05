-- Create profiles table if not exists (as per requirement)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  telefone text,
  plano text,
  created_at timestamp default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policy for users to read their own profile
drop policy if exists "user read own profile" on public.profiles;
create policy "user read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy for users to update their own profile
drop policy if exists "user update own profile" on public.profiles;
create policy "user update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RPC to get all users for admin (Security Definer to bypass RLS and access auth.users)
create or replace function public.get_admin_users()
returns table (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  nome text,
  telefone text,
  plano text
)
security definer
set search_path = public
as $$
begin
  -- Check if user is admin (via app_metadata)
  if not exists (
    select 1 from auth.users
    where id = auth.uid()
    and (raw_app_meta_data->>'role')::text = 'admin'
  ) then
    raise exception 'Access denied';
  end if;

  return query
  select
    au.id,
    au.email,
    (au.raw_app_meta_data->>'role')::text as role,
    au.created_at,
    au.last_sign_in_at,
    p.nome,
    p.telefone,
    p.plano
  from auth.users au
  left join public.profiles p on p.id = au.id
  order by au.created_at desc;
end;
$$ language plpgsql;

-- RPC to delete a user by admin
create or replace function public.delete_admin_user(user_id uuid)
returns void
security definer
set search_path = public
as $$
begin
  -- Check if user is admin
  if not exists (
    select 1 from auth.users
    where id = auth.uid()
    and (raw_app_meta_data->>'role')::text = 'admin'
  ) then
    raise exception 'Access denied';
  end if;

  -- Delete from auth.users (cascades to profiles)
  delete from auth.users where id = user_id;
end;
$$ language plpgsql;

-- RPC to update user profile by admin
create or replace function public.update_admin_user_profile(
  target_user_id uuid,
  new_nome text,
  new_telefone text,
  new_plano text
)
returns void
security definer
set search_path = public
as $$
begin
  -- Check if user is admin
  if not exists (
    select 1 from auth.users
    where id = auth.uid()
    and (raw_app_meta_data->>'role')::text = 'admin'
  ) then
    raise exception 'Access denied';
  end if;

  -- Update profiles table
  -- We use ON CONFLICT to handle cases where profile might not exist yet
  insert into public.profiles (id, nome, telefone, plano)
  values (target_user_id, new_nome, new_telefone, new_plano)
  on conflict (id) do update
  set
    nome = excluded.nome,
    telefone = excluded.telefone,
    plano = excluded.plano;
end;
$$ language plpgsql;

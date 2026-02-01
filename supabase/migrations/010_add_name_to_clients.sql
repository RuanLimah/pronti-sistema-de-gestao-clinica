
-- Add name column to clients table
alter table public.clients 
  add column if not exists name text;

-- Update existing clients name from profiles or metadata if possible, or default to email
update public.clients c
set name = (
  select coalesce(p.full_name, u.raw_user_meta_data->>'full_name', c.email)
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = c.id
)
where c.name is null;

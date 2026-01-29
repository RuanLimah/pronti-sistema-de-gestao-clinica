-- 1. NOTIFICATIONS
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null, -- 'sistema', 'agendamento', 'pagamento', 'lembrete'
  title text not null,
  message text not null,
  read boolean default false,
  link text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. ENABLE RLS
alter table public.notifications enable row level security;

-- 3. RLS POLICIES
create policy "Clients can view own notifications" on public.notifications for select using (client_id = auth.uid());
create policy "Clients can insert own notifications" on public.notifications for insert with check (client_id = auth.uid());
create policy "Clients can update own notifications" on public.notifications for update using (client_id = auth.uid());
create policy "Clients can delete own notifications" on public.notifications for delete using (client_id = auth.uid());

-- 4. TRIGGER FOR UPDATED_AT
drop trigger if exists on_notifications_updated on public.notifications;
create trigger on_notifications_updated
  before update on public.notifications
  for each row execute procedure public.handle_updated_at();

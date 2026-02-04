-- 1. APPOINTMENTS
-- Verificar se a tabela appointments existe, se não, criar
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

-- Habilitar RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Criar políticas (DROP para evitar duplicidade ao recriar)
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
CREATE POLICY "Clients can view own appointments" ON public.appointments FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can insert own appointments" ON public.appointments;
CREATE POLICY "Clients can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own appointments" ON public.appointments;
CREATE POLICY "Clients can update own appointments" ON public.appointments FOR UPDATE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can delete own appointments" ON public.appointments;
CREATE POLICY "Clients can delete own appointments" ON public.appointments FOR DELETE USING (client_id = auth.uid());

-- 2. NOTIFICATIONS
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

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own notifications" ON public.notifications;
CREATE POLICY "Clients can view own notifications" ON public.notifications FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own notifications" ON public.notifications;
CREATE POLICY "Clients can update own notifications" ON public.notifications FOR UPDATE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can delete own notifications" ON public.notifications;
CREATE POLICY "Clients can delete own notifications" ON public.notifications FOR DELETE USING (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can insert own notifications" ON public.notifications;
CREATE POLICY "Clients can insert own notifications" ON public.notifications FOR INSERT WITH CHECK (client_id = auth.uid());

-- Grant permissions
GRANT ALL ON TABLE public.appointments TO authenticated;
GRANT ALL ON TABLE public.appointments TO service_role;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;

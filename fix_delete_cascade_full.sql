-- SQL Completo para corrigir Exclusão de Usuários (Foreign Key Cascade)
-- Este script adiciona "ON DELETE CASCADE" em TODAS as tabelas que vinculam dados ao usuário.
-- Isso permite que, ao excluir um usuário (Admin), todos os dados dele sejam removidos automaticamente.

BEGIN;

-- 1. Tabela PROFILES (Já enviada, mas reforçando)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 2. Tabela CLIENTS (Já enviada, mas reforçando)
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_id_fkey,
ADD CONSTRAINT clients_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 3. Tabela PATIENTS (Pacientes)
ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_client_id_fkey,
ADD CONSTRAINT patients_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 4. Tabela APPOINTMENTS (Agendamentos/Consultas)
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_client_id_fkey,
ADD CONSTRAINT appointments_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 5. Tabela MEDICAL_RECORDS (Prontuários)
ALTER TABLE public.medical_records
DROP CONSTRAINT IF EXISTS medical_records_client_id_fkey,
ADD CONSTRAINT medical_records_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 6. Tabela PAYMENTS (Financeiro)
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_client_id_fkey,
ADD CONSTRAINT payments_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 7. Tabela NOTIFICATIONS (Notificações)
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_client_id_fkey,
ADD CONSTRAINT notifications_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 8. Tabela CLIENT_ADDONS (Se existir)
-- Tenta aplicar, se a tabela não existir, vai ignorar ou falhar (pode remover se der erro)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_addons') THEN
        ALTER TABLE public.client_addons
        DROP CONSTRAINT IF EXISTS client_addons_client_id_fkey;
        
        ALTER TABLE public.client_addons
        ADD CONSTRAINT client_addons_client_id_fkey
            FOREIGN KEY (client_id)
            REFERENCES auth.users(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- 9. Tabela SUBSCRIPTIONS (Se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
        -- Tenta adivinhar o nome da coluna (medicoId ou client_id)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'medicoId') THEN
            ALTER TABLE public.subscriptions
            DROP CONSTRAINT IF EXISTS subscriptions_medicoId_fkey;

            ALTER TABLE public.subscriptions
            ADD CONSTRAINT subscriptions_medicoId_fkey
                FOREIGN KEY ("medicoId")
                REFERENCES auth.users(id)
                ON DELETE CASCADE;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'client_id') THEN
             ALTER TABLE public.subscriptions
            DROP CONSTRAINT IF EXISTS subscriptions_client_id_fkey;

            ALTER TABLE public.subscriptions
            ADD CONSTRAINT subscriptions_client_id_fkey
                FOREIGN KEY (client_id)
                REFERENCES auth.users(id)
                ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

COMMIT;

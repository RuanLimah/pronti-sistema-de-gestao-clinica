-- SQL para Corrigir Exclusão de Usuários (Foreign Key Cascade)
-- Copie e cole isso no SQL Editor do Supabase Dashboard

BEGIN;

-- 1. Tabela PROFILES
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 2. Tabela CLIENTS
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_id_fkey,
ADD CONSTRAINT clients_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- 3. Tabela SUBSCRIPTIONS (se existir FK direta para auth.users ou clients)
-- Assumindo que medicoId referencia clients(id) ou profiles(id)
-- Se medicoId referencia auth.users, precisa de cascade
-- Se referencia clients e clients tem cascade, então subscriptions precisa ter cascade para clients

-- Verifique as constraints da tabela subscriptions, se houver:
-- ALTER TABLE public.subscriptions
-- DROP CONSTRAINT IF EXISTS subscriptions_medicoId_fkey,
-- ADD CONSTRAINT subscriptions_medicoId_fkey
--    FOREIGN KEY ("medicoId")
--    REFERENCES public.clients(id)
--    ON DELETE CASCADE;

-- 4. Tabela APPOINTMENTS (Consultas)
-- Se apagar o médico (client), apaga as consultas dele? Geralmente sim.
-- ALTER TABLE public.appointments
-- DROP CONSTRAINT IF EXISTS appointments_medico_id_fkey,
-- ADD CONSTRAINT appointments_medico_id_fkey
--    FOREIGN KEY (medico_id)
--    REFERENCES public.clients(id)
--    ON DELETE CASCADE;

-- 5. Tabela MEDICAL_RECORDS (Prontuários)
-- Se apagar o médico, apaga os prontuários? CUIDADO.
-- Geralmente sim, pois o dado pertence à conta do médico (SaaS).
-- ALTER TABLE public.medical_records
-- DROP CONSTRAINT IF EXISTS medical_records_doctor_id_fkey,
-- ADD CONSTRAINT medical_records_doctor_id_fkey
--    FOREIGN KEY (doctor_id)
--    REFERENCES public.clients(id)
--    ON DELETE CASCADE;

COMMIT;

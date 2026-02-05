-- "OPÇÃO NUCLEAR" - Script Inteligente para corrigir TODOS os bloqueios de exclusão
-- Este script varre o banco de dados procurando qualquer tabela que bloqueie a exclusão de usuários
-- e altera a regra para permitir a exclusão automática (CASCADE).

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Encontrar todas as FKs que apontam para auth.users (Tabelas linkadas ao usuário)
    FOR r IN
        SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name,
            tc.constraint_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_schema = 'auth'
            AND ccu.table_name = 'users'
            AND tc.table_schema = 'public'
    LOOP
        -- Remove a constraint antiga e recria com ON DELETE CASCADE
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.table_schema, r.table_name, r.constraint_name);
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', 
            r.table_schema, r.table_name, r.constraint_name, r.column_name);
        
        RAISE NOTICE 'Corrigido: Tabela %.% (Coluna %) agora deleta em cascata.', r.table_schema, r.table_name, r.column_name;
    END LOOP;

    -- 2. Encontrar todas as FKs que apontam para public.clients (Tabelas linkadas ao perfil do cliente)
    -- Isso garante que se o Client for deletado (via cascata do user), os dados filhos (pacientes, etc) também sumam.
    FOR r IN
        SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name,
            tc.constraint_name
        FROM
            information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_schema = 'public'
            AND ccu.table_name = 'clients' -- Tabela pai
            AND tc.table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.table_schema, r.table_name, r.constraint_name);
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.clients(id) ON DELETE CASCADE', 
            r.table_schema, r.table_name, r.constraint_name, r.column_name);
            
        RAISE NOTICE 'Corrigido: Tabela %.% (Coluna %) agora deleta em cascata (linkado a Clients).', r.table_schema, r.table_name, r.column_name;
    END LOOP;

END $$;

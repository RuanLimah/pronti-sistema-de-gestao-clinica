-- Script Específico para corrigir Bloqueio por Arquivos (Storage)
-- Se o usuário enviou exames ou fotos, eles ficam na tabela "storage.objects".
-- Por padrão, essa tabela NÃO deleta em cascata, bloqueando a exclusão do usuário.

BEGIN;

-- 1. Tentar corrigir a tabela storage.objects (onde ficam os arquivos)
DO $$
BEGIN
    -- Verifica se a constraint existe antes de tentar alterar
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'objects_owner_fkey' 
        AND table_schema = 'storage' 
        AND table_name = 'objects'
    ) THEN
        ALTER TABLE storage.objects
        DROP CONSTRAINT objects_owner_fkey;

        ALTER TABLE storage.objects
        ADD CONSTRAINT objects_owner_fkey
        FOREIGN KEY (owner)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Sucesso: storage.objects agora deleta arquivos do usuário automaticamente.';
    ELSE
        RAISE NOTICE 'Aviso: Constraint objects_owner_fkey não encontrada. Verifique o nome correto.';
    END IF;
END $$;

-- 2. Reforço: Varrer TODAS as tabelas de TODOS os schemas (incluindo storage, public, etc)
-- que apontam para auth.users e forçar CASCADE.
DO $$
DECLARE
    r RECORD;
BEGIN
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
            -- REMOVIDO filtro de schema public -> Pega TUDO
            AND tc.table_schema NOT IN ('auth') -- Não mexer em tabelas internas do auth por segurança
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.table_schema, r.table_name, r.constraint_name);
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', 
                r.table_schema, r.table_name, r.constraint_name, r.column_name);
            
            RAISE NOTICE 'CORRIGIDO: %I.%I (%I) agora deleta em cascata.', r.table_schema, r.table_name, r.column_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERRO ao tentar corrigir %I.%I: %', r.table_schema, r.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

COMMIT;

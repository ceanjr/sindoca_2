-- SQL para verificar o schema completo da tabela profiles
-- Execute no Supabase Dashboard → SQL Editor

-- 1. Verificar colunas da tabela profiles
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Verificar se a tabela existe
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- 3. Ver a definição da função handle_new_user
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = 'public'::regnamespace;

-- 4. Testar insert manual (para ver se RLS está bloqueando)
-- CUIDADO: Isso vai inserir um registro de teste
-- DELETE depois com: DELETE FROM profiles WHERE email = 'teste-manual@example.com';
/*
INSERT INTO public.profiles (id, email, full_name)
VALUES (
  gen_random_uuid(),
  'teste-manual@example.com',
  'Teste Manual'
);
*/

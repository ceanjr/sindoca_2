-- ============================================================
-- SQL PARA DEBUG DO ERRO DE SIGNUP
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/sql/new
-- ============================================================

-- 1. Verificar se o trigger existe
-- Deve retornar 1 linha com o trigger "on_auth_user_created"
SELECT
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================

-- 2. Verificar se a função handle_new_user existe
-- Deve retornar 1 linha com security_type = 'DEFINER'
SELECT
  routine_name,
  routine_type,
  security_type,
  specific_name
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

-- ============================================================

-- 3. Verificar o código da função
-- Deve mostrar o código completo da função
SELECT
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = 'public'::regnamespace;

-- ============================================================

-- 4. Verificar as colunas da tabela profiles
-- Deve incluir: id, email, full_name
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================

-- 5. Verificar políticas RLS da tabela profiles
-- Deve mostrar todas as políticas de INSERT
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'INSERT';

-- ============================================================

-- 6. VERIFICAR LOGS MAIS RECENTES DO POSTGRES
-- Execute este SQL SEPARADAMENTE (não junto com os outros):
-- SELECT * FROM postgres_logs
-- ORDER BY timestamp DESC
-- LIMIT 50;

-- ============================================================

-- DEPOIS DE EXECUTAR OS SQLs ACIMA:
-- Cole os resultados aqui e eu vou te ajudar a diagnosticar!
-- ============================================================

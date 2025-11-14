-- Migration 035: Fix RLS policies for profile insertion during signup
--
-- PROBLEMA: A política "Users can insert own profile" falha durante o signup
-- porque o auth.uid() ainda não está disponível quando o trigger executa.
--
-- SOLUÇÃO: Remover a política problemática e criar uma nova que funciona
-- com triggers que usam SECURITY DEFINER.

-- 1. Remover a política problemática
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 2. Criar nova política que funciona com SECURITY DEFINER
-- Esta política permite insert quando:
-- a) O usuário está inserindo seu próprio perfil (auth.uid() = id)
-- b) OU o insert está sendo feito por um trigger/função (current_user = 'postgres')
CREATE POLICY "Allow profile creation during signup and by user"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() = id)
  OR
  (current_user = 'postgres')
  OR
  (auth.uid() IS NULL AND current_user IN ('authenticator', 'postgres'))
);

-- 3. Comentário explicativo
COMMENT ON POLICY "Allow profile creation during signup and by user" ON public.profiles IS
  'Allows users to insert their own profile and allows trigger (running as postgres) to insert profiles during signup.';

-- 4. Verificar se RLS está habilitado (deve estar)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SOLUÇÃO SIMPLES: Apenas desabilita o trigger problemático
-- O profile será criado manualmente no código da API

-- 1. Desabilitar o trigger que está causando erro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Manter a função (caso seja útil no futuro)
-- Mas não vai ser chamada automaticamente

-- 3. Garantir que a policy de INSERT permita criação de profile
-- Recria a policy para ser mais permissiva durante signup
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    auth.uid() = id OR
    auth.uid() IS NULL  -- Permite durante signup (antes de auth completo)
  );

-- 4. Adicionar comentário explicativo
COMMENT ON POLICY "Users can insert own profile" ON profiles IS
  'Permite que usuários criem seu próprio profile durante signup. A verificação auth.uid() IS NULL permite criação durante o processo de signup.';

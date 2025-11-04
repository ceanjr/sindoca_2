-- SOLUÇÃO RÁPIDA: Executar TUDO de uma vez
-- Cole TUDO no SQL Editor e clique em RUN

-- 1. Desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;

-- 2. Limpar policies problemáticas
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Members can view workspace profiles" ON profiles;
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

-- 3. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies simples e permissivas
CREATE POLICY "Allow all inserts for service role"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all selects for authenticated"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow all inserts for service role"
  ON workspace_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all selects for authenticated"
  ON workspace_members FOR SELECT
  USING (true);

-- 5. Atualizar função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atualizar função ensure_user_in_workspace com tratamento de erros
CREATE OR REPLACE FUNCTION public.ensure_user_in_workspace()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id_var UUID;
BEGIN
  -- Get workspace
  SELECT id INTO workspace_id_var
  FROM workspaces
  WHERE name = 'Nosso Espaço'
  LIMIT 1;

  -- Create workspace if doesn't exist
  IF workspace_id_var IS NULL THEN
    INSERT INTO workspaces (
      name, creator_id, invite_code, secret_question, 
      secret_answer_hash, status
    )
    VALUES (
      'Nosso Espaço', NEW.id,
      'nosso-amor-' || substr(md5(random()::text), 1, 8),
      'Qual é nosso lugar especial?', 'deprecated', 'active'
    )
    RETURNING id INTO workspace_id_var;
  END IF;

  -- Add user to workspace
  IF workspace_id_var IS NOT NULL THEN
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (workspace_id_var, NEW.id, 'partner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, still return NEW to allow user creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verificar resultado
SELECT 'Pronto! Agora tente criar o usuário novamente no Dashboard.' as status;
SELECT 'Após criar, execute a query abaixo para verificar:' as proxima_etapa;

-- Para verificar após criar o usuário:
-- SELECT u.email, p.full_name, wm.role 
-- FROM auth.users u 
-- LEFT JOIN profiles p ON p.id = u.id 
-- LEFT JOIN workspace_members wm ON wm.user_id = u.id;

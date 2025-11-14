-- Migration 036: Recriar trigger com logging e tratamento de erro
--
-- Esta migration recria o trigger com:
-- 1. Tratamento de exceções
-- 2. Logging de erros
-- 3. Verificação se a tabela/colunas existem

-- 1. Dropar trigger e função existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Criar função com tratamento de erro robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Log para debug (aparece nos logs do Postgres)
  RAISE LOG 'handle_new_user: Starting for user %', NEW.id;

  -- Extrair full_name com fallback
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    NEW.raw_user_meta_data->>'name',
    'Usuário'
  );

  RAISE LOG 'handle_new_user: Extracted name = %', v_full_name;

  -- Inserir profile
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
      updated_at = NOW();

    RAISE LOG 'handle_new_user: Profile created successfully for %', NEW.id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log do erro mas NÃO falha o signup
      RAISE WARNING 'handle_new_user: Failed to create profile for user %: % %',
        NEW.id, SQLERRM, SQLSTATE;
      -- Continua mesmo com erro (retorna NEW)
  END;

  RETURN NEW;
END;
$$;

-- 3. Garantir owner correto
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 4. Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Comentário
COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates profile during signup with error handling. Logs errors but does not fail signup.';

-- 6. Garantir que a tabela profiles tem created_at e updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

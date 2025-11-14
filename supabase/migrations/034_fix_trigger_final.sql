-- SOLUÇÃO FINAL: Recriar trigger com SECURITY DEFINER que realmente bypassa RLS
-- O truque é usar SET search_path e garantir que a função é owner da tabela

-- 1. Recriar a função com configurações corretas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Executa com permissões do owner (postgres)
SET search_path = public -- Define search path explícito
LANGUAGE plpgsql
AS $$
BEGIN
  -- INSERT direto sem verificar RLS (SECURITY DEFINER bypassa RLS)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Garantir que a função pertence ao postgres (superuser)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- 3. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a profile entry when a new user signs up. Runs with SECURITY DEFINER as postgres to bypass RLS.';

# 🔧 Como Corrigir o Erro de Signup

## ❌ Problema Atual

Ao tentar criar um novo usuário, você recebe este erro:

```
POST https://wpgaxoqbrdyfihwzoxlc.supabase.co/auth/v1/signup 500 (Internal Server Error)
Database error saving new user
```

## 🔍 Causa Raiz

O trigger do banco de dados que deveria criar automaticamente o perfil do usuário não está funcionando corretamente. Isso acontece porque:

1. A migration `034_fix_trigger_final.sql` não foi aplicada no banco de dados
2. Sem essa migration, o trigger `handle_new_user()` não tem permissões suficientes para criar o perfil durante o signup

## ✅ Solução (Passo a Passo)

### Passo 1: Acessar o SQL Editor do Supabase

1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/sql/new
3. Faça login se necessário

### Passo 2: Copiar o SQL

Copie o SQL abaixo (já está otimizado e pronto para uso):

```sql
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
```

### Passo 3: Executar o SQL

1. Cole o SQL copiado no editor SQL do Supabase
2. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
3. Aguarde a mensagem de sucesso aparecer

### Passo 4: Verificar

Você deve ver uma mensagem como:

```
Success. No rows returned
```

Isso é normal! O SQL criou o trigger mas não retorna dados.

### Passo 5: Testar o Signup

1. Volte para a aplicação: https://sindoca.vercel.app/auth/signup
2. Tente criar um novo usuário
3. O signup deve funcionar agora! ✨

## 📝 O Que Essa Migration Faz?

1. **SECURITY DEFINER**: Faz a função executar com permissões do proprietário (postgres), bypassando as políticas RLS
2. **SET search_path**: Define explicitamente o schema `public` para evitar ambiguidades
3. **ON CONFLICT DO NOTHING**: Evita erros se o perfil já existir
4. **COALESCE**: Usa o nome fornecido ou 'Usuário' como fallback

## 🆘 Solução de Problemas

### Erro: "permission denied"

Se você receber erro de permissão, significa que seu usuário não tem direitos de superuser. Neste caso:

1. Use a chave Service Role em vez da Anon Key
2. Ou execute o SQL diretamente no dashboard do Supabase (recomendado)

### Signup ainda não funciona

1. Verifique se o SQL foi executado com sucesso
2. Tente fazer logout e login novamente
3. Limpe o cache do navegador (Ctrl+Shift+Del)
4. Verifique os logs no console do navegador (F12)

### Verificar se o Trigger Existe

Execute este SQL para verificar:

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Deve retornar uma linha mostrando o trigger.

## 🎯 Resultado Esperado

Após aplicar essa migration:

- ✅ Novos usuários podem se cadastrar sem erro 500
- ✅ O perfil é criado automaticamente na tabela `profiles`
- ✅ O workspace padrão é criado (se não houver invite code)
- ✅ Email de confirmação é enviado corretamente

## 📚 Arquivos Relacionados

- Migration: `/supabase/migrations/034_fix_trigger_final.sql`
- Script helper: `/scripts/apply-migration-034.js`
- Código signup: `/lib/api/auth.ts` (função `signUp()`)

## 💡 Próximos Passos

Depois que o signup funcionar, não esqueça de:

1. ✅ Configurar URLs de callback no Supabase Dashboard (já feito no código)
2. ✅ Adicionar `NEXT_PUBLIC_SITE_URL` nas variáveis de ambiente do Vercel
3. ✅ Testar o fluxo completo de signup → confirmação email → login

---

**Dúvidas?** Verifique os logs do navegador (F12 → Console) para mais detalhes do erro.

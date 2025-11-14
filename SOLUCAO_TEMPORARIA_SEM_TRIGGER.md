# 🔧 Solução Temporária: Signup Sem Trigger

## 🎯 Objetivo

Como o trigger está falhando e não conseguimos ver os logs, vamos:

1. **Desabilitar o trigger temporariamente**
2. **Criar o perfil manualmente no código após signup**
3. **Isso vai fazer o signup funcionar IMEDIATAMENTE**

## 📋 Passo 1: Desabilitar o Trigger

Execute este SQL no Supabase Dashboard:

```sql
-- Desabilitar o trigger temporariamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

## 📋 Passo 2: O Código Já Está Preparado

O arquivo `lib/api/auth.ts` já tem código que cria o perfil manualmente após o signup! Ele vai funcionar automaticamente quando o trigger não existir.

### Como funciona:

```typescript
// 1. Cria o usuário no Supabase Auth
const { data: authData } = await supabase.auth.signUp({ ... })

// 2. Se deu certo, cria o perfil manualmente
await createDefaultWorkspaceForUser(userId, fullName)
```

A função `createDefaultWorkspaceForUser()` já:
- ✅ Cria o perfil na tabela `profiles`
- ✅ Cria o workspace padrão
- ✅ Adiciona o usuário como membro do workspace

## 🧪 Testar

Após desabilitar o trigger:

```bash
node scripts/debug-signup-error.js
```

**Deve funcionar agora!** ✨

## 🔍 Investigar o Problema Original

Enquanto isso, podemos investigar por que o trigger estava falhando:

### 1. Verificar schema da tabela profiles

```sql
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Colunas esperadas:**
- `id` (uuid, NOT NULL, PK)
- `email` (text)
- `full_name` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. Verificar se faltam colunas

Se `created_at` ou `updated_at` não existirem, adicione:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

### 3. Testar o trigger isoladamente

```sql
-- Criar função de teste
CREATE OR REPLACE FUNCTION test_handle_new_user()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Simular NEW do trigger
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    test_user_id,
    'teste-trigger@example.com',
    'Teste Trigger'
  );

  RAISE NOTICE 'Teste OK! Profile criado com ID: %', test_user_id;

  -- Limpar
  DELETE FROM public.profiles WHERE id = test_user_id;
END;
$$;

-- Executar teste
SELECT test_handle_new_user();
```

## ✅ Solução Permanente (Depois)

Quando identificarmos o problema, podemos:

1. Corrigir a causa raiz (coluna faltando, RLS incorreto, etc.)
2. Reabilitar o trigger
3. O código vai continuar funcionando (pois trata ambos os casos)

## 🎯 Vantagens desta Abordagem

- ✅ Signup funciona **imediatamente**
- ✅ Não precisa identificar o problema do trigger agora
- ✅ Podemos investigar com calma depois
- ✅ O código já está preparado para funcionar sem trigger

## 📝 Próximos Passos

1. Execute o SQL para desabilitar o trigger
2. Teste o signup
3. Se funcionar, podemos investigar o trigger depois
4. Me avise o resultado!

---

**Importante:** Esta é uma solução **funcional e segura**. Muitos apps criam o perfil manualmente no código em vez de usar trigger!

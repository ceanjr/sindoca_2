# 🔧 Aplicar Migration 035 - Corrigir RLS para Signup

## 🎯 O Que Esta Migration Faz

Esta migration corrige as políticas RLS da tabela `profiles` para permitir que o trigger `handle_new_user()` crie perfis durante o signup.

### Problema Identificado

A política atual "Users can insert own profile" tem esta condição:

```sql
with_check: "((auth.uid() = id) OR (auth.uid() IS NULL))"
```

Durante o signup, quando o trigger tenta criar o perfil, o `auth.uid()` ainda não está totalmente disponível, causando o erro:

```
Database error saving new user (500)
```

### Solução

Nova política que permite:
1. Usuários inserirem seu próprio perfil (`auth.uid() = id`)
2. **Trigger executar como postgres** (`current_user = 'postgres'`)
3. **Funções do authenticator** inserirem perfis

---

## 📋 Como Aplicar

### Passo 1: Acessar SQL Editor

Abra: https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/sql/new

### Passo 2: Copiar e Executar este SQL

```sql
-- Migration 035: Fix RLS policies for profile insertion during signup

-- 1. Remover a política problemática
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 2. Criar nova política que funciona com SECURITY DEFINER
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

-- 4. Verificar se RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### Passo 3: Verificar Sucesso

Você deve ver:

```
Success. No rows returned
```

---

## 🧪 Testar

Após aplicar a migration:

1. Acesse: https://sindoca.vercel.app/auth/signup
2. Tente criar um novo usuário
3. O signup deve funcionar agora! ✨

**OU** execute o script de debug:

```bash
node scripts/debug-signup-error.js
```

Você deve ver: **✅ SIGNUP BEM SUCEDIDO!**

---

## 🔍 Verificar Políticas Após Aplicar

Execute este SQL para confirmar as políticas:

```sql
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
```

**Resultado esperado:** 3 políticas:

1. ✅ "Service role can insert profiles" (role: service_role)
2. ✅ "Allow all inserts for service role" (role: public, with_check: true)
3. ✅ "Allow profile creation during signup and by user" (nova política)

---

## 🆘 Se Ainda Não Funcionar

1. **Verificar logs do Postgres:**
   https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/logs/postgres-logs

2. **Verificar se o trigger existe:**
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```

3. **Recriar o trigger** (migration 034):
   ```sql
   -- Execute o SQL de: supabase/migrations/034_fix_trigger_final.sql
   ```

4. **Verificar função handle_new_user:**
   ```sql
   SELECT security_type
   FROM information_schema.routines
   WHERE routine_name = 'handle_new_user';
   ```

   Deve retornar: `DEFINER`

---

## 📚 Arquivos Relacionados

- Migration SQL: `/supabase/migrations/035_fix_rls_insert_profiles.sql`
- Guia anterior: `/CORRIGIR_SIGNUP_ERROR.md`
- Debug SQL: `/DEBUG_SQL_EXECUTAR.sql`
- Script de teste: `/scripts/debug-signup-error.js`

---

## 💡 Por Que Isso Funciona?

A função `handle_new_user()` é criada com `SECURITY DEFINER`, o que significa que ela executa com as permissões do **owner da função (postgres)**.

Quando a função executa:
- `current_user` = 'postgres'
- A nova política RLS detecta isso e permite o INSERT
- O perfil é criado com sucesso
- O signup funciona! 🎉

---

**Após aplicar, me avise o resultado!** 🚀

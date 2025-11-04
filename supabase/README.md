# Supabase Migrations

## Como Aplicar as Migrations

### Opção 1: Via SQL Editor no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute as migrations na ordem:

#### Migration 001: Schema Inicial
```sql
-- Copie e cole o conteúdo de migrations/001_initial_schema.sql
```

#### Migration 002: Auto Create Profile
```sql
-- Copie e cole o conteúdo de migrations/002_auto_create_profile.sql
```

### Opção 2: Via Supabase CLI

```bash
# Instale a CLI
npm install -g supabase

# Faça login
supabase login

# Link ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplique migrations
supabase db push
```

## Verificar se o Trigger Está Funcionando

Execute no SQL Editor:

```sql
-- Verificar se a função existe
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Verificar se o trigger existe
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

## O que a Migration 002 Faz

- ✅ Cria automaticamente um perfil quando um usuário se registra
- ✅ Usa o `full_name` dos metadados do usuário
- ✅ Evita erro 401 Unauthorized ao tentar criar perfil manualmente
- ✅ Garante que o perfil existe antes do usuário fazer login

## Testando

Após aplicar as migrations:

1. Limpe os dados existentes (se for ambiente de dev):
```sql
DELETE FROM public.profiles;
```

2. Registre um novo usuário no app
3. Verifique se o perfil foi criado automaticamente:
```sql
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 1;
```

## Troubleshooting

### Erro: "relation auth.users does not exist"
- Você está em um banco local sem o schema auth do Supabase
- Use Supabase hospedado ou configure localmente com `supabase start`

### Perfil não é criado automaticamente
- Verifique se o trigger está ativo
- Verifique os logs do banco de dados
- Confirme que a função tem permissão SECURITY DEFINER

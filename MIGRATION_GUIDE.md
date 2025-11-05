# Como Aplicar a Migração para Love Reasons

## Problema
O erro 403 ao adicionar razões ocorre porque o tipo `'love_reason'` não está permitido na constraint da tabela `content`.

## Solução

### Opção 1: Via Painel do Supabase (Recomendado)

1. Acesse o painel do Supabase: https://app.supabase.com
2. Vá para o seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New query**
5. Cole o seguinte SQL:

```sql
-- Add 'love_reason' and 'legacy' types to content table type constraint
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_type_check;

ALTER TABLE content ADD CONSTRAINT content_type_check 
  CHECK (type IN ('photo', 'message', 'music', 'achievement', 'voice', 'story', 'love_reason', 'legacy'));
```

6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Verifique se a mensagem de sucesso aparece

### Opção 2: Via Supabase CLI

Se você tiver o Supabase CLI instalado:

```bash
supabase db push
```

### Verificar se funcionou

Após aplicar a migração, tente adicionar uma razão novamente na página `/amor`.

## Nota

Esta migração adiciona os tipos `'love_reason'` e `'legacy'` ao constraint existente, mantendo todos os tipos anteriores: `'photo'`, `'message'`, `'music'`, `'achievement'`, `'voice'`, `'story'`.

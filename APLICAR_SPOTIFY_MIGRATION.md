# Como Aplicar a Migration do Spotify

A migration está criada em: `supabase/migrations/011_add_spotify_integration.sql`

## Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o seguinte código:

```sql
-- Add Spotify integration columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS spotify_tokens JSONB,
ADD COLUMN IF NOT EXISTS spotify_user_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_display_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_spotify_user_id ON profiles(spotify_user_id);
```

6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Aguarde a confirmação de sucesso

## Opção 2: Via Supabase CLI (se tiver instalado)

```bash
cd /home/ceanbrjr/Dev/sindoca
supabase db push
```

## Após aplicar a migration:

1. Reinicie o servidor de desenvolvimento se estiver rodando
2. Peça para a Sindy acessar `/musica` novamente
3. Se ela já conectou antes, não precisará clicar em "Conectar" novamente!
4. O app buscará automaticamente os tokens salvos no banco de dados

## O que essa migration faz:

- Adiciona 3 colunas na tabela `profiles`:
  - `spotify_tokens`: Armazena os tokens de acesso e refresh do Spotify
  - `spotify_user_id`: ID do usuário no Spotify
  - `spotify_display_name`: Nome de exibição no Spotify
- Cria um índice para otimizar buscas pelo `spotify_user_id`

## Nota importante:

Se a Sindy já clicou para conectar antes desta migration, os tokens não foram salvos (porque as colunas não existiam). Ela precisará clicar em "Conectar Spotify" **uma última vez** após você aplicar a migration. Depois disso, nunca mais precisará conectar novamente! 🎵

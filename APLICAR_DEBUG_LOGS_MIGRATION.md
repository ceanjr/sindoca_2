# Como Aplicar a Migration de Debug Logs

A migration está criada em: `supabase/migrations/012_add_debug_logs.sql`

## Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `supabase/migrations/012_add_debug_logs.sql`
6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Aguarde a confirmação de sucesso

## Opção 2: Via Supabase CLI (se tiver instalado)

```bash
cd /home/ceanbrjr/Dev/sindoca
supabase db push
```

## Após aplicar a migration:

1. Acesse `/debug-logs` no site
2. Você verá uma página vazia (sem logs ainda)
3. Peça para a Sindy acessar `/musica` e clicar em "Conectar Spotify"
4. Volte para `/debug-logs` e clique em "Recarregar"
5. Você verá todos os logs do processo de conexão dela!

## O que essa migration faz:

- Cria a tabela `debug_logs` para armazenar logs remotos
- Adiciona índices para consultas rápidas
- Configura RLS (Row Level Security)
- Permite que qualquer usuário autenticado insira logs
- Todos podem ver todos os logs (útil para debug)

## Como usar:

### Ver logs:
1. Acesse: `https://seu-site.com/debug-logs`
2. Filtre por categoria (ex: "spotify-check", "spotify-callback", "spotify-connect")
3. Filtre por nível (info, warn, error, debug)
4. Exporte os logs como JSON se precisar

### Logs capturados automaticamente:

**Categoria "spotify-connect":**
- Quando o usuário clica em "Conectar Spotify"

**Categoria "spotify-check":**
- Quando a página verifica se o Spotify está conectado
- Mostra se encontrou tokens, spotify_user_id, etc.

**Categoria "spotify-callback":**
- Quando o usuário volta do Spotify após autorizar
- Mostra se os tokens foram salvos com sucesso
- Mostra erros caso algo dê errado

**Erros gerais:**
- Qualquer erro não tratado no navegador
- Promise rejections

## Exemplo de uso:

1. Sindy acessa `/musica`
2. Você vê em `/debug-logs`:
   ```
   ℹ️ INFO | spotify-check | Verificando conexão do Spotify
   Data: { userId: "...", userEmail: "sindy@..." }

   ℹ️ INFO | spotify-check | Dados do perfil retornados
   Data: { hasTokens: false, spotifyUserId: null, ... }

   ℹ️ INFO | spotify-check | ❌ Spotify não conectado
   ```

3. Sindy clica em "Conectar Spotify"
   ```
   ℹ️ INFO | spotify-connect | Iniciando conexão com Spotify
   Data: { userId: "...", userEmail: "sindy@..." }
   ```

4. Sindy autoriza no Spotify e volta
   ```
   ℹ️ INFO | spotify-callback | Parâmetro connected=true detectado!

   ℹ️ INFO | spotify-callback | Verificando conexão após callback...
   Data: { userId: "..." }

   ℹ️ INFO | spotify-callback | Dados após callback
   Data: { hasTokens: true, spotifyUserId: "...", spotifyDisplayName: "Sindy" }

   ℹ️ INFO | spotify-callback | ✅ Conexão confirmada!
   ```

## Limpar logs antigos:

Para limpar logs com mais de 7 dias (opcional):

```sql
SELECT clean_old_debug_logs();
```

Ou use o botão "Limpar" na página `/debug-logs` para limpar TODOS os logs.

## Importante:

- Os logs incluem email do usuário - tenha cuidado com privacidade
- Máximo de 100 logs por sessão para evitar spam
- Logs são enviados de forma assíncrona para não bloquear a UI

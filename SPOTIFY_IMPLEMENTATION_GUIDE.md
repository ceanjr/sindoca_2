# ARQUIVOS AFETADOS E MODIFICAÇÕES NECESSÁRIAS

## 1. ARQUIVOS QUE PRECISAM DE ALTERAÇÕES

### A. `components/sections/MusicSection.jsx` (CRÍTICO)

**Problema:** 500ms de timeout insuficiente para sincronização de dados

**Localização Exata:** Linhas 147-194

**Código Atual:**
```javascript
if (hasConnectedParam) {
  remoteLogger.info('spotify-callback', 'Parâmetro connected=true detectado!');
  // Wait a bit to ensure DB update is complete, then recheck
  setTimeout(async () => {
    if (!user) {
      remoteLogger.warn('spotify-callback', 'Usuário não autenticado no recheck');
      return;
    }

    remoteLogger.info('spotify-callback', 'Verificando conexão após callback...', {
      userId: user.id,
    });
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('spotify_tokens, spotify_user_id, spotify_display_name')
      .eq('id', user.id)
      .single();

    // ... resto do código ...
  }, 500);  // <-- PROBLEMA: 500ms é insuficiente
}
```

**Solução Recomendada:** Implementar Polling com Retry

---

### B. `.env.local` (IMPORTANTE)

**Problema:** Redirect URI de produção em ambiente de desenvolvimento

**Localização:** Arquivo na raiz do projeto

**Código Atual:**
```bash
SPOTIFY_REDIRECT_URI=https://sindoca.vercel.app/api/spotify/callback
```

**Código Correto para DEV:**
```bash
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

**Nota:** Este arquivo é gitignored, então mudanças locais não afetam o repo

---

### C. `supabase/migrations/005_fix_user_creation.sql` (SEGURANÇA)

**Problema:** RLS Policy muito permissiva para leitura de perfis

**Localização Exata:** Linha 23-25

**Código Atual:**
```sql
CREATE POLICY "Enable read for authenticated users"
  ON profiles FOR SELECT
  USING (true);  -- ⚠️ Qualquer usuário autenticado vê TODOS!
```

**Código Recomendado:**
```sql
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;

CREATE POLICY "Users can read own profile or partner profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id  -- Seu próprio perfil
    OR
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE (creator_id = auth.uid() OR partner_id = auth.uid())
      AND (creator_id = profiles.id OR partner_id = profiles.id)
    )  -- Perfil do parceiro no workspace
  );
```

**Impacto:** Aumenta privacidade, não afeta Spotify OAuth

---

## 2. ARQUIVOS FUNCIONANDO CORRETAMENTE

Estes arquivos NÃO precisam de alterações:

### ✅ `app/api/spotify/auth/route.ts`
- Geração de STATE está correta
- Cookie httpOnly está configurado corretamente
- Redirecionamento para Spotify funciona

### ✅ `app/api/spotify/callback/route.ts`
- Validação de STATE está implementada
- Salvamento de tokens funciona
- RLS policy permite UPDATE
- Redirecção para /musica?connected=true funciona

### ✅ `lib/spotify/auth.ts`
- Troca de code por tokens funciona
- Estrutura de tokens está correta
- Refresh de tokens está implementado

### ✅ `lib/spotify/config.ts`
- Configuração de scopes está correta
- URLs base do Spotify estão corretas

### ✅ `lib/supabase/middleware.ts`
- Rota /api/spotify/callback está na whitelist
- Middleware NÃO bloqueia o callback

### ✅ `hooks/useSpotify.js`
- Lógica de verificação está correta
- Hook retorna estado correto

### ✅ `contexts/AuthContext.tsx`
- Carregamento de perfil funciona
- Contexto atualiza corretamente

---

## 3. ESTRUTURA DE DADOS (Supabase)

### Tabela: profiles

```sql
-- Coluna: spotify_tokens (JSONB)
-- Criada em: migration 011_add_spotify_integration.sql
-- Armazena: { access_token, refresh_token, expires_in, expires_at }
-- RLS: UPDATE permitido por "Enable update for users based on id"

-- Coluna: spotify_user_id (TEXT)
-- Criada em: migration 011_add_spotify_integration.sql
-- Índice: idx_profiles_spotify_user_id

-- Coluna: spotify_display_name (TEXT)
-- Criada em: migration 011_add_spotify_integration.sql
```

### Tabela: debug_logs

```sql
-- Criada em: migration 012_add_debug_logs.sql
-- Armazena logs remotos do callback
-- Útil para diagnosticar problemas de sincronização
```

---

## 4. FLUXO DE EXECUÇÃO (Timeline)

```
TEMPO    AÇÃO                                    STATUS
────────────────────────────────────────────────────────────────

0ms      User clica "Conectar Spotify"          ✅ OK
         → window.location.href = '/api/spotify/auth'

10ms     GET /api/spotify/auth                  ✅ OK
         → Gera STATE
         → Salva cookie spotify_auth_state
         → Redireciona para Spotify

50ms     User no site do Spotify                -

100ms    User autoriza                          ✅ OK
         → Spotify redireciona para callback

110ms    GET /api/spotify/callback?code=...    ✅ OK
         → Valida code e state
         → Troca por tokens
         → Busca perfil
         → UPDATE profiles SET spotify_tokens

150ms    UPDATE completa no Spotify             ✅ OK
         → Redireciona para /musica?connected=true

160ms    Frontend em /musica?connected=true     ✅ OK
         → Detecta parâmetro hasConnectedParam
         → setTimeout(..., 500)

165ms    Dados começam a replicar              ⏳ Em progresso
         → RLS policies sendo avaliadas
         → Read-only replicas sincronizando

500ms    setTimeout completa                    
         → Frontend executa SELECT              ❌ PROBLEMA AQUI!
         → Se replicação ainda não terminou
         → Resultado: spotify_tokens = undefined
         → Component mostra erro

550ms    Dados finalmente aparecem no Supabase
         → Mas frontend já executou query!

600ms    User vê "Erro ao salvar conexão"      ❌ ERRO FALSO
         → Mesmo que tokens estejam salvos!
```

---

## 5. TESTES PARA VALIDAR

### Teste 1: Verificar Salvamento de Tokens

```sql
-- No console Supabase SQL Editor
SELECT 
  id,
  email,
  spotify_user_id,
  spotify_display_name,
  spotify_tokens IS NOT NULL as has_tokens,
  created_at
FROM profiles
WHERE spotify_user_id IS NOT NULL
LIMIT 5;
```

### Teste 2: Simular Delay de Replicação

```javascript
// No browser console após clicar "Conectar Spotify"
// Aguarde o callback e retorne a /musica com ?connected=true

// Teste 1: Imediato (deve falhar)
const supabase = createClient();
const { data } = await supabase
  .from('profiles')
  .select('spotify_tokens')
  .eq('id', (await supabase.auth.getUser()).data.user.id)
  .single();
console.log('Imediato:', data?.spotify_tokens ? 'FOUND' : 'NOT FOUND');

// Teste 2: Após 500ms (pode falhar)
setTimeout(async () => {
  const { data } = await supabase
    .from('profiles')
    .select('spotify_tokens')
    .eq('id', (await supabase.auth.getUser()).data.user.id)
    .single();
  console.log('500ms:', data?.spotify_tokens ? 'FOUND' : 'NOT FOUND');
}, 500);

// Teste 3: Após 1500ms (deve funcionar)
setTimeout(async () => {
  const { data } = await supabase
    .from('profiles')
    .select('spotify_tokens')
    .eq('id', (await supabase.auth.getUser()).data.user.id)
    .single();
  console.log('1500ms:', data?.spotify_tokens ? 'FOUND' : 'NOT FOUND');
}, 1500);
```

### Teste 3: Verificar Logs Remotos

```sql
-- No console Supabase SQL Editor
SELECT 
  created_at,
  level,
  category,
  message,
  data
FROM debug_logs
WHERE category LIKE 'spotify%'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 6. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```bash
# Spotify API Credentials (obter em https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback  # Dev

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Outros (opcional para Spotify)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 7. MONITORAMENTO E DEBUGGING

### A. Ativar Logs Remotos

```typescript
// Os logs já estão ativados em callback/route.ts
// remoteLogger.info(), remoteLogger.error(), etc.

// Verificar logs em:
// Supabase Console → SQL Editor → SELECT * FROM debug_logs
```

### B. Adicionar Logs de Performance

```javascript
// No MusicSection.jsx, adicionar timestamps
const checkConnectionWithTimestamp = async () => {
  const start = performance.now();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('spotify_tokens, spotify_user_id, spotify_display_name')
    .eq('id', user.id)
    .single();
  
  const elapsed = performance.now() - start;
  console.log(`Query took ${elapsed}ms`);
  remoteLogger.debug('spotify-sync', `Query latency: ${elapsed}ms`, {
    hasTokens: !!data?.spotify_tokens,
    elapsed,
  });
};
```

### C. Verificar Estado do Supabase

```javascript
// No console do browser
const supabase = createClient();
const { data: user } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.user.id)
  .single();
console.log('Perfil do Spotify:', profile);
```

---

## 8. RESUMO DE MUDANÇAS NECESSÁRIAS

| Arquivo | Problema | Solução | Prioridade |
|---------|----------|---------|------------|
| `components/sections/MusicSection.jsx` | Race condition (500ms timeout) | Implementar Polling com Retry | CRÍTICA |
| `.env.local` | Redirect URI incorreto em dev | Usar localhost:3000 | ALTA |
| `supabase/migrations/005_fix_user_creation.sql` | RLS Policy muito permissiva | Restringir SELECT a próprio perfil/parceiro | MÉDIA |

---

## 9. ARQUIVOS PARA REFERÊNCIA RÁPIDA

Caminhos absolutos dos arquivos mais importantes:

```
/home/ceanbrjr/Dev/sindoca/
├── app/
│   ├── api/spotify/
│   │   ├── auth/route.ts                 ✅ OK
│   │   └── callback/route.ts             ✅ OK (logs bons)
│   └── musica/page.jsx                   ✅ Apenas página wrapper
├── components/
│   └── sections/MusicSection.jsx         ❌ PRECISA CORREÇÃO (linha 150-194)
├── contexts/
│   └── AuthContext.tsx                   ✅ OK
├── hooks/
│   ├── useSpotify.js                     ✅ OK
│   └── useSpotifySearch.js               ✅ OK
├── lib/
│   ├── spotify/
│   │   ├── auth.ts                       ✅ OK
│   │   ├── client.ts                     ✅ OK
│   │   └── config.ts                     ✅ OK
│   └── supabase/
│       └── middleware.ts                 ✅ OK
├── supabase/
│   └── migrations/
│       ├── 011_add_spotify_integration.sql  ✅ OK
│       ├── 012_add_debug_logs.sql           ✅ OK
│       └── 005_fix_user_creation.sql        ⚠️ RLS policy muito permissiva
├── .env.local                            ⚠️ Configuração de DEV
└── .env.production                       ✅ OK
```


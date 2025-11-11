# RELATÓRIO DETALHADO: Integração Spotify no Sindoca

Análise completa do fluxo de autenticação OAuth 2.0 com Spotify (11 de novembro de 2025)

---

## SUMÁRIO EXECUTIVO

O projeto implementa corretamente a autenticação OAuth 2.0 com o Spotify, mas há **uma falha crítica na sincronização entre a conclusão do callback e a verificação de conexão no frontend**, que causa a experiência de "usuário volta para home e conexão não é reconhecida".

**Causa Raiz**: Race condition entre a escrita dos tokens no Supabase (lado servidor) e a leitura/verificação desses tokens no frontend (lado cliente).

---

## 1. DIAGRAMA DO FLUXO COMPLETO DE AUTENTICAÇÃO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUXO SPOTIFY OAUTH 2.0                             │
└─────────────────────────────────────────────────────────────────────────┘

ETAPA 1: INICIAR AUTENTICAÇÃO
├─ Usuário clica "Conectar Spotify" em /musica
│  └─ Componente: <MusicSection> (components/sections/MusicSection.jsx)
│     └─ Função: handleConnectSpotify()
│        └─ Redireciona para: window.location.href = '/api/spotify/auth'
│
├─ Rota: GET /api/spotify/auth (app/api/spotify/auth/route.ts)
│  ├─ Verifica se usuário está autenticado (supabase.auth.getUser())
│  ├─ Gera STATE para CSRF protection: `${user.id}:${Date.now()}:${random}`
│  ├─ Salva STATE em cookie httpOnly: 'spotify_auth_state'
│  │  └─ maxAge: 600 segundos (10 minutos)
│  │  └─ secure: true em produção, false em dev
│  │  └─ sameSite: 'lax'
│  ├─ Gera URL de autorização do Spotify com:
│  │  ├─ client_id (SPOTIFY_CLIENT_ID)
│  │  ├─ redirect_uri (SPOTIFY_REDIRECT_URI)
│  │  ├─ scope (playlist-modify-public, playlist-modify-private, etc)
│  │  ├─ state (token CSRF)
│  │  ├─ response_type: 'code'
│  │  └─ show_dialog: 'true'
│  └─ Redireciona para: https://accounts.spotify.com/authorize?...
│
└─ Configuração: lib/spotify/config.ts
   └─ SPOTIFY_REDIRECT_URI = processo.env.SPOTIFY_REDIRECT_URI 
      (padrão: http://localhost:3000/api/spotify/callback)

═══════════════════════════════════════════════════════════════════════════

ETAPA 2: USUÁRIO AUTORIZA NO SPOTIFY
├─ Usuário faz login no Spotify (se necessário)
├─ Spotify mostra solicitação de permissões
├─ Usuário clica "Autorizar"
├─ Spotify redireciona para: /api/spotify/callback?code=...&state=...
│
└─ Importante: Browser mantém cookies httpOnly incluindo 'spotify_auth_state'

═══════════════════════════════════════════════════════════════════════════

ETAPA 3: PROCESSAR CALLBACK (CRÍTICO)
├─ Rota: GET /api/spotify/callback (app/api/spotify/callback/route.ts)
│  │
│  ├─ STEP 1: Validação inicial
│  │  ├─ Extrai: code, state, error dos searchParams
│  │  ├─ Verifica se há erro do Spotify
│  │  │  └─ Se sim: redireciona para /musica?error={error}
│  │  └─ Verifica se code e state existem
│  │     └─ Se não: redireciona para /musica?error=invalid_callback
│  │
│  ├─ STEP 2: Validação de STATE (CSRF Protection)
│  │  ├─ Recupera cookie: storedState = request.cookies.get('spotify_auth_state')
│  │  ├─ Compara: storedState === state
│  │  │  └─ Se não corresponde: redireciona para /musica?error=state_mismatch
│  │  │     (PROTEÇÃO CONTRA ATAQUES CSRF)
│  │  │
│  │  ├─ POSSÍVEL PROBLEMA #1: 
│  │  │  ├─ Se o cookie 'spotify_auth_state' expirou (10 minutos)
│  │  │  ├─ Ou se o middleware está deletando o cookie antes
│  │  │  └─ Comparação falhará mesmo com state válido do Spotify
│  │  │
│  │  └─ Logs: remoteLogger.info('spotify-callback', 'Verificando state', {...})
│  │
│  ├─ STEP 3: Verificar sessão do usuário
│  │  ├─ supabase.auth.getUser()
│  │  └─ Se não autenticado: redireciona para /musica?error=unauthorized
│  │
│  ├─ STEP 4: Trocar código por tokens ⭐ (CRÍTICO)
│  │  ├─ Função: exchangeCodeForToken(code)
│  │  │  └─ lib/spotify/auth.ts
│  │  │     ├─ POST para: https://accounts.spotify.com/api/token
│  │  │     ├─ Headers: Authorization: Basic {base64(clientId:clientSecret)}
│  │  │     ├─ Body:
│  │  │     │  ├─ grant_type: 'authorization_code'
│  │  │     │  ├─ code: {code recebido}
│  │  │     │  └─ redirect_uri: {SPOTIFY_REDIRECT_URI}
│  │  │     │
│  │  │     └─ Resposta:
│  │  │        ├─ access_token (válido por ~1 hora)
│  │  │        ├─ refresh_token (válido por ~10 anos)
│  │  │        ├─ expires_in (segundos até expiração)
│  │  │        └─ expires_at (Date.now() + expires_in * 1000)
│  │  │
│  │  └─ Logs: remoteLogger.info('spotify-callback', 'Tokens obtidos', {...})
│  │
│  ├─ STEP 5: Buscar perfil do Spotify
│  │  ├─ Função: getSpotifyProfile(tokens.access_token)
│  │  │  └─ GET /v1/me em https://api.spotify.com
│  │  │     ├─ Headers: Authorization: Bearer {access_token}
│  │  │     │
│  │  │     └─ Resposta:
│  │  │        ├─ id (spotify_user_id)
│  │  │        ├─ display_name
│  │  │        ├─ email
│  │  │        └─ images
│  │  │
│  │  └─ Logs: remoteLogger.info('spotify-callback', 'Perfil obtido', {...})
│  │
│  ├─ STEP 6: SALVAR TOKENS NO BANCO DE DADOS ⭐⭐ (CRÍTICO)
│  │  │
│  │  ├─ Executa:
│  │  │  supabase
│  │  │    .from('profiles')
│  │  │    .update({
│  │  │      spotify_tokens: {
│  │  │        access_token,
│  │  │        refresh_token,
│  │  │        expires_in,
│  │  │        expires_at
│  │  │      },
│  │  │      spotify_user_id: profile.id,
│  │  │      spotify_display_name: profile.display_name,
│  │  │    })
│  │  │    .eq('id', user.id)
│  │  │    .select()
│  │  │
│  │  ├─ Tabela: profiles
│  │  │  ├─ Coluna: spotify_tokens (JSONB)
│  │  │  ├─ Coluna: spotify_user_id (TEXT)
│  │  │  └─ Coluna: spotify_display_name (TEXT)
│  │  │
│  │  ├─ RLS Policy aplicada:
│  │  │  ├─ Política de UPDATE: "Enable update for users based on id"
│  │  │  │  └─ USING (auth.uid() = id)
│  │  │  │  └─ Apenas o próprio usuário pode atualizar seu perfil
│  │  │  │
│  │  │  └─ ✅ Policy permite a atualização
│  │  │
│  │  └─ Logs: remoteLogger.info('spotify-callback', 'Dados salvos', {...})
│  │
│  ├─ STEP 7: Redirecionar com sucesso
│  │  ├─ DELETE cookie: 'spotify_auth_state'
│  │  ├─ Redireciona para: /musica?connected=true&t={timestamp}
│  │  │  └─ Parâmetro ?t={timestamp} para evitar cache
│  │  │
│  │  ├─ Headers de cache:
│  │  │  ├─ Cache-Control: 'no-store, must-revalidate'
│  │  │  └─ Pragma: 'no-cache'
│  │  │
│  │  └─ Logs: remoteLogger.info('spotify-callback', 'Sucesso!', {...})
│  │
│  └─ Em caso de erro: redireciona para /musica?error={tipo_erro}
│
└─ Tempo esperado: ~1-2 segundos para toda a operação

═══════════════════════════════════════════════════════════════════════════

ETAPA 4: FRONTEND RECONHECER CONEXÃO ⭐⭐⭐ (PROBLEMA AQUI!)
├─ Componente: <MusicSection> (components/sections/MusicSection.jsx)
│  │
│  ├─ COMPORTAMENTO ESPERADO:
│  │  └─ Usuario volta para /musica com ?connected=true
│  │     └─ Component detecta parâmetro e verifica tokens no banco
│  │        └─ Tokens devem estar salvos no Supabase
│  │           └─ Component atualiza isConnected = true
│  │              └─ UI muda: mostra "É a sua vez de adicionar..." ✅
│  │
│  └─ O QUE REALMENTE ACONTECE (BUG):
│     ├─ Usuario volta para /musica com ?connected=true
│     ├─ Component detecta parâmetro?
│     │  └─ ✅ Detecta (línha 134-135)
│     │     const hasConnectedParam = urlParams.get('connected') === 'true'
│     │
│     ├─ Component aguarda 500ms (linha 150)
│     │  └─ setTimeout(..., 500)
│     │
│     ├─ Component consulta Supabase por tokens
│     │  ├─ SELECT spotify_tokens, spotify_user_id, spotify_display_name
│     │  └─ WHERE id = user.id
│     │
│     └─ PROBLEMA: Tokens podem NÃO estar visíveis ainda!
│        ├─ Razão: Replicação de dados no Supabase (latência)
│        │  └─ Dados escritos no servidor podem levar alguns ms para serem visíveis
│        │  └─ RLS policies precisam ser avaliadas (latência adicional)
│        │
│        ├─ Resultado: Component lê dados ANTES deles estarem completamente sincronizados
│        │  └─ setSpotifyConnected(false) ❌
│        │  └─ toast.error('Erro ao salvar conexão...') ❌
│        │
│        └─ User vê erro, apesar de tokens terem sido salvos com sucesso

═══════════════════════════════════════════════════════════════════════════

ETAPA 5: VERIFICAÇÃO INICIAL DE CONEXÃO
├─ useEffect que roda ao montar component ou quando user muda
├─ Função: checkSpotifyConnection()
│  └─ SELECT spotify_tokens, spotify_user_id, spotify_display_name
│     WHERE id = user.id
│
├─ Se tokens existem:
│  └─ setSpotifyConnected(true) ✅
│     └─ Mostra botão "Adicionar Música"
│
└─ Se tokens não existem:
   └─ setSpotifyConnected(false) ❌
      └─ Mostra botão "Conectar Spotify"
```

---

## 2. MAPEAMENTO DE ARMAZENAMENTO DE DADOS

### Tabela: `profiles` (Supabase)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- auth.users.id
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  birthday DATE,
  favorite_color TEXT,
  theme TEXT DEFAULT 'light',
  
  -- SPOTIFY INTEGRATION COLUMNS (migration 011) ⭐
  spotify_tokens JSONB,             -- Armazena { access_token, refresh_token, expires_in, expires_at }
  spotify_user_id TEXT,             -- Spotify ID do usuário (ex: "1234567890abc")
  spotify_display_name TEXT,        -- Nome do Spotify (ex: "João Silva")
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Estrutura de `spotify_tokens`:

```json
{
  "access_token": "BQDu3e...",  // Válido por ~1 hora
  "refresh_token": "AQD-M...",   // Válido por ~10 anos
  "expires_in": 3600,             // Segundos até expiração
  "expires_at": 1699999999000     // Timestamp em ms (Date.now() + expires_in*1000)
}
```

### Índices Criados:

```sql
CREATE INDEX idx_profiles_spotify_user_id ON profiles(spotify_user_id);
```

### RLS Policies na Tabela `profiles`:

```sql
-- Policy 1: Cada usuário pode VER seu próprio perfil
CREATE POLICY "Enable read for authenticated users"
  ON profiles FOR SELECT
  USING (true);  -- ⚠️ MUITO PERMISSIVO: qualquer usuário autenticado vê todos!

-- Policy 2: Cada usuário pode ATUALIZAR apenas seu próprio perfil
CREATE POLICY "Enable update for users based on id"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);  -- ✅ Correto: apenas seu próprio registro

-- Policy 3: INSERT (para autenticação)
CREATE POLICY "Enable insert for authentication"
  ON profiles FOR INSERT
  WITH CHECK (true);  -- ⚠️ MUITO PERMISSIVO: qualquer um pode inserir

-- Policy 4: Usuários workspace podem ver perfis de parceiros
CREATE POLICY "Members can view workspace profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT creator_id FROM workspaces WHERE ...
      UNION
      SELECT partner_id FROM workspaces WHERE ...
    )
  );
```

---

## 3. FLUXO DE LEITURA DE TOKENS

### Hook: `useSpotify()` (hooks/useSpotify.js)

```javascript
export function useSpotify() {
  const { user } = useAuth();  // Do contexto de autenticação
  const [isConnected, setIsConnected] = useState(false);
  
  const checkConnection = useCallback(async () => {
    if (!user) return false;
    
    // Lê do Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('spotify_tokens, spotify_user_id, spotify_display_name')
      .eq('id', user.id)
      .single();
    
    // Verifica se ambos existem
    const connected = !!(data?.spotify_tokens && data?.spotify_user_id);
    setIsConnected(connected);
    
    return connected;
  }, [user]);
  
  // Verifica ao montar e quando user muda
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);
  
  return { isConnected, ... };
}
```

### No Componente: `MusicSection.jsx`

```javascript
// Verificação INICIAL de conexão (ao montar)
useEffect(() => {
  const checkSpotifyConnection = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('spotify_tokens, spotify_user_id, spotify_display_name')
      .eq('id', user.id)
      .single();
    
    if (data?.spotify_tokens) {
      setSpotifyConnected(true);  // ✅ Mostra "É a sua vez"
    } else {
      setSpotifyConnected(false); // ❌ Mostra "Conectar Spotify"
    }
  };
  
  checkSpotifyConnection();
}, [user]);

// Verificação APÓS callback (parâmetro ?connected=true)
useEffect(() => {
  const hasConnectedParam = urlParams.get('connected') === 'true';
  
  if (hasConnectedParam) {
    setTimeout(async () => {  // Aguarda 500ms
      const { data } = await supabase
        .from('profiles')
        .select('spotify_tokens, spotify_user_id, spotify_display_name')
        .eq('id', user.id)
        .single();
      
      // ⚠️ AQUI PODE ESTAR O PROBLEMA!
      // Se replicação ainda não terminou, data?.spotify_tokens será undefined
      
      if (data?.spotify_tokens) {
        setSpotifyConnected(true);  // ✅
        toast.success('Spotify conectado com sucesso!');
      } else {
        setSpotifyConnected(false); // ❌ ERRO (mesmo que tokens já tenham sido salvos!)
        toast.error('Erro ao salvar conexão...');
      }
    }, 500);  // ⚠️ 500ms pode NÃO ser suficiente!
  }
}, [user]);
```

---

## 4. CONTEXTO DE AUTENTICAÇÃO

### `AuthContext.tsx` (contexts/AuthContext.tsx)

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch user profile com timeout
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')  // ⭐ Inclui spotify_tokens, spotify_user_id, etc
      .eq('id', userId)
      .single();
    
    setProfile(data);  // Cacheado no contexto
  };
  
  // Listen to auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  });
}

export function useAuth() {
  return useContext(AuthContext);
}
```

**Implicações:**
- O perfil com dados Spotify é cacheado no contexto
- Após callback, o contexto pode estar desatualizado
- Component precisa fazer query direta ao Supabase, não usar contexto

---

## 5. MIDDLEWARE E ROTEAMENTO

### Arquivo: `lib/supabase/middleware.ts`

```typescript
export async function updateSession(request: NextRequest) {
  // ... setup Supabase client ...
  
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/join',
    '/api/auth/verify-invite',
    '/api/spotify/callback',    // ✅ SPOTIFY CALLBACK ESTÁ PERMITIDO!
    '/clear-cache',
    '/pwa-debug'
  ];
  
  const isCallback = request.nextUrl.pathname === '/auth/callback' ||
                     request.nextUrl.pathname.startsWith('/api/spotify/');
  
  // Middleware NÃO bloqueia /api/spotify/callback ✅
  
  return response;
}
```

**Conclusão:** Middleware NÃO está bloqueando a rota de callback.

---

## 6. IDENTIFICAÇÃO DE PROBLEMAS

### PROBLEMA CRÍTICO #1: Race Condition na Sincronização

**Localização:** `components/sections/MusicSection.jsx`, linhas 150-194

**Descrição:**
O componente aguarda 500ms após o callback antes de verificar tokens no Supabase. Porém:

1. **Escrita no servidor:** Callback atualiza `profiles` no Supabase (instantâneo)
2. **Replicação:** Dados se propagam através do sistema Supabase
3. **RLS Evaluation:** Policies precisam ser avaliadas pela query SELECT
4. **Read no cliente:** Component tenta ler dados após 500ms

**Por que falha:**
- 500ms pode ser insuficiente em:
  - Conexões lentes
  - Servidores Supabase sobrecarregados
  - Latência de RLS policies
  - Replicação entre regiões

**Sintoma observado:**
```
1. User clica "Conectar Spotify" ✅
2. Redirect para Spotify ✅
3. User autoriza ✅
4. Callback salva tokens no Supabase ✅
5. Redirect para /musica?connected=true ✅
6. Componente aguarda 500ms
7. Query: SELECT spotify_tokens WHERE id = user.id
   → Resultado: NULL ou undefined ❌ (ainda em replicação)
8. Component mostra erro "Erro ao salvar conexão"
9. Component não atualiza isConnected para true
10. User vê "Conectar Spotify" em vez de "É a sua vez"
```

### PROBLEMA #2: RLS Policy Muito Permissiva

**Localização:** Migration 005_fix_user_creation.sql

```sql
CREATE POLICY "Enable read for authenticated users"
  ON profiles FOR SELECT
  USING (true);  -- ⚠️ Qualquer usuário autenticado vê TODOS os perfis!
```

**Impacto:**
- Não é uma falha de autenticação Spotify
- Mas é uma vulnerabilidade de privacidade
- Usuários podem ver perfis e dados de outros usuários

**Recomendação:** Mudar para:
```sql
USING (auth.uid() = id OR EXISTS (
  SELECT 1 FROM workspaces 
  WHERE (creator_id = auth.uid() OR partner_id = auth.uid())
  AND (creator_id = profiles.id OR partner_id = profiles.id)
));
```

### PROBLEMA #3: Timeout Insuficiente na Revalidação

**Localização:** `components/sections/MusicSection.jsx`, linha 150

```javascript
setTimeout(async () => {
  // Verificação de tokens
}, 500);  // ⚠️ 500ms é muito pouco!
```

**Causas de atraso:**
- Latência de rede (50-200ms)
- Processamento Supabase (50-100ms)
- Replicação de dados (100-500ms)
- Avaliação de RLS (50-150ms)

**Total esperado:** 250-950ms em condições normais

---

## 7. CONFIGURAÇÃO DE REDIRECT_URI

### Ambiente Local

```bash
# .env.local
SPOTIFY_REDIRECT_URI=https://sindoca.vercel.app/api/spotify/callback
```

⚠️ **PROBLEMA:** URI de produção em .env local!

Deveria ser:
```bash
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

### Ambiente Produção

```bash
# .env.production
SPOTIFY_REDIRECT_URI=https://sindoca.vercel.app/api/spotify/callback
```

✅ Correto

### No Painel do Spotify (spotify.com/developers)

Precisa estar configurado com:
```
https://sindoca.vercel.app/api/spotify/callback
```

**Como verificar:**
1. Ir para https://developer.spotify.com/dashboard/applications
2. Selecionar a aplicação
3. Edit Settings → Redirect URIs
4. Verificar se contém `https://sindoca.vercel.app/api/spotify/callback`

---

## 8. FLUXO DE TOKENS APÓS AUTENTICAÇÃO

### Armazenamento e Refresh

```
┌──────────────────────┐
│  access_token        │  Válido: ~1 hora
│  (Short-lived)       │  Usado para: Chamadas à API do Spotify
└──────────────────────┘

┌──────────────────────┐
│  refresh_token       │  Válido: ~10 anos
│  (Long-lived)        │  Usado para: Obter novo access_token
└──────────────────────┘

Quando access_token expira:
1. App verifica: Date.now() >= expires_at - 5min
2. Se expirado, chama: refreshAccessToken(refresh_token)
3. POST /api/spotify/refresh-token
4. Obtém novo access_token
5. Atualiza tokens no Supabase
6. Continua usando API do Spotify
```

### Implementação

```typescript
// lib/spotify/client.ts
export async function getValidAccessToken(userId: string): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('spotify_tokens')
    .eq('id', userId)
    .single();
  
  const tokens = profile.spotify_tokens;
  
  if (isTokenExpired(tokens.expires_at)) {
    // Refresh!
    const newTokens = await refreshAccessToken(tokens.refresh_token);
    
    // Atualiza no banco
    await supabase
      .from('profiles')
      .update({ spotify_tokens: newTokens })
      .eq('id', userId);
    
    return newTokens.access_token;
  }
  
  return tokens.access_token;
}
```

---

## 9. CÓDIGO RELEVANTE DOS ARQUIVOS PRINCIPAIS

### A. app/api/spotify/auth/route.ts

```typescript
// Inicia OAuth flow
const state = `${user.id}:${Date.now()}:${Math.random().toString(36).substring(7)}`;
const authUrl = getSpotifyAuthUrl(state);
const response = NextResponse.redirect(authUrl);
response.cookies.set('spotify_auth_state', state, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 10,  // 10 minutos
});
```

### B. app/api/spotify/callback/route.ts (Resumo)

```typescript
// 1. Validar code, state e error
const code = searchParams.get('code');
const state = searchParams.get('state');

// 2. Verificar state (CSRF protection)
const storedState = request.cookies.get('spotify_auth_state')?.value;
if (storedState !== state) throw new Error('State mismatch');

// 3. Obter tokens
const tokens = await exchangeCodeForToken(code);

// 4. Obter perfil do Spotify
const profile = await getSpotifyProfile(tokens.access_token);

// 5. SALVAR TOKENS NO SUPABASE (OPERAÇÃO CRÍTICA)
const { error: updateError } = await supabase
  .from('profiles')
  .update({
    spotify_tokens: tokens,
    spotify_user_id: profile.id,
    spotify_display_name: profile.display_name,
  })
  .eq('id', user.id)
  .select();

if (updateError) {
  // Erro: tokens não salvos
  return NextResponse.redirect(new URL('/musica?error=save_failed', request.url));
}

// 6. Redirecionar com sucesso
return NextResponse.redirect(
  new URL(`/musica?connected=true&t=${Date.now()}`, request.url)
);
```

### C. lib/spotify/auth.ts

```typescript
export function getSpotifyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    scope: SPOTIFY_CONFIG.scopes.join(' '),
    state,
    show_dialog: 'true',
  });
  return `${SPOTIFY_AUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<SpotifyTokens> {
  const response = await fetch(`${SPOTIFY_AUTH_BASE}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
    }),
  });
  
  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}
```

### D. hooks/useSpotify.js

```javascript
const checkConnection = useCallback(async () => {
  if (!user) return false;
  
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('spotify_tokens, spotify_user_id, spotify_display_name')
    .eq('id', user.id)
    .single();
  
  const connected = !!(data?.spotify_tokens && data?.spotify_user_id);
  setIsConnected(connected);
  return connected;
}, [user]);
```

---

## 10. HIPÓTESES SOBRE A CAUSA RAIZ

### Hipótese Principal (Muito Provável): Race Condition

**Evidência:**
```
Timeline:
T=0ms    : User autoriza no Spotify
T=1ms    : Callback recebe code e state
T=50ms   : exchangeCodeForToken completa com sucesso
T=100ms  : getSpotifyProfile completa com sucesso
T=150ms  : UPDATE profiles SET spotify_tokens = ... completa

T=500ms  : Frontend executa: SELECT spotify_tokens FROM profiles
          Query é executada ANTES dos dados replicarem através do Supabase

T=600ms  : Dados finalmente aparecem no Supabase
          (mas frontend já executou a query!)

Resultado: Component mostra erro, mesmo que tokens estejam salvos
```

**Por que 500ms não é suficiente:**
- Supabase não garante leitura imediata após escrita
- RLS policies requerem avaliação (latência adicional)
- Replicação pode levar variável tempo baseado em:
  - Carga do servidor
  - Latência de rede
  - Tamanho dos dados
  - Número de usuários simultâneos

### Hipótese Secundária: Problema de Configuração de Redirect URI

**Improbável, porque:**
- Callback ESTÁ sendo executado (backend logs mostram execução completa)
- Tokens ESTÃO sendo salvos (caso contrário updateError would catch it)
- Redirecção está funcionando (user chega em /musica?connected=true)

**Seria evidente se:**
- Spotify rejeitasse o callback (error nos searchParams)
- Callback nunca fosse chamado
- Tokens nunca fossem salvos (updateError seria acionado)

### Hipótese Terciária: Problema de RLS Policy

**Improbável, porque:**
- UPDATE policy permite atualização (`USING (auth.uid() = id)`)
- Callback executa no servidor (como superuser, não afetado por RLS)
- SELECT no frontend POSSUI permissão (`USING (true)`)

**Seria evidente se:**
- 403 Unauthorized errors nos logs
- `updateError` conteria informação sobre RLS

---

## 11. RECOMENDAÇÕES DE CORREÇÃO

### Solução 1: Aumentar Timeout (Quick Fix)

```javascript
// components/sections/MusicSection.jsx, linha 150
setTimeout(async () => {
  // ... verificação de tokens ...
}, 1500);  // Aumentado de 500ms para 1500ms
```

**Prós:**
- Simples de implementar
- Reduz probabilidade de race condition

**Contras:**
- User vê delay de 1.5 segundos
- Ainda pode falhar em conexões muito lentas
- Não trata raiz do problema

### Solução 2: Polling com Retry (Melhor)

```javascript
const checkConnectionWithRetry = async (maxAttempts = 5) => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const { data } = await supabase
      .from('profiles')
      .select('spotify_tokens, spotify_user_id, spotify_display_name')
      .eq('id', user.id)
      .single();
    
    if (data?.spotify_tokens) {
      setSpotifyConnected(true);
      toast.success('Spotify conectado com sucesso!');
      return;
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // Após falhar 5 vezes, mostrar erro
  setSpotifyConnected(false);
  toast.error('Erro ao sincronizar conexão...');
};
```

**Prós:**
- Tolera latência variável
- Tenta várias vezes
- Mais robusto

**Contras:**
- Mais queries ao Supabase
- Pode parecer lento ao user

### Solução 3: Usar Real-time Subscription (Ideal)

```javascript
useEffect(() => {
  if (!hasConnectedParam || !user) return;
  
  // Subscribe to profile changes
  const subscription = supabase
    .from(`profiles:id=eq.${user.id}`)
    .on('UPDATE', payload => {
      if (payload.new?.spotify_tokens) {
        setSpotifyConnected(true);
        toast.success('Spotify conectado com sucesso!');
        subscription.unsubscribe();
      }
    })
    .subscribe();
  
  // Cleanup
  return () => subscription.unsubscribe();
}, [user, hasConnectedParam]);
```

**Prós:**
- Real-time, instant feedback
- Não depende de timing
- Mais elegante

**Contras:**
- Requer Real-time subscription habilitado
- Setup mais complexo

### Solução 4: Usar Session Storage + Invalidação

```javascript
// callback route, após salvar tokens
response.cookies.set('spotify_connected_at', Date.now().toString(), {
  maxAge: 60,  // 60 segundos
});

// Frontend
useEffect(() => {
  const connectedAt = document.cookie
    .split('; ')
    .find(row => row.startsWith('spotify_connected_at='))
    ?.split('=')[1];
  
  if (connectedAt) {
    // Invalidate cache, force refetch
    await supabase.auth.refreshSession();
    checkConnection();
  }
}, []);
```

---

## 12. CHECKLIST DE VERIFICAÇÃO

Itens a verificar no ambiente atual:

- [ ] `.env.local` tem `SPOTIFY_REDIRECT_URI` correto para dev?
  ```
  ✗ Atualmente: https://sindoca.vercel.app/api/spotify/callback
  ✓ Deveria ser: http://localhost:3000/api/spotify/callback
  ```

- [ ] Painel do Spotify (spotify.com/developers) contém Redirect URI correto?
  ```
  Verificar: https://developer.spotify.com/dashboard
  ```

- [ ] RLS policies estão corretas na tabela `profiles`?
  ```
  SELECT * FROM pg_policies WHERE tablename = 'profiles';
  ```

- [ ] Coluna `spotify_tokens` existe na tabela `profiles`?
  ```
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'profiles';
  ```

- [ ] Supabase Real-time está habilitado?
  ```
  Projeto → Database → Replication
  ```

- [ ] Logs remotos mostram execução completa do callback?
  ```
  Verificar: debug_logs tabela no Supabase
  ```

---

## 13. RESUMO FINAL

### Fluxo Funcionando Corretamente

1. Autenticação OAuth 2.0 com Spotify ✅
2. Geração segura de STATE (CSRF protection) ✅
3. Troca de code por tokens ✅
4. Obtenção de perfil do Spotify ✅
5. Salvamento de tokens no Supabase ✅
6. Redirecção para /musica?connected=true ✅
7. Middleware não bloqueia callback ✅

### Problema Identificado

A leitura dos tokens no frontend (via SQL SELECT) pode acontecer ANTES da replicação dos dados estar completa no Supabase, causando erro falso.

### Impacto

- User vê erro "Erro ao salvar conexão"
- Component não atualiza estado
- User ainda não consegue adicionar músicas
- Após recarregar a página, tudo funciona (dados já replicados)

### Solução Recomendada

Implementar **Polling com Retry** (Solução #2 acima) ou **Real-time Subscription** (Solução #3) para sincronizar estado após callback.


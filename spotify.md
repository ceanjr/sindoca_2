# 🎵 Plano de Implementação: Integração Spotify + Sincronização Real-time

## 📋 Visão Geral

Vou avaliar a necessidade de Socket.io e propor uma arquitetura otimizada para seu projeto considerando que são apenas 2 usuários interagindo.

---

## ⚡ Socket.io: Necessário ou Não?

### ❌ **NÃO é necessário Socket.io neste projeto**

**Motivos:**

1. **Supabase Realtime já cobre tudo**: Você já usa Supabase Realtime para sincronização (fotos, mensagens, conquistas). Adicionar Socket.io seria redundante e aumentaria complexidade.

2. **Apenas 2 usuários**: Socket.io brilha em apps com centenas/milhares de conexões simultâneas. Para 2 pessoas, Supabase Realtime é mais que suficiente.

3. **Supabase é mais simples**:

   - Não precisa gerenciar servidor WebSocket separado
   - Sincronização automática com banco de dados
   - Menos código, menos bugs

4. **Você já tem a infraestrutura**: Seus hooks `useRealtimeTable`, `useRealtimeMessages` já funcionam perfeitamente.

---

## 🏗️ Arquitetura Proposta

### **Stack Tecnológico:**

- ✅ **Supabase Realtime** (sincronização em tempo real)
- ✅ **Spotify Web API** (busca e gerenciamento de playlist)
- ✅ **Next.js API Routes** (proxy seguro para Spotify)
- ❌ **Socket.io** (desnecessário)

---

## 🎯 Funcionalidades a Implementar

### 1️⃣ **Autenticação Spotify (OAuth 2.0)**

**Arquivos a criar:**

```
lib/spotify/
├── auth.ts          # Funções de autenticação OAuth
├── client.ts        # Cliente Spotify API
└── config.ts        # Configurações (client_id, redirect_uri)

app/api/spotify/
├── auth/route.ts           # Inicia OAuth flow
├── callback/route.ts       # Recebe token do Spotify
└── refresh-token/route.ts  # Renova access token
```

**Fluxo:**

1. Usuário clica "Conectar Spotify"
2. Redireciona para `spotify.com/authorize`
3. Spotify retorna para `/api/spotify/callback` com código
4. Troca código por `access_token` + `refresh_token`
5. Salva tokens na tabela `profiles` (campo `spotify_tokens`)

**Permissões necessárias (scopes):**

```
playlist-modify-public
playlist-modify-private
playlist-read-private
playlist-read-collaborative
```

---

### 2️⃣ **Busca de Músicas em Tempo Real**

**Arquivos:**

```
app/api/spotify/search/route.ts
hooks/useSpotifySearch.js
components/music/SpotifySearchModal.tsx
```

**Funcionamento:**

- Input com debounce de 300ms
- Chama `/api/spotify/search?q=nome+da+musica`
- Backend faz request para Spotify `/v1/search?type=track&limit=10`
- Retorna array com: `id`, `name`, `artist`, `album`, `image`, `preview_url`, `spotify_url`
- Renderiza cards com capa + preview player (30s)

**UI:**

```
┌─────────────────────────────────────┐
│ 🔍 Buscar música...                │
├─────────────────────────────────────┤
│ 🎵 Never Gonna Give You Up         │
│    Rick Astley • 1987              │
│    [▶️ Preview] [➕ Adicionar]      │
├─────────────────────────────────────┤
│ 🎵 Perfect                          │
│    Ed Sheeran • 2017               │
│    [▶️ Preview] [➕ Adicionar]      │
└─────────────────────────────────────┘
```

---

### 3️⃣ **Gerenciamento de Playlist**

#### **Estrutura no Banco (Supabase)**

**Nova coluna em `content`:**

```sql
-- Adicionar em content.data (JSONB)
{
  "spotify_track_id": "4uLU6hMCjMI75M1A2tKUQC",
  "spotify_url": "https://open.spotify.com/track/...",
  "preview_url": "https://p.scdn.co/mp3-preview/...",
  "duration_ms": 213000,
  "album_cover": "https://i.scdn.co/image/..."
}
```

**Nova tabela (opcional, mais organizado):**

```sql
CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  spotify_track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  album_cover TEXT,
  duration_ms INTEGER,
  spotify_url TEXT,
  preview_url TEXT,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  position INTEGER, -- ordem na playlist
  UNIQUE(workspace_id, spotify_track_id)
);
```

#### **Sincronização com Spotify**

**Arquivos:**

```
app/api/spotify/playlist/
├── create/route.ts     # Cria playlist no Spotify
├── add-track/route.ts  # Adiciona música
├── remove-track/route.ts
└── sync/route.ts       # Sincroniza (opcional)
```

**Fluxo de Adicionar Música:**

1. Usuário busca e seleciona música
2. Frontend chama seu endpoint `/api/spotify/playlist/add-track`
3. Backend:
   - ✅ Salva no Supabase (`INSERT INTO playlist_tracks`)
   - ✅ Adiciona no Spotify (`POST /v1/playlists/{id}/tracks`)
4. Supabase Realtime notifica o outro usuário
5. UI atualiza automaticamente

---

### 4️⃣ **Hook de Sincronização Real-time**

**Criar `hooks/useRealtimePlaylist.js`:**

```javascript
// Estrutura similar aos seus hooks existentes
export function useRealtimePlaylist() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load inicial
  // Subscribe to realtime changes
  // Return { tracks, loading, addTrack, removeTrack, toggleFavorite }
}
```

**Usa Supabase Realtime para:**

- ✅ Novo usuário adiciona música → Outro vê instantaneamente
- ✅ Música removida → Atualiza para ambos
- ✅ Favoritos alterados → Sincroniza em tempo real

---

### 5️⃣ **UI da Playlist (Atualizar `components/sections/MusicSection.js`)**

**Melhorias:**

```
┌──────────────────────────────────────────────┐
│ Nossa Trilha Sonora 🎵                      │
│ [🔍 Adicionar Música]  [▶️ Abrir no Spotify]│
├──────────────────────────────────────────────┤
│ 🎵 Perfect - Ed Sheeran                     │
│    Adicionado por Júnior • 2 dias atrás    │
│    [▶️] [❤️] [🗑️]                           │
├──────────────────────────────────────────────┤
│ 🎵 Thinking Out Loud - Ed Sheeran          │
│    Adicionado por Sindy • 5 dias atrás     │
│    [▶️] [❤️] [🗑️]                           │
└──────────────────────────────────────────────┘

[🎧 Ouvir Playlist Completa no Spotify]
```

**Features:**

- ✅ Preview de 30s (player inline)
- ✅ Link direto pro Spotify
- ✅ Avatar de quem adicionou
- ✅ Contador de favoritos
- ✅ Drag-and-drop para reordenar (opcional)

---

## 🔐 Segurança

### **Variáveis de Ambiente (.env.local):**

```bash
# Spotify
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback

# Supabase (já tem)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### **RLS (Row Level Security) no Supabase:**

```sql
-- Apenas membros do workspace podem ver/editar playlist
CREATE POLICY "Users can view workspace playlists"
ON playlist_tracks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = playlist_tracks.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);
```

---

## 📊 Outras Áreas que se Beneficiam de Real-time

### ✅ **Já Implementadas (manter Supabase Realtime):**

- Galeria de fotos
- Mensagens
- Conquistas

### 🆕 **Novas Funcionalidades Sugeridas:**

#### 1. **"Pensando em Você" Widget** (já tem estrutura)

- Notificação push quando o parceiro envia "pensando em você"
- Usar `useRealtimeTable` para `content` type `thinking_of_you`
- **Não precisa Socket.io**

#### 2. **Stories/Status** (como Instagram)

- Foto/texto que expira em 24h
- Supabase Realtime para notificar novo story
- **Não precisa Socket.io**

#### 3. **Indicador "Online/Offline"**

- Supabase Realtime Presence API
- Mostra quando o parceiro está ativo no site
- **Não precisa Socket.io**
- Docs: https://supabase.com/docs/guides/realtime/presence

#### 4. **Typing Indicator (mensagens)**

- "Sindy está digitando..."
- Usar Supabase Broadcast (sem persistir no banco)
- **Não precisa Socket.io**
- Docs: https://supabase.com/docs/guides/realtime/broadcast

---

## 🚀 Plano de Implementação (Ordem Sugerida)

### **Fase 1: Autenticação Spotify** (2-3h)

1. Criar rotas OAuth (`/api/spotify/auth`, `/callback`)
2. Salvar tokens no perfil
3. Botão "Conectar Spotify" na página de música
4. Refresh token automático

### **Fase 2: Busca de Músicas** (2-3h)

1. Criar `/api/spotify/search`
2. Componente `SpotifySearchModal`
3. Input com debounce + preview player
4. Testes com músicas reais

### **Fase 3: Playlist Básica** (3-4h)

1. Criar/conectar playlist no Spotify
2. Endpoint `/api/spotify/playlist/add-track`
3. Salvar no Supabase + adicionar no Spotify
4. Hook `useRealtimePlaylist`

### **Fase 4: UI Completa** (2-3h)

1. Atualizar `MusicSection.js`
2. Cards com preview player
3. Favoritos, remover, reordenar
4. Embed do player Spotify (iframe)

### **Fase 5: Polish** (1-2h)

1. Loading states
2. Error handling
3. Animações (Framer Motion)
4. Responsividade mobile

**Total estimado: 10-15 horas**

---

## 📦 Dependências Adicionais

```bash
npm install spotify-web-api-node
# OU
npm install axios  # Se preferir fazer requests manualmente
```

**Não precisa:**

- ❌ `socket.io`
- ❌ `socket.io-client`

---

## 🎯 Instruções para Claude Code

### **Checklist de Tarefas:**

#### ✅ **Spotify Integration**

- [ ] Criar `lib/spotify/auth.ts` com funções OAuth
- [ ] Criar `lib/spotify/client.ts` com wrapper da API
- [ ] Criar rotas `/api/spotify/auth`, `/callback`, `/refresh-token`
- [ ] Adicionar campo `spotify_tokens` na tabela `profiles`
- [ ] Botão "Conectar Spotify" em `MusicSection`

#### ✅ **Search & Add Tracks**

- [ ] Criar `/api/spotify/search/route.ts`
- [ ] Criar `hooks/useSpotifySearch.js` (debounce, caching)
- [ ] Criar `components/music/SpotifySearchModal.tsx`
- [ ] Preview player (HTML5 Audio API)
- [ ] Criar tabela `playlist_tracks` no Supabase (ou adaptar `content`)

#### ✅ **Realtime Sync**

- [ ] Criar `hooks/useRealtimePlaylist.js` (similar aos existentes)
- [ ] Endpoint `/api/spotify/playlist/add-track`
- [ ] Endpoint `/api/spotify/playlist/remove-track`
- [ ] RLS policies para `playlist_tracks`

#### ✅ **UI Updates**

- [ ] Refatorar `MusicSection.js` com novo design
- [ ] Cards de música com preview + ações
- [ ] Avatar de quem adicionou
- [ ] Botão "Abrir no Spotify"
- [ ] Loading states + error handling

#### ✅ **Extras (Opcional)**

- [ ] Supabase Presence API para status "Online"
- [ ] Broadcast API para "typing indicator"
- [ ] Drag-and-drop para reordenar playlist
- [ ] Embed do player Spotify (iframe)

---

## 🔍 Referências Úteis

- **Spotify Web API**: https://developer.spotify.com/documentation/web-api
- **Supabase Realtime**: https://supabase.com/docs/guides/realtime
- **OAuth 2.0 Flow**: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
- **Supabase Presence**: https://supabase.com/docs/guides/realtime/presence

---

## ✨ Resultado Final

Você terá:

- ✅ Playlist totalmente funcional e sincronizada
- ✅ Visual customizado no seu site (não parece Spotify)
- ✅ Busca instantânea de milhões de músicas
- ✅ Preview de 30s antes de adicionar
- ✅ Sincronização real-time entre os 2 usuários
- ✅ Link direto pro Spotify (pra ouvir completo)
- ✅ Sem Socket.io (mais simples, menos custo)

**Tudo usando a infraestrutura que você já tem (Supabase) + Spotify API!** 🎉

# 🎵 Spotify Integration - Setup Guide

## ✅ Implementação Concluída

A integração com o Spotify foi implementada com sucesso! Aqui estão os próximos passos para configurar:

## 📋 Configuração Necessária

### 1. Criar App no Spotify Developer Dashboard

1. Acesse: https://developer.spotify.com/dashboard
2. Clique em "Create App"
3. Preencha:
   - **App Name**: Sindoca Love Site
   - **App Description**: Playlist colaborativa para casais
   - **Redirect URI**: `http://localhost:3000/api/spotify/callback` (dev)
   - **Redirect URI**: `https://seu-dominio.com/api/spotify/callback` (prod)
4. Aceite os termos e crie o app
5. Copie o **Client ID** e **Client Secret**

### 2. Adicionar Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```bash
# Spotify API
SPOTIFY_CLIENT_ID=seu_client_id_aqui
SPOTIFY_CLIENT_SECRET=seu_client_secret_aqui
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

### 3. Atualizar Schema do Supabase

Execute no SQL Editor do Supabase:

```sql
-- Adicionar colunas para Spotify tokens na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS spotify_tokens JSONB,
ADD COLUMN IF NOT EXISTS spotify_user_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_display_name TEXT;

-- Adicionar campo data na tabela workspaces para armazenar playlist_id
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Criar índice para buscar músicas mais rápido
CREATE INDEX IF NOT EXISTS idx_content_type_workspace 
ON content(type, workspace_id);
```

### 4. Testar a Integração

1. Inicie o servidor: `npm run dev`
2. Acesse: http://localhost:3000/musica
3. Clique em "Conectar Spotify"
4. Autorize o app no Spotify
5. Após redirect, você será redirecionado de volta
6. Clique em "Adicionar Música"
7. Busque e adicione suas músicas favoritas!

## 🎯 Funcionalidades Implementadas

### ✅ Autenticação OAuth 2.0
- Login com Spotify
- Refresh automático de tokens
- Armazenamento seguro no Supabase

### ✅ Busca de Músicas
- Busca em tempo real com debounce (300ms)
- Preview de 30 segundos
- Informações completas (artista, álbum, capa, duração)

### ✅ Gerenciamento de Playlist
- Criar playlist automaticamente no Spotify
- Adicionar músicas (salva no DB + Spotify)
- Remover músicas (remove do DB + Spotify)
- Link direto para abrir no Spotify

### ✅ Sincronização Real-time
- Usa Supabase Realtime (não precisa Socket.io!)
- Quando um usuário adiciona música, o outro vê instantaneamente
- Atualização automática sem refresh

### ✅ UI/UX
- Design moderno e responsivo
- Preview player inline
- Informações de quem adicionou
- Data relativa ("2 dias atrás")
- Animações suaves (Framer Motion)

## 📁 Arquivos Criados

### Backend (API Routes)
```
app/api/spotify/
├── auth/route.ts              # Inicia OAuth flow
├── callback/route.ts          # Recebe token do Spotify
├── search/route.ts            # Busca músicas
├── refresh-token/route.ts     # Renova token
└── playlist/
    ├── add-track/route.ts     # Adiciona música
    └── remove-track/route.ts  # Remove música
```

### Library
```
lib/spotify/
├── config.ts    # Configurações (client_id, scopes)
├── auth.ts      # Funções OAuth (exchange code, refresh token)
└── client.ts    # Cliente Spotify API (search, create playlist)
```

### Frontend (React)
```
hooks/
├── useSpotify.js              # Hook para conexão Spotify
├── useSpotifySearch.js        # Hook para busca com debounce
├── useDebounce.js             # Debounce helper
└── useRealtimePlaylist.js     # Hook para playlist com realtime

components/
├── music/
│   └── SpotifySearchModal.jsx # Modal de busca
└── sections/
    └── MusicSection.jsx       # Seção de música atualizada
```

## 🔐 Segurança

✅ Client Secret nunca exposto ao frontend
✅ Tokens armazenados com segurança no Supabase
✅ Refresh automático de tokens expirados
✅ RLS (Row Level Security) no Supabase
✅ State parameter para prevenir CSRF

## 🎨 Melhorias Futuras (Opcionais)

- [ ] Drag-and-drop para reordenar playlist
- [ ] Favoritar músicas específicas (coraçãozinho)
- [ ] Criar múltiplas playlists (ex: "Românticas", "Animadas")
- [ ] Embed do Spotify Player (iframe)
- [ ] Estatísticas (músicas mais tocadas, artistas favoritos)
- [ ] Notificação push quando parceiro adiciona música
- [ ] Lyrics integration

## 🐛 Troubleshooting

### Erro: "Spotify not connected"
- Verifique se as credenciais estão corretas no `.env.local`
- Certifique-se de ter autorizado o app no Spotify
- Verifique se os tokens foram salvos no banco (tabela `profiles`)

### Erro: "Invalid redirect URI"
- Verifique se o Redirect URI no Spotify Dashboard está correto
- Deve ser exatamente: `http://localhost:3000/api/spotify/callback`

### Músicas não aparecem
- Abra o console do navegador (F12)
- Verifique se há erros na API
- Verifique se o workspace existe
- Verifique se o RLS do Supabase está configurado

### Token expira muito rápido
- Os tokens do Spotify expiram em 1 hora
- O refresh é automático - se falhar, reconecte o Spotify

## 📚 Documentação de Referência

- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Spotify OAuth 2.0](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**Pronto!** 🎉 Sua integração com Spotify está completa e funcional!

Entre em contato se tiver dúvidas ou problemas.

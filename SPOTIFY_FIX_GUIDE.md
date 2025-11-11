# 🎵 Guia de Correção - Integração Spotify

## 📋 Problemas Identificados e Soluções Aplicadas

### ✅ PROBLEMA #1: Playlist não era colaborativa
**Sintoma**: Apenas o criador conseguia adicionar músicas.

**Causa**: A playlist foi criada com `public: false` sem `collaborative: true`.

**Solução Aplicada**:
- ✅ Função `createPlaylist()` agora cria playlists com `collaborative: true`
- ✅ Nova função `updatePlaylistToCollaborative()` para atualizar playlists existentes
- ✅ Rota automática que torna playlists existentes colaborativas ao adicionar músicas

---

### ✅ PROBLEMA #2: Cliente Supabase errado nas API routes
**Sintoma**: Possíveis erros de autenticação ao buscar tokens.

**Causa**: Uso de `createClient()` do lado do cliente em rotas server-side.

**Solução Aplicada**:
- ✅ Função `getValidAccessToken()` agora aceita parâmetro `isServerSide`
- ✅ Todas as rotas de API agora passam `isServerSide=true`
- ✅ Detecta automaticamente qual cliente Supabase usar

---

### ✅ PROBLEMA #3: show_dialog sempre true
**Sintoma**: Usuário sempre via tela de autorização, mesmo já tendo autorizado.

**Solução Aplicada**:
- ✅ Removido `show_dialog: 'true'` da URL de autorização
- ✅ Melhor UX para usuários que já autorizaram

---

## 🚀 Como Aplicar as Correções

### Passo 1: Verificar se Sindy está autorizada no Spotify Dashboard

Se o app do Spotify está em **Development Mode**:

1. Acesse https://developer.spotify.com/dashboard
2. Entre no seu app do Spotify
3. Vá em "Settings" > "User Management"
4. **ADICIONE o email da Sindy** (`sindyguimaraes.a@gmail.com`) como usuário autorizado
5. Salve

**OU** coloque o app em **Production Mode** (requer revisão do Spotify).

---

### Passo 2: Tornar a playlist existente colaborativa

Você tem **2 opções**:

#### Opção A: Usar a nova rota de API (Recomendado)

Execute este comando no navegador (logado como Célio):

```javascript
fetch('/api/spotify/playlist/make-collaborative', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
```

**OU** use curl:
```bash
curl -X POST https://sindoca.vercel.app/api/spotify/playlist/make-collaborative \
  -H "Content-Type: application/json" \
  -H "Cookie: SEU_COOKIE_DE_SESSAO"
```

#### Opção B: Atualizar manualmente no Spotify

1. Abra a playlist no Spotify: https://open.spotify.com/playlist/7gBefWSIzN6ZENI0coIDkX
2. Clique em "..." > "Tornar colaborativa"
3. Compartilhe o link da playlist com Sindy
4. Sindy precisa clicar em "Seguir" na playlist

---

### Passo 3: Fazer Sindy se conectar ao Spotify

1. **Sindy** deve acessar: https://sindoca.vercel.app/musica
2. Clicar em "Conectar Spotify"
3. Autorizar o app no Spotify
4. Será redirecionada de volta para /musica

Se tudo der certo:
- ✅ Sindy verá o botão "Adicionar Música"
- ✅ Ambos poderão adicionar músicas à playlist

---

## 🔍 Verificação Pós-Correção

Execute este comando para verificar se ambos usuários têm tokens:

```sql
-- No Supabase SQL Editor
SELECT
  id,
  email,
  spotify_user_id,
  spotify_tokens IS NOT NULL as has_tokens
FROM profiles
WHERE id IN (
  '50e5a69d-8421-4fc1-a33a-8cb0d125ab50',  -- Célio
  'd92c396b-db11-45f8-a45f-47ff5152484a'   -- Sindy
);
```

**Resultado esperado**:
```
| id   | email                        | spotify_user_id | has_tokens |
|------|------------------------------|-----------------|------------|
| ...  | celiojunior0110@gmail.com    | 0ala97k...      | true       |
| ...  | sindyguimaraes.a@gmail.com   | (algum ID)      | true       |
```

---

## 🐛 Solução de Problemas

### Problema: Sindy não consegue se conectar ao Spotify

**Possíveis causas**:

1. **App em Development Mode**
   - ✅ Adicione Sindy no Spotify Dashboard (Passo 1)

2. **Cookies bloqueados**
   - ✅ Verifique se cookies estão habilitados
   - ✅ Teste em janela anônima

3. **Erro de redirect**
   - ✅ Verifique se `SPOTIFY_REDIRECT_URI` está correto: `https://sindoca.vercel.app/api/spotify/callback`
   - ✅ Verifique no Spotify Dashboard se o redirect URI está exatamente igual

### Problema: Sindy se conecta mas não consegue adicionar músicas

**Possíveis causas**:

1. **Playlist não é colaborativa**
   - ✅ Execute o Passo 2 (tornar playlist colaborativa)

2. **Cache do navegador**
   - ✅ Faça hard refresh (Ctrl+Shift+R)
   - ✅ Limpe o cache do navegador

3. **Token expirado**
   - ✅ Os tokens são automaticamente renovados
   - ✅ Se não funcionar, desconecte e reconecte no Spotify

---

## 📊 Arquitetura Atualizada

### Fluxo de Autenticação OAuth (ambos usuários)

```
1. Usuário clica "Conectar Spotify"
   ↓
2. Redireciona para /api/spotify/auth
   ↓
3. Verifica sessão Supabase ✅
   ↓
4. Gera state e salva em cookie
   ↓
5. Redireciona para Spotify OAuth
   ↓
6. Usuário autoriza no Spotify
   ↓
7. Spotify redireciona para /api/spotify/callback
   ↓
8. Verifica state (CSRF protection)
   ↓
9. Troca code por tokens
   ↓
10. Busca perfil do Spotify
   ↓
11. Salva tokens + spotify_user_id no perfil do usuário ✅
   ↓
12. Redireciona para /musica?connected=true
```

### Fluxo de Adição de Música (ambos usuários)

```
1. Usuário busca música
   ↓
2. Busca usa token do usuário logado (auto-refresh se expirado) ✅
   ↓
3. Usuário seleciona música
   ↓
4. Verifica se é a vez do usuário
   ↓
5. Obtém/cria playlist colaborativa ✅
   ↓
6. Se playlist existe mas não é colaborativa, torna colaborativa ✅
   ↓
7. Adiciona música usando token do usuário logado ✅
   ↓
8. Salva no banco de dados
   ↓
9. Alterna a vez para o parceiro
   ↓
10. Envia notificação push para o parceiro
```

---

## 🎯 Boas Práticas Implementadas

### 1. Segurança
- ✅ Verificação CSRF com state no OAuth
- ✅ Tokens armazenados com criptografia no Supabase
- ✅ Refresh automático de tokens expirados
- ✅ Validação de permissões antes de adicionar músicas

### 2. Escalabilidade
- ✅ Suporte para múltiplos usuários no mesmo workspace
- ✅ Playlist colaborativa permite acesso de ambos
- ✅ Sistema de turnos para organizar adições

### 3. Experiência do Usuário
- ✅ Mensagens de erro claras e acionáveis
- ✅ Logs detalhados para debugging
- ✅ Feedback visual do status de conexão
- ✅ Notificações quando parceiro adiciona música

### 4. Manutenibilidade
- ✅ Código bem documentado
- ✅ Separação de responsabilidades (auth, client, routes)
- ✅ Tratamento de erros em todos os pontos críticos
- ✅ Testes de fluxo completo

---

## 📝 Checklist Final

Antes de considerar o problema resolvido, verifique:

- [ ] Sindy foi adicionada no Spotify Dashboard (ou app em produção)
- [ ] Playlist existente foi tornada colaborativa
- [ ] Sindy consegue se conectar ao Spotify (aparece connected=true)
- [ ] Sindy tem `spotify_tokens` e `spotify_user_id` no banco
- [ ] Sindy consegue buscar músicas
- [ ] Sindy consegue adicionar músicas (quando for sua vez)
- [ ] Célio ainda consegue adicionar músicas
- [ ] Sistema de turnos funciona corretamente
- [ ] Notificações funcionam quando o parceiro adiciona música

---

## 🆘 Suporte Adicional

Se após seguir todos os passos o problema persistir:

1. Verifique os logs no Vercel (Console)
2. Verifique os logs no navegador (F12 > Console)
3. Verifique os logs do Remote Logger
4. Entre em contato com detalhes específicos do erro

---

**Última atualização**: 2025-01-11
**Versão do código**: v2.0 (com correções de colaboração)

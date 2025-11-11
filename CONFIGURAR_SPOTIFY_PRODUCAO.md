# 🎵 Configurar Spotify para Produção

## ❌ PROBLEMA ENCONTRADO

Analisando os logs em `/debug/`, identifiquei que:

1. ✅ Sindy clica em "Conectar Spotify"
2. ✅ Ela é redirecionada para o Spotify
3. ❌ **O callback NUNCA é executado** (não há logs de `spotify-callback`)
4. ❌ Ela volta para /musica mas o Spotify continua desconectado

### Causa:
O `SPOTIFY_REDIRECT_URI` estava configurado para **localhost** (`http://127.0.0.1:3000`), mas o site roda em **produção** (`https://sindoca.vercel.app`).

Quando Sindy autoriza no Spotify, ele tenta redirecionar para localhost (que não existe no navegador dela), então o callback nunca funciona!

## ✅ SOLUÇÃO

### PASSO 1: Atualizar .env.local (✅ JÁ FEITO)

```bash
SPOTIFY_REDIRECT_URI=https://sindoca.vercel.app/api/spotify/callback
```

### PASSO 2: Configurar no Spotify Developer Dashboard ⚠️ **VOCÊ PRECISA FAZER ISSO!**

1. **Acesse:** https://developer.spotify.com/dashboard

2. **Faça login** com sua conta Spotify

3. **Encontre seu App** (o que tem Client ID: `0a34a1a47ee54ac4bb6d98691ec73073`)

4. **Clique no App** para abrir as configurações

5. **Clique em "Edit Settings"** (botão verde)

6. **Em "Redirect URIs"**, adicione:
   ```
   https://sindoca.vercel.app/api/spotify/callback
   ```

7. **Clique em "ADD"** (botão ao lado do campo)

8. **Role até o final** e clique em **"SAVE"** (botão verde)

9. ✅ **Pronto!**

## PASSO 3: Configurar Variável de Ambiente no Vercel

1. **Acesse:** https://vercel.com/dashboard

2. **Selecione o projeto** `sindoca`

3. **Vá em:** Settings > Environment Variables

4. **Adicione ou atualize:**
   - **Name:** `SPOTIFY_REDIRECT_URI`
   - **Value:** `https://sindoca.vercel.app/api/spotify/callback`
   - **Environments:** Marque **Production**, **Preview** e **Development**

5. **Clique em "Save"**

6. **⚠️ IMPORTANTE:** Após salvar, você precisa **redeployar o site**:
   - Vá em **Deployments**
   - Clique nos 3 pontinhos do último deployment
   - Clique em **"Redeploy"**
   - Aguarde o deploy finalizar

## PASSO 4: Testar

Depois de fazer os passos acima:

1. **Limpe os logs anteriores:**
   ```bash
   rm -rf debug/
   ```

2. **Peça para a Sindy:**
   - Acessar `/musica`
   - Clicar em "Conectar Spotify"
   - **AUTORIZAR no Spotify**
   - Ela deve voltar automaticamente para `/musica`
   - Agora o botão "Conectar Spotify" deve **DESAPARECER**

3. **Verifique os logs:**
   - Acesse `/debug-logs` no site
   - Você deve ver logs de `spotify-callback` com sucesso!
   - Exemplo:
     ```
     ✅ INFO | spotify-callback | ✅ Conexão confirmada!
     Data: { hasTokens: true, spotifyUserId: "...", spotifyDisplayName: "Sindy" }
     ```

## ⚠️ IMPORTANTE: Múltiplos Ambientes

Se você desenvolver localmente, adicione AMBOS redirect URIs no Spotify:

```
http://localhost:3000/api/spotify/callback          (para desenvolvimento local)
https://sindoca.vercel.app/api/spotify/callback     (para produção)
```

E no `.env.local` local, mantenha:
```bash
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

Mas no Vercel (produção), use:
```bash
SPOTIFY_REDIRECT_URI=https://sindoca.vercel.app/api/spotify/callback
```

## 🎉 Depois que funcionar:

- A Sindy só precisa conectar UMA vez
- Os tokens ficam salvos no banco de dados
- Ela nunca mais precisará reconectar
- Ela poderá adicionar músicas à playlist compartilhada

## 🐛 Se ainda não funcionar:

1. Verifique os logs em `/debug-logs`
2. Procure por erros na categoria `spotify-callback`
3. Me mostre os logs e vou identificar o próximo problema!

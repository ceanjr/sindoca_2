# Guia de Configuração do Spotify

## 🎯 Problema Identificado

A integração do Spotify não está funcionando porque as variáveis de ambiente não estão configuradas corretamente no ambiente de produção (Vercel).

## 📋 Checklist de Configuração

### 1. Spotify Developer Dashboard

Acesse: https://developer.spotify.com/dashboard

1. **Encontre seu App** (ou crie um novo se necessário)
2. **Vá em "Settings"**
3. **Na seção "Redirect URIs", adicione AMBAS as URLs:**
   - `http://localhost:3000/api/spotify/callback` (para desenvolvimento)
   - `https://sindoca.vercel.app/api/spotify/callback` (para produção)
4. **Clique em "Save"**

### 2. Configuração Local (.env.local)

Seu arquivo `.env.local` já está correto:

```bash
SPOTIFY_CLIENT_ID=0a34a1a47ee54ac4bb6d98691ec73073
SPOTIFY_CLIENT_SECRET=7a72930dbcdd40879cd76128152229c2
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

✅ Isso funciona para **desenvolvimento local**

### 3. Configuração no Vercel (CRÍTICO!)

**IMPORTANTE:** O arquivo `.env.production` não é usado automaticamente pelo Vercel. Você precisa configurar as variáveis de ambiente manualmente no painel do Vercel.

#### Passo a Passo:

1. **Acesse o Vercel Dashboard:**
   - https://vercel.com/ceanbrjr/sindoca (ou equivalente)

2. **Vá em "Settings" → "Environment Variables"**

3. **Adicione as seguintes variáveis:**

   | Nome | Valor | Ambiente |
   |------|-------|----------|
   | `SPOTIFY_CLIENT_ID` | `0a34a1a47ee54ac4bb6d98691ec73073` | Production, Preview |
   | `SPOTIFY_CLIENT_SECRET` | `7a72930dbcdd40879cd76128152229c2` | Production, Preview |
   | `SPOTIFY_REDIRECT_URI` | `https://sindoca.vercel.app/api/spotify/callback` | Production, Preview |

4. **Clique em "Save"**

5. **IMPORTANTE: Faça um redeploy do projeto**
   - Vá em "Deployments"
   - No último deployment, clique nos três pontos (...)
   - Clique em "Redeploy"
   - Marque "Use existing Build Cache" se quiser mais rápido
   - Clique em "Redeploy"

## 🔍 Como Testar

### Desenvolvimento (localhost:3000)

1. Execute `npm run dev`
2. Acesse http://localhost:3000/diagnostico-spotify
3. Veja se aparece "🏠 Localhost"
4. Clique em "Conectar Spotify"
5. Autorize no Spotify
6. Deve redirecionar de volta com sucesso

### Produção (sindoca.vercel.app)

1. Acesse https://sindoca.vercel.app/diagnostico-spotify
2. Veja se aparece "🌍 Produção"
3. Verifique se a "Redirect URI Esperada" é `https://sindoca.vercel.app/api/spotify/callback`
4. Clique em "Conectar Spotify"
5. Autorize no Spotify
6. Deve redirecionar de volta com sucesso

## 🚨 Erros Comuns

### 1. "redirect_uri_mismatch"

**Sintoma:** Ao clicar em "Conectar Spotify", aparece um erro no Spotify dizendo que a URL de redirecionamento não é válida.

**Causa:** A URL no Spotify Developer Dashboard não corresponde à URL configurada na variável `SPOTIFY_REDIRECT_URI`.

**Solução:** Verifique que você adicionou EXATAMENTE a mesma URL em ambos os lugares:
- Spotify Dashboard → Settings → Redirect URIs
- Vercel → Settings → Environment Variables → `SPOTIFY_REDIRECT_URI`

### 2. Conexão funciona em localhost mas não em produção

**Sintoma:** Funciona perfeitamente no localhost, mas na produção do Vercel não funciona.

**Causa:** As variáveis de ambiente não estão configuradas no Vercel.

**Solução:** Siga o passo 3 acima ("Configuração no Vercel") e faça um redeploy.

### 3. "state_mismatch"

**Sintoma:** Após autorizar no Spotify, volta para /musica?error=state_mismatch

**Causa:** Cookie de state não está sendo preservado (raro, geralmente problema de navegador).

**Solução:**
- Limpe os cookies do site
- Tente em modo anônimo
- Verifique se o navegador aceita cookies de terceiros

### 4. Conexão lenta / "Loading infinito"

**Sintoma:** Após autorizar, fica mostrando "Carregando..." indefinidamente.

**Causa:** Race condition no polling (já está implementado com retry, mas pode ainda falhar em conexões lentas).

**Solução:**
- Aguarde até 5 segundos
- Se continuar travado, recarregue a página
- A conexão deve estar salva mesmo se não aparecer imediatamente

## 📊 Página de Diagnóstico

Use a página de diagnóstico para identificar problemas:

**URL:** `/diagnostico-spotify`

Esta página mostra:
- ✅ Ambiente atual (localhost vs produção)
- ✅ Status de autenticação
- ✅ Status da conexão Spotify
- ✅ Redirect URI esperada
- ✅ Recomendações específicas

## 🔐 Segurança

**IMPORTANTE:** Nunca commite o `.env.local` no Git!

O arquivo `.env.local` está no `.gitignore` e nunca deve ser commitado porque contém suas credenciais secretas (`SPOTIFY_CLIENT_SECRET`).

Para produção, sempre configure as variáveis diretamente no Vercel Dashboard.

## 📝 Checklist Final

Antes de testar, confirme:

- [ ] Redirect URIs adicionadas no Spotify Developer Dashboard
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Redeploy feito após configurar variáveis
- [ ] Página de diagnóstico mostra ambiente correto
- [ ] Tentou conectar e funcionou

## 🆘 Ainda não funciona?

Se após seguir todos os passos ainda não funcionar:

1. Acesse `/diagnostico-spotify` e tire uma screenshot
2. Abra o Console do navegador (F12 → Console)
3. Tente conectar o Spotify
4. Copie qualquer erro que aparecer no console
5. Abra uma issue com:
   - Screenshot do diagnóstico
   - Erros do console
   - Ambiente (localhost ou produção)

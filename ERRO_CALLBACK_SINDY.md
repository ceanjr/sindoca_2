# 🔴 Erro: callback_failed - Sindy

## 📊 O Que Aconteceu

Sindy tentou conectar ao Spotify e recebeu: **"Erro ao conectar Spotify: callback_failed"**

Isso significa que algo falhou no processo de callback do OAuth.

---

## 🎯 CAUSA MAIS PROVÁVEL

### ❌ **Sindy NÃO está na lista de usuários autorizados no Spotify Dashboard**

Se o app do Spotify está em **Development Mode**, apenas usuários explicitamente autorizados podem se conectar.

---

## ✅ SOLUÇÃO IMEDIATA

### **Passo 1: Adicionar Sindy no Spotify Dashboard**

1. Acesse: https://developer.spotify.com/dashboard
2. Faça login com sua conta do Spotify
3. Clique no seu app do Spotify
4. Vá em **"Settings"** (configurações)
5. Role até **"User Management"**
6. Clique em **"Add User"**
7. Digite o email da Sindy: `sindyguimaraes.a@gmail.com`
8. Clique em **"Add"** ou **"Save"**
9. **Salve as alterações**

### **Passo 2: Sindy Tentar Novamente**

1. Sindy acessa: https://sindoca.vercel.app/musica
2. Clica em **"Conectar Spotify"** novamente
3. **DEVE FUNCIONAR AGORA!** ✅

---

## 🔍 Outras Possíveis Causas (se ainda falhar)

### Causa #2: State Mismatch (Cookies)

**Solução**:
1. Sindy limpa os cookies do navegador
2. Faz logout e login novamente no Sindoca
3. Tenta conectar ao Spotify novamente

### Causa #3: Sessão Expirada

**Solução**:
1. Sindy faz logout do Sindoca
2. Faz login novamente
3. Tenta conectar ao Spotify

### Causa #4: Problemas de Rede/Proxy

**Solução**:
1. Tentar em outro navegador (Chrome, Firefox)
2. Tentar em modo anônimo/privado
3. Verificar se não há bloqueios de firewall

---

## 📊 Como Verificar os Logs (Para Você)

### No Vercel:

1. Acesse: https://vercel.com/dashboard
2. Vá no seu projeto (sindoca)
3. Clique em **"Logs"** ou **"Functions"**
4. Filtre por: `spotify-callback`
5. Procure por logs do horário em que Sindy tentou conectar (18:24)

**O que procurar**:
- ❌ Erros vermelhos
- "State mismatch"
- "Erro ao salvar tokens"
- Qualquer mensagem de erro específica

### Logs Esperados (Sucesso):

```
🚀 Callback iniciado
✅ Usuário autenticado
Trocando code por tokens...
✅ Tokens obtidos
Buscando perfil do Spotify...
✅ Perfil obtido
Salvando no banco de dados...
✅ Dados salvos com sucesso!
🎉 Sucesso! Redirecionando para /musica
```

### Logs com Erro (Falha):

```
🚀 Callback iniciado
✅ Usuário autenticado
Trocando code por tokens...
❌ ERRO: [mensagem específica aqui]
💥 Erro crítico no callback
```

---

## 🧪 Teste Alternativo

Se após adicionar Sindy no Dashboard ainda falhar, tente:

### **Teste com outra conta Google**

1. Crie uma conta teste no Gmail
2. Adicione essa conta no Spotify Dashboard
3. Use essa conta para criar usuário no Sindoca
4. Tente conectar ao Spotify com essa conta
5. Se funcionar: O problema é específico da conta da Sindy
6. Se não funcionar: O problema é na configuração geral

---

## 🎯 Checklist de Verificação

Execute esta checklist:

- [ ] **Sindy está no Spotify Dashboard?**
  - Acesse: https://developer.spotify.com/dashboard
  - Settings > User Management
  - Verificar se `sindyguimaraes.a@gmail.com` está na lista

- [ ] **Spotify Redirect URI está correto?**
  - Deve ser: `https://sindoca.vercel.app/api/spotify/callback`
  - Exatamente esse, sem barra no final

- [ ] **Variáveis de ambiente estão corretas?**
  - SPOTIFY_CLIENT_ID
  - SPOTIFY_CLIENT_SECRET
  - SPOTIFY_REDIRECT_URI

- [ ] **Sindy tentou com sessão limpa?**
  - Logout do Sindoca
  - Limpar cookies
  - Login novamente
  - Tentar conectar

---

## 📱 Se o Erro Persistir

Se após **adicionar Sindy no Dashboard** e **limpar cookies** ainda der erro:

### Execute este diagnóstico:

1. **Sindy** acessa: https://sindoca.vercel.app/spotify-diagnostico
2. Clica em **"🔍 Inspecionar Rota"**
3. Tira print do resultado
4. Clica em **"Tentar Conectar Agora"**
5. Quando der erro, vai para: `/musica?error=callback_failed`
6. Tira print da URL completa
7. Envia prints + horário exato do erro

Com essas informações, posso verificar os logs do Vercel e identificar o erro específico.

---

## 🚀 Próximo Passo

1. **AGORA**: Adicione `sindyguimaraes.a@gmail.com` no Spotify Dashboard
2. **DEPOIS**: Sindy tenta conectar novamente
3. **SE FUNCIONAR**: ✅ Pronto! Sistema completo!
4. **SE NÃO FUNCIONAR**: Veja os logs do Vercel e me envie

---

## 💡 Dica Extra

Se você quer evitar esse problema no futuro:

**Coloque o app em Production Mode** no Spotify:
- Qualquer pessoa pode se conectar (não precisa estar na lista)
- Requer aprovação do Spotify (pode levar alguns dias)
- Vale a pena se mais pessoas vão usar

**OU**

**Mantenha em Development Mode** mas:
- Adicione todos os usuários manualmente
- Limite de 25 usuários
- Mais controle sobre quem acessa

---

**Execute o Passo 1 (adicionar Sindy no Dashboard) e teste novamente!** 🚀

**Data**: 2025-01-11
**Status**: 🔴 Aguardando adicionar Sindy no Spotify Dashboard

# 🔍 Guia de Diagnóstico - Sindy

## 🎯 Objetivo
Identificar por que Sindy não consegue se conectar ao Spotify.

---

## 📋 PASSO 1: Verificar Autenticação no Sindoca

1. **Sindy**, acesse: https://sindoca.vercel.app/spotify-diagnostico

2. Você deve ver uma página com informações detalhadas

3. **TIRE UM PRINT** da página inteira e envie para Célio

4. Procure especialmente por:
   - ✅ ou ❌ em "1. Autenticação Sindoca"
   - ✅ ou ❌ em "2. Perfil Spotify"

**Resultado esperado**:
- ✅ Autenticação Sindoca deve estar **verde**
- ❌ Perfil Spotify deve estar **vermelho** (esperado, pois você não conectou ainda)

**Se Autenticação Sindoca estiver ❌ vermelha**:
- Significa que você não está logada no Sindoca
- Faça logout e login novamente
- Volte ao Passo 1

---

## 📋 PASSO 2: Testar Rota de Autenticação

Ainda na página de diagnóstico:

1. Abra o **Console do Navegador** (pressione F12)

2. Clique em "Console" na barra superior

3. Na página de diagnóstico, clique no botão: **"Testar Rota Auth"**

4. Aguarde alguns segundos

5. **TIRE UM PRINT** do console mostrando as mensagens que aparecem

6. **TIRE UM PRINT** da mensagem que aparece na página

**Resultados possíveis**:

### ✅ Se aparecer: "Rota /api/spotify/auth está funcionando e tentando redirecionar!"
- Significa que a rota está funcionando
- O problema pode estar no Spotify Dashboard
- Vá para o **PASSO 3**

### ❌ Se aparecer: "Você não está autenticado no Sindoca"
- Faça logout e login novamente
- Volte ao **PASSO 1**

### ⚠️ Se aparecer: "Resposta inesperada" ou "Erro ao testar rota"
- **TIRE PRINT** do erro completo
- Envie para Célio
- Pode ser um problema de configuração

---

## 📋 PASSO 3: Verificar Console Durante Tentativa Real

1. Mantenha o **Console aberto** (F12 > Console)

2. Na página de diagnóstico, clique em: **"Tentar Conectar Agora"**

3. Observe atentamente o que acontece:

### Cenário A: Você é redirecionada para o Spotify
- ✅ **BOM!** Significa que a rota funciona
- Autorize o app no Spotify
- Será redirecionada de volta para /musica
- Volte ao **PASSO 4**

### Cenário B: A página recarrega mas nada acontece
- ❌ **PROBLEMA!** Algo está bloqueando
- **TIRE PRINT** do console mostrando erros
- Procure por mensagens em vermelho
- Envie para Célio

### Cenário C: Aparece uma mensagem de erro
- ❌ **PROBLEMA!**
- **TIRE PRINT** da mensagem
- **TIRE PRINT** do console
- Envie para Célio

---

## 📋 PASSO 4: Verificar Conexão Bem-Sucedida

1. Após autorizar no Spotify, você deve ser redirecionada para: `/musica?connected=true`

2. Acesse novamente: https://sindoca.vercel.app/spotify-diagnostico

3. Clique em **"Atualizar"**

4. **TIRE PRINT** da página atualizada

**Resultado esperado**:
- ✅ "2. Perfil Spotify" deve estar **VERDE**
- ✅ "Tem Tokens: ✅ Sim"
- ✅ "Tem Spotify User ID: ✅ Sim"
- ✅ Deve aparecer seu "Nome no Spotify"

**Se ainda estiver ❌ vermelho**:
- O callback falhou
- Vá para o **PASSO 5**

---

## 📋 PASSO 5: Verificar Logs do Callback

Se você chegou até aqui, significa que:
- ✅ Você conseguiu autorizar no Spotify
- ❌ Mas o callback falhou ao salvar os dados

**Para Célio verificar**:

1. Acesse os logs do Vercel: https://vercel.com/ceanbrjr/sindoca/logs

2. Filtre por: `spotify-callback`

3. Procure por logs quando Sindy tentou se conectar

4. Procure especialmente por:
   - ❌ Erros vermelhos
   - "Erro ao salvar tokens"
   - "State mismatch"
   - Qualquer mensagem de erro

---

## 🔍 Informações Extras para Debug

### Verificar Cookies

No console (F12), execute:
```javascript
document.cookie
```

**TIRE PRINT** do resultado.

### Verificar Sessão Supabase

No console, execute:
```javascript
// Verificar se há uma sessão ativa
fetch('/api/spotify/debug-user')
  .then(r => r.json())
  .then(d => console.log('DEBUG:', d))
```

**TIRE PRINT** do resultado.

---

## 🚨 Checklist de Problemas Comuns

### Problema: "Você não está autenticado"
**Solução**:
1. Faça logout do Sindoca
2. Limpe os cookies do navegador
3. Faça login novamente
4. Tente conectar ao Spotify

### Problema: Nada acontece ao clicar "Conectar Spotify"
**Possíveis causas**:
1. **JavaScript está bloqueado**: Verifique extensões do navegador
2. **Cookies estão bloqueados**: Habilite cookies para sindoca.vercel.app
3. **Pop-ups bloqueados**: Habilite pop-ups para o site
4. **Extensão bloqueando**: Tente em modo anônimo

### Problema: "State mismatch" no callback
**Solução**:
1. Limpe os cookies do navegador
2. Tente novamente em janela anônima
3. Verifique se o relógio do computador está correto

### Problema: É redirecionada mas volta com erro
**Possíveis causas**:
1. **App em Development Mode**: Célio precisa adicionar seu email no Spotify Dashboard
2. **Redirect URI errado**: Verificar configuração no Spotify
3. **Client ID/Secret errados**: Verificar variáveis de ambiente

---

## 📸 Prints Necessários

Para diagnóstico completo, tire prints de:

1. ✅ Página `/spotify-diagnostico` completa
2. ✅ Console (F12) durante "Testar Rota Auth"
3. ✅ Console durante "Tentar Conectar Agora"
4. ✅ Qualquer mensagem de erro que apareça
5. ✅ Página `/spotify-diagnostico` após tentar conectar

Envie todos os prints para Célio via WhatsApp ou Telegram.

---

## 🆘 Próximos Passos

Baseado nos prints e informações coletadas, Célio poderá:

1. **Identificar o erro exato**
2. **Verificar logs do servidor**
3. **Corrigir a configuração se necessário**
4. **Adicionar você no Spotify Dashboard se for o caso**

---

**Última atualização**: 2025-01-11
**Versão**: 1.0

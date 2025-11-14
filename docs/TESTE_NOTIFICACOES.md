# Guia de Teste: Notificações Push entre Usuários

## 📱 Problema Atual

1. ✅ Notificação local ("Testar Notificação Real") funciona
2. ❌ Notificação enviada de um usuário para outro não chega
3. ⚠️ Notificações aparecem como "do Chrome" no Android PWA

## 🔧 Correções Implementadas

### 1. Logs de Debug Aprimorados

#### Frontend (DebugPushSendTab.jsx)
- Logs com emojis para facilitar identificação
- Mostra detalhes da requisição e resposta
- Exibe quantidade de subscriptions alcançadas

#### Backend (API /api/push/send)
- Logs detalhados de cada etapa do envio
- Mostra endpoints das subscriptions (parcial por segurança)
- Exibe status code de cada tentativa de envio
- Identifica subscriptions inválidas

#### Service Worker (sw.js v9)
- Logs visuais para Android PWA
- Mensagens enviadas para o MobileLogsViewer
- Badge adicionado para melhorar aparência no Android

### 2. Melhorias no Service Worker

- **Versão atualizada para v9**
- **Badge configurado**: `/icon-96x96.png` (melhora aparência no Android)
- **Vibração padrão**: `[200, 100, 200]`
- **Silent false**: Garante que não seja silenciosa
- **Tag específica**: `sindoca-notification` para identificação
- **Logs para clientes**: Sistema de mensagens para MobileLogsViewer

### 3. Sistema de Logs Visuais (MobileLogsViewer)

- Captura logs do Service Worker automaticamente
- Permite copiar logs para compartilhar via WhatsApp/Telegram
- Filtros por nível (info, warn, error) e categoria
- Auto-refresh a cada 2 segundos

## 🧪 Como Testar (Passo a Passo)

### Preparação

1. **Dispositivo 1 (Remetente)**: Abrir o app no navegador
2. **Dispositivo 2 (Destinatário)**: Abrir o app PWA instalado no Android

### Passo 1: Verificar Subscriptions

**No Dispositivo 2 (Destinatário):**

1. Abrir o menu de debug (⚙️)
2. Ir em "Push Notifications"
3. Verificar se há subscription ativa:
   - ✅ "Push ativo" = Tudo OK
   - ❌ "Sem push ativo" = Clicar em "Ativar Push"

### Passo 2: Preparar Logs

**No Dispositivo 2 (Destinatário):**

1. No menu debug, rolar até "📱 Logs do App"
2. Deixar esta seção visível
3. Ativar "Auto-refresh" (checkbox)
4. Clicar em "🗑️ Limpar logs" para começar do zero

### Passo 3: Enviar Notificação

**No Dispositivo 1 (Remetente):**

1. Abrir o menu de debug
2. Ir na aba "📤 Enviar Push"
3. Selecionar o destinatário
4. Personalizar a mensagem (opcional)
5. Clicar em "🚀 Enviar Notificação"
6. Observar a resposta do toast

### Passo 4: Verificar Logs no Destinatário

**No Dispositivo 2 (Destinatário):**

Aguardar 10-15 segundos e procurar pelos seguintes logs:

#### ✅ Cenário de Sucesso

```
[PUSH] 🔔 Push notification received
[PUSH] Service Worker state: active
[PUSH] 📦 Push data parsed
[PUSH] 📢 Preparing to show notification
[PUSH] ✅ Notification displayed successfully
```

**Se você viu esses logs MAS não recebeu a notificação:**
- Problema é do sistema Android (modo silencioso, economia de bateria, etc)
- A notificação foi exibida pelo SW mas bloqueada pelo sistema

#### ❌ Cenário de Falha

**Nenhum log aparece:**
- Service Worker não está recebendo o push
- Subscription pode estar inválida
- Verifique se o push foi realmente enviado (logs do servidor)

**Apenas logs de erro aparecem:**
- Copiar os logs e enviar para análise

### Passo 5: Verificar Logs do Servidor

**Abrir o terminal do servidor (npm run dev) e procurar:**

```bash
📤 [Push API] Sending notification:
🔍 [Push API] Found subscriptions: 1
📋 [Push API] Subscription endpoints:
🚀 [Push API] Sending to 1 subscription(s)...
📨 [Push API] Sending to subscription 1/1
✅ [Push API] Successfully sent to subscription 1
📊 [Push API] Results: { successful: 1, failed: 0, total: 1 }
```

#### Problemas Comuns nos Logs do Servidor

**"Found subscriptions: 0"**
- Destinatário não tem subscription ativa
- Pedir para reativar push no dispositivo

**"❌ Error sending to subscription"**
- Subscription inválida ou expirada
- Verificar statusCode do erro:
  - `410` = Subscription expirou
  - `404` = Subscription não encontrada
  - Outros = Ver mensagem de erro específica

## 🐛 Debug Avançado

### Verificar VAPID Keys

```bash
# No terminal do servidor
echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY
```

Se não aparecer nada:
1. Gerar novas keys: `npx web-push generate-vapid-keys`
2. Adicionar no `.env.local`
3. Reiniciar o servidor

### Verificar Service Worker

**No Chrome (Desktop):**
1. Abrir DevTools (F12)
2. Application > Service Workers
3. Verificar se há SW ativo

**No Android Chrome (PWA):**
1. Abrir `chrome://inspect` no desktop
2. Conectar o Android via USB
3. Inspecionar o PWA remoto

### Testar Push Manualmente (curl)

```bash
# Obter subscription do banco de dados
# Depois testar com web-push:

npx web-push send-notification \
  --endpoint="<ENDPOINT>" \
  --key="<P256DH>" \
  --auth="<AUTH>" \
  --vapid-subject="mailto:seu@email.com" \
  --vapid-pubkey="<VAPID_PUBLIC>" \
  --vapid-pvtkey="<VAPID_PRIVATE>" \
  --payload='{"title":"Teste Manual","body":"Se receber isso, o problema não é no web-push"}'
```

## 📝 Checklist de Diagnóstico

- [ ] Service Worker v9 está instalado (verificar console: `[SW] Service Worker v9 activated`)
- [ ] Permissão de notificação está "granted"
- [ ] Há subscription ativa no banco (tabela `push_subscriptions`)
- [ ] VAPID keys estão configuradas no `.env.local`
- [ ] API `/api/push/send` retorna `success: true`
- [ ] Logs do servidor mostram "Successfully sent"
- [ ] Logs do SW mostram "Push notification received"
- [ ] Logs do SW mostram "Notification displayed successfully"

## 🎯 Próximos Passos

1. **Testar com dois dispositivos diferentes**
2. **Copiar logs do MobileLogsViewer** (botão copiar)
3. **Compartilhar logs do servidor** (do terminal)
4. **Compartilhar screenshot do toast de sucesso/erro**

Com essas informações, será possível identificar exatamente onde está o problema!

## 📱 Sobre a Aparência das Notificações

### Antes (v8)
- ❌ Notificações apareciam como "do Chrome"
- ❌ Sem badge customizado

### Depois (v9)
- ✅ Badge do Sindoca (`/icon-96x96.png`)
- ✅ Título customizado aparece primeiro
- ⚠️ Alguns Androids ainda podem mostrar "via [app name]" - isso é comportamento do sistema

### Limitações do Android

O Android pode sobrescrever alguns aspectos da notificação:
- **Nome do app**: Pode aparecer como "Chrome" se o PWA não estiver totalmente instalado
- **Badge**: Alguns launchers ignoram badges customizados
- **Ícone**: Deve ser transparente com foreground branco para melhor resultado

Para melhor experiência:
1. Instalar o PWA via "Adicionar à tela inicial"
2. Abrir sempre pelo ícone da home screen (não pelo Chrome)
3. Nunca abrir a mesma URL no navegador e no PWA simultaneamente

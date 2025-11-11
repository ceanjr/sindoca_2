# 🔴 Problema Identificado: 3 Usuários no Workspace

## 🎯 Causa Raiz

Seu workspace tem **3 usuários**, mas o código foi desenvolvido para **2 usuários (casal)**:

```
Workspace: 99c966b1-98b9-4905-8d0d-80e357336114
├── Célio Júnior (50e5a69d-8421-4fc1-a33a-8cb0d125ab50)
├── ceanbrjr (b726a059-f7b3-4825-8e29-e4a4f93aae39) ← EXTRA
└── Sindy (d92c396b-db11-45f8-a45f-47ff5152484a)
```

### Por que isso causava o problema?

O código antigo fazia:
```javascript
const partner = members.find(m => m.user_id !== user.id);
```

Isso retornava **apenas o primeiro** usuário diferente do atual, causando:
- Notificações indo para a pessoa errada
- Nem todos os membros recebendo notificações
- Comportamento inconsistente

---

## ✅ Soluções Aplicadas

### 1. Modificado `lib/push/sendToPartner.ts`

**ANTES** (enviava para 1 parceiro):
```typescript
const partner = members.find(m => m.user_id !== userId);
// Enviava apenas para partner.user_id
```

**DEPOIS** (envia para todos os parceiros):
```typescript
const partners = members.filter(m => m.user_id !== userId);
// Envia para todos os partners em paralelo
```

### 2. Modificado `hooks/useSupabasePhotos.jsx`

**ANTES** (armazenava 1 partnerId):
```javascript
const partner = allMembers?.find(m => m.user_id !== user.id);
partnerIdRef.current = partner.user_id;
```

**DEPOIS** (armazena array de partnerIds):
```javascript
const partners = allMembers?.filter(m => m.user_id !== user.id) || [];
partnerIdRef.current = partners.map(p => p.user_id);
// Envia para todos em paralelo
```

---

## 🚀 Como Testar Agora

### Opção 1: Teste Manual via Script

```bash
# Instalar dependência se necessário
npm install node-fetch

# Testar envio para Célio
node test-push-notification.js 1

# Testar envio para Sindy
node test-push-notification.js 2

# Testar envio para ceanbrjr
node test-push-notification.js 3

# Testar envio para TODOS
node test-push-notification.js 4
```

O script mostrará:
- ✅ Se a notificação foi enviada com sucesso
- 📊 Quantas subscriptions foram encontradas
- ❌ Erros se houver

### Opção 2: Teste Real no App

1. **Abra 2 navegadores/dispositivos** com usuários diferentes
2. **Faça login** em ambos
3. **Permita notificações** quando solicitado
4. **Adicione uma música** ou **faça upload de foto**
5. **Verifique se TODOS os outros membros recebem** a notificação

---

## 🔍 Diagnóstico se Ainda Não Funcionar

### Checklist Completo

#### 1. Verificar Permissões

Abra o console do navegador e execute:
```javascript
Notification.permission
```

Deve retornar: `"granted"`

Se retornar `"denied"` ou `"default"`:
- Chrome: chrome://settings/content/notifications
- Firefox: about:preferences#privacy
- Edge: edge://settings/content/notifications

#### 2. Verificar Service Worker

DevTools > Application > Service Workers

Deve mostrar:
- Status: **activated and is running**
- URL: `https://sindoca.vercel.app/sw.js`

Se não estiver ativo:
```javascript
// No console do navegador
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registrations:', registrations);
});
```

#### 3. Verificar Subscription no Banco

Execute no Supabase SQL Editor:
```sql
-- Ver subscriptions de todos os usuários
SELECT
  ps.id,
  p.full_name,
  ps.endpoint,
  ps.created_at,
  ps.updated_at
FROM push_subscriptions ps
JOIN profiles p ON p.id = ps.user_id
ORDER BY ps.updated_at DESC;
```

Deve mostrar:
- ✅ Subscription para cada usuário logado
- ✅ `updated_at` recente (indica que está ativa)

#### 4. Verificar Console do Navegador

**Ao fazer login**, deve aparecer:
```
[Push] Found existing subscription
ou
[Push] Permission granted but no subscription found - creating one...
```

**Ao enviar ação (música/foto)**, deve aparecer:
```
[Push] Sending to N partner(s)
✅ Push notifications sent to N partner(s)
```

**Ao receber notificação**, deve aparecer:
```
[Push] Push notification received
```

#### 5. Verificar Logs do Servidor

Se estiver em desenvolvimento local, o terminal deve mostrar:
```
[Push] Sending notification: {...}
[Push] Found subscriptions: 2
[Push] Results: { successful: 2, failed: 0 }
```

#### 6. Testar API Diretamente

Execute no terminal:
```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: $INTERNAL_API_SECRET" \
  -d '{
    "recipientUserId": "d92c396b-db11-45f8-a45f-47ff5152484a",
    "title": "Teste Manual",
    "body": "Esta é uma notificação de teste",
    "icon": "/icon-192x192.png"
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1
}
```

---

## 🔧 Problemas Comuns e Soluções

### Problema 1: "No subscriptions found for user"

**Causa**: Usuário não tem subscription ativa no banco

**Solução**:
1. Fazer logout e login novamente
2. Recarregar a página
3. Permitir notificações quando solicitado
4. Verificar se Service Worker foi registrado

### Problema 2: Erro 410 ou 404 ao enviar

**Causa**: Subscription expirada ou inválida

**Solução**:
O sistema já remove automaticamente. Usuário deve:
1. Recarregar página
2. Permitir notificações novamente

### Problema 3: Notificação não aparece mesmo após envio bem-sucedido

**Possíveis causas**:

1. **Notificações silenciadas no sistema operacional**
   - Windows: Verificar Central de Ações
   - macOS: Verificar Central de Notificações
   - Android: Verificar Configurações > Notificações

2. **Modo Não Perturbe ativado**
   - Desativar temporariamente para testar

3. **Service Worker não escutando**
   - Recarregar página
   - Verificar se `/sw.js` está carregado

4. **VAPID keys inválidas**
   - Verificar se as keys em `.env.local` estão corretas
   - Regenerar se necessário:
     ```bash
     npx web-push generate-vapid-keys
     ```

### Problema 4: Subscription duplicadas

Execute no Supabase para limpar:
```sql
-- Remover duplicatas (mantém a mais recente)
DELETE FROM push_subscriptions
WHERE id NOT IN (
  SELECT MAX(id)
  FROM push_subscriptions
  GROUP BY user_id, endpoint
);
```

---

## 🎯 Próximos Passos Recomendados

### 1. Remover Usuário Extra (Se for apenas teste)

Se o usuário `ceanbrjr` foi apenas para teste, execute no Supabase:

```sql
DELETE FROM workspace_members
WHERE user_id = 'b726a059-f7b3-4825-8e29-e4a4f93aae39'
AND workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114';
```

Benefícios:
- Menos confusão
- Comportamento mais previsível
- Menos notificações sendo enviadas

### 2. Configurar URL em Produção

Adicione no Vercel:
```env
NEXT_PUBLIC_SITE_URL=https://sindoca.vercel.app
```

### 3. Limpar Subscriptions Antigas

```sql
-- Remover subscriptions não atualizadas há mais de 30 dias
DELETE FROM push_subscriptions
WHERE updated_at < NOW() - INTERVAL '30 days';
```

### 4. Adicionar Monitoramento

Criar tabela para logs:
```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  type TEXT,
  success BOOLEAN,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 Resumo das Mudanças

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `lib/push/sendToPartner.ts` | ✅ Modificado | Envia para todos os parceiros |
| `hooks/useSupabasePhotos.jsx` | ✅ Modificado | Suporta múltiplos parceiros |
| `test-push-notification.js` | ✅ Criado | Script de teste manual |
| `remove_extra_user.sql` | ✅ Criado | SQL para remover usuário extra |
| `SOLUCAO_PUSH_PROBLEMA.md` | ✅ Criado | Este documento |

---

## ✅ Validação Final

Execute este checklist:

- [ ] Código modificado está salvo
- [ ] Servidor Next.js foi reiniciado (se local)
- [ ] Service Worker foi atualizado (recarregar página com Ctrl+F5)
- [ ] Ambos usuários fizeram logout/login
- [ ] Ambos usuários permitiram notificações
- [ ] Script de teste executado com sucesso
- [ ] Notificações chegam em todos os dispositivos
- [ ] Console não mostra erros

---

**Status**: ✅ Correção completa aplicada
**Data**: 2025-11-11
**Resultado esperado**: Notificações funcionando para todos os membros do workspace

# Push Notifications - Melhorias Avançadas

**Data:** 13/11/2025
**Status:** ✅ Implementado
**Versão:** 2.0

---

## 📋 Resumo das Melhorias

Este documento descreve 4 grandes melhorias implementadas no sistema de push notifications:

1. ✅ **Limpeza Automática de Subscriptions Expiradas**
2. ✅ **Notificação quando Subscription Expira** (via botão de reativação)
3. ✅ **Botão "Reativar Notificações"** quando detectar divergência
4. ✅ **Analytics de Entrega de Notificações**

---

## 1️⃣ Limpeza Automática de Subscriptions Expiradas

### Problema
Subscriptions de push podem expirar ou se tornar inválidas quando:
- Usuário desinstala o app
- Usuário limpa dados do navegador
- Subscription expira naturalmente (iOS/Android)
- Service Worker é desregistrado

Subscriptions inválidas acumulam no banco de dados e causam:
- Tentativas de envio que sempre falham
- Logs poluídos com erros
- Performance degradada

### Solução Implementada

#### Migração SQL (`020_add_push_analytics_and_cleanup.sql`)

**Novos campos adicionados:**
```sql
ALTER TABLE push_subscriptions
ADD COLUMN last_verified TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN verification_failures INT DEFAULT 0;
```

- **`last_verified`**: Última vez que a subscription foi verificada como funcional
- **`verification_failures`**: Contador de falhas consecutivas de verificação

**Função de limpeza:**
```sql
CREATE FUNCTION cleanup_expired_push_subscriptions()
RETURNS INTEGER
```

Remove subscriptions que:
- Não foram verificadas há mais de 30 dias, OU
- Têm 3+ falhas consecutivas de verificação

#### API Endpoint (`/api/push/cleanup`)

**POST /api/push/cleanup**
- Requer autenticação via `INTERNAL_API_SECRET`
- Executa a função `cleanup_expired_push_subscriptions()`
- Retorna número de subscriptions removidas

```bash
# Exemplo de uso (cron job)
curl -X POST https://sindoca.vercel.app/api/push/cleanup \
  -H "x-internal-secret: $INTERNAL_API_SECRET"
```

**GET /api/push/cleanup**
- Visualiza quantas subscriptions seriam removidas (sem deletar)
- Útil para debug

#### Atualização em `/api/push/send`

**Quando envio é bem-sucedido:**
```typescript
await supabase
  .from('push_subscriptions')
  .update({
    last_verified: new Date().toISOString(),
    verification_failures: 0,
  })
  .eq('id', sub.id);
```

**Quando envio falha:**
```typescript
await supabase
  .from('push_subscriptions')
  .update({
    verification_failures: (sub.verification_failures || 0) + 1,
  })
  .eq('id', sub.id);
```

**Se subscription for 410/404 (gone/not found):**
```typescript
// Deleta imediatamente
await supabase
  .from('push_subscriptions')
  .delete()
  .eq('id', sub.id);
```

### Como Usar

#### Setup de Cron Job (Vercel)

1. Crie arquivo `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/push/cleanup",
    "schedule": "0 3 * * *"
  }]
}
```

Isso executa limpeza todo dia às 3h da manhã.

#### Manual (via Dashboard)

Crie um botão no admin dashboard:
```javascript
async function cleanupSubscriptions() {
  const response = await fetch('/api/push/cleanup', {
    method: 'POST',
    headers: {
      'x-internal-secret': process.env.NEXT_PUBLIC_INTERNAL_API_SECRET
    }
  });
  const result = await response.json();
  console.log(`Removed ${result.deleted} subscriptions`);
}
```

---

## 2️⃣ Notificação quando Subscription Expira

### Implementação

Quando o sistema detecta uma divergência (subscription no banco mas não no navegador), o DebugPushTab exibe:

```jsx
{!subscription && dbSubscription && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
    <p className="text-yellow-800 font-medium">
      ⚠️ Subscription no banco mas não no navegador!
    </p>
    <p className="text-yellow-700">
      O navegador perdeu a subscription. Use o botão abaixo para recriar
    </p>
    <button onClick={reactivateNotifications}>
      🔄 Reativar Notificações
    </button>
  </div>
)}
```

### Como Funciona

1. Hook `usePushNotifications` verifica tanto navegador quanto banco
2. Se houver divergência, define `isPushActive = false`
3. UI exibe aviso e botão de reativação
4. Ao clicar, executa `subscribeToPush()` para recriar subscription

---

## 3️⃣ Botão "Reativar Notificações"

### Localização

**DebugPushTab** (`components/menu/debug-tabs/DebugPushTab.jsx:178-206`)

### Comportamento

```javascript
const reactivateNotifications = async () => {
  setTestResult({ loading: true });
  try {
    const sub = await subscribeToPush();
    if (sub) {
      setTestResult({
        success: true,
        message: 'Subscription recriada com sucesso!',
      });
      setTimeout(loadSubscriptions, 1000);
    }
  } catch (error) {
    setTestResult({
      success: false,
      message: error.message,
    });
  }
}
```

### Casos de Uso

1. **Navegador perdeu subscription**: Usuário limpou dados do navegador
2. **Service Worker desregistrado**: SW foi removido ou atualizado
3. **Subscription expirou**: iOS/Android expiraram a subscription
4. **Desenvolvimento**: Testes e debugging

---

## 4️⃣ Analytics de Entrega de Notificações

### Tabela `push_notification_analytics`

```sql
CREATE TABLE push_notification_analytics (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  sender_id UUID REFERENCES auth.users(id),
  recipient_id UUID REFERENCES auth.users(id),
  notification_type TEXT NOT NULL, -- 'photo', 'reason', 'music', etc.
  title TEXT NOT NULL,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'expired'
  error_message TEXT,
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  metadata JSONB
);
```

### Função `get_push_stats`

Retorna estatísticas agregadas de um workspace:

```sql
SELECT * FROM get_push_stats('workspace-uuid', 7);
```

Retorna:
- `total_sent`: Total de notificações enviadas
- `total_delivered`: Total entregues com sucesso
- `total_failed`: Total que falharam
- `total_clicked`: Total que foram clicadas
- `delivery_rate`: Taxa de entrega (%)
- `click_rate`: Taxa de cliques (%)
- `by_type`: Breakdown por tipo de notificação (JSONB)

### Registro de Analytics

Quando notificação é enviada via `/api/push/send`:

```typescript
const analyticsRecord = {
  workspace_id: workspaceId,
  sender_id: senderId || null,
  recipient_id: recipientUserId,
  notification_type: notificationType || 'unknown',
  title,
  body: body || '',
  delivery_status: successful > 0 ? 'sent' : 'failed',
  error_message: failed > 0 ? 'Some deliveries failed' : null,
  metadata: {
    sent_count: successful,
    failed_count: failed,
    total_subscriptions: subscriptions.length,
    url,
  },
};

await supabase
  .from('push_notification_analytics')
  .insert(analyticsRecord);
```

### Tab de Analytics (`DebugAnalyticsTab`)

**Localização:** `components/menu/debug-tabs/DebugAnalyticsTab.jsx`

**Métricas exibidas:**

1. **Enviadas** 📨
   - Total de notificações enviadas

2. **Taxa de Entrega** ✅
   - Porcentagem entregues com sucesso
   - Número absoluto de entregues

3. **Falhas** ❌
   - Número de notificações que falharam

4. **Taxa de Cliques** 🖱️
   - Porcentagem de notificações clicadas
   - Número absoluto de cliques

5. **Por Tipo de Notificação** 📊
   - Breakdown por tipo (foto, razão, música, etc.)
   - Sent, delivered, failed, clicked para cada tipo

6. **Notificações Recentes** 📋
   - Lista das 10 notificações mais recentes
   - Status de entrega
   - Timestamp

**Filtro de Período:**
- Últimas 24h
- Últimos 7 dias
- Últimos 30 dias

**Screenshot:**
```
┌─────────────────────────────────────────┐
│ 📊 Analytics de Notificações  [7 dias ▼]│
├─────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ 📨 42   │ │ ✅ 95%  │ │ ❌ 2    │    │
│ │Enviadas │ │ Entrega │ │ Falhas  │    │
│ └─────────┘ └─────────┘ └─────────┘    │
│                                         │
│ 📊 Por Tipo de Notificação              │
│ ┌───────────────────────────────────┐  │
│ │ 📸 Fotos: 25 enviadas             │  │
│ │    ✓ 24 entregues  ✗ 1 falha    │  │
│ ├───────────────────────────────────┤  │
│ │ ❤️ Razões: 12 enviadas            │  │
│ │    ✓ 12 entregues  🖱️ 5 cliques   │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔄 Fluxo Completo

### Envio de Notificação

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário adiciona foto                                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. sendPushToPartner({                                  │
│      title: 'Nova foto! 📸',                            │
│      body: 'Seu mozão adicionou uma foto nova',        │
│      notificationType: 'photo',                         │
│      url: '/galeria'                                    │
│    })                                                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. POST /api/push/send                                  │
│    - Busca subscriptions do destinatário               │
│    - Tenta enviar para cada subscription               │
│    - Atualiza last_verified se sucesso                 │
│    - Incrementa verification_failures se falha          │
│    - Deleta se 410/404                                  │
│    - Registra analytics                                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Analytics registrado:                                │
│    {                                                    │
│      notification_type: 'photo',                        │
│      delivery_status: 'sent',                           │
│      sent_count: 1,                                     │
│      failed_count: 0                                    │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Notificação aparece no dispositivo do parceiro      │
└─────────────────────────────────────────────────────────┘
```

### Limpeza Automática (Cron)

```
┌─────────────────────────────────────────────────────────┐
│ 1. Cron job (3h da manhã)                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. POST /api/push/cleanup                               │
│    (com x-internal-secret header)                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. cleanup_expired_push_subscriptions()                 │
│    DELETE FROM push_subscriptions                       │
│    WHERE last_verified < NOW() - 30 days                │
│       OR verification_failures >= 3                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Retorna: { deleted: 5 }                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Arquivos Criados/Modificados

### Novos Arquivos

1. ✅ `supabase/migrations/020_add_push_analytics_and_cleanup.sql`
2. ✅ `app/api/push/cleanup/route.ts`
3. ✅ `components/menu/debug-tabs/DebugAnalyticsTab.jsx`

### Arquivos Modificados

1. ✅ `app/api/push/send/route.ts` - Analytics + last_verified
2. ✅ `components/menu/debug-tabs/DebugPushTab.jsx` - Botão reativar
3. ✅ `components/menu/DebugSheet.jsx` - Nova tab Analytics
4. ✅ `lib/push/sendToPartner.ts` - Tipo notificationType
5. ✅ `hooks/usePushNotifications.jsx` - dbSubscription (anterior)

---

## 🚀 Deploy Checklist

### 1. Aplicar Migração no Supabase

```sql
-- Via Supabase Dashboard → SQL Editor
-- Cole e execute: supabase/migrations/020_add_push_analytics_and_cleanup.sql
```

### 2. Configurar Cron Job (Vercel)

Adicione ao `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/push/cleanup",
    "schedule": "0 3 * * *"
  }]
}
```

### 3. Variáveis de Ambiente

Certifique-se de que `INTERNAL_API_SECRET` está configurado:
```bash
# .env.local
INTERNAL_API_SECRET=your_random_secret_here
```

### 4. Deploy do Código

```bash
git add .
git commit -m "feat: Add push notification improvements (cleanup, analytics, reactivation)"
git push origin main
```

### 5. Verificar Funcionalidades

1. **Analytics:**
   - Abra Debug → Analytics
   - Verifique se está mostrando métricas

2. **Limpeza:**
   - Teste via `GET /api/push/cleanup` (veja quantas seriam removidas)
   - Execute `POST /api/push/cleanup` para testar remoção

3. **Reativação:**
   - Limpe dados do navegador
   - Abra Debug → Push Status
   - Deve mostrar botão "Reativar Notificações"
   - Clique e verifique se recria subscription

---

## 📊 Exemplos de Queries Úteis

### Ver Analytics por Tipo

```sql
SELECT
  notification_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE delivery_status = 'sent') as sent,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed,
  COUNT(*) FILTER (WHERE clicked = true) as clicked
FROM push_notification_analytics
WHERE workspace_id = 'seu-workspace-id'
  AND sent_at >= NOW() - INTERVAL '7 days'
GROUP BY notification_type;
```

### Ver Subscriptions com Problemas

```sql
SELECT
  ps.*,
  p.email
FROM push_subscriptions ps
JOIN profiles p ON ps.user_id = p.id
WHERE ps.verification_failures >= 2
   OR ps.last_verified < NOW() - INTERVAL '7 days'
ORDER BY ps.verification_failures DESC, ps.last_verified ASC;
```

### Ver Taxa de Entrega por Usuário

```sql
SELECT
  p.email,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE pna.delivery_status = 'sent') as delivered,
  ROUND(
    (COUNT(*) FILTER (WHERE pna.delivery_status = 'sent')::NUMERIC / COUNT(*)) * 100,
    2
  ) as delivery_rate
FROM push_notification_analytics pna
JOIN profiles p ON pna.recipient_id = p.id
WHERE pna.workspace_id = 'seu-workspace-id'
GROUP BY p.email;
```

---

## ✨ Benefícios das Melhorias

### Performance

- ✅ Banco de dados mais limpo (sem subscriptions mortas)
- ✅ Menos tentativas de envio falhadas
- ✅ Logs mais limpos

### UX (User Experience)

- ✅ Usuário pode reativar notificações facilmente
- ✅ Feedback visual quando subscription expira
- ✅ Analytics mostram se notificações estão funcionando

### DevEx (Developer Experience)

- ✅ Debug muito mais fácil com analytics
- ✅ Identificação rápida de problemas
- ✅ Métricas para monitorar saúde do sistema

### Business

- ✅ Insights sobre engajamento
- ✅ Taxa de entrega rastreável
- ✅ Identificação de problemas técnicos

---

## 🎯 Próximos Passos (Futuro)

### Notificações Agendadas

- Lembrete diário para interagir
- Aniversários e datas especiais
- Notificações recorrentes

### Rich Notifications

- Imagens inline
- Botões de ação
- Resposta rápida

### A/B Testing

- Testar diferentes textos
- Otimizar horários de envio
- Melhorar taxas de clique

### Dashboard de Admin

- Visualização de analytics em tempo real
- Controle de limpeza manual
- Gestão de subscriptions

---

## 📚 Referências

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Supabase Functions](https://supabase.com/docs/guides/database/functions)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

**Fim da Documentação** ✅

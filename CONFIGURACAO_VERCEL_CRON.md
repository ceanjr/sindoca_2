# ⏰ Configuração do Vercel Cron para Lembretes Diários

## 📋 **O que é o Vercel Cron?**

O Vercel Cron permite agendar execuções automáticas de rotas de API em horários específicos. No Sindoca, usamos para enviar lembretes diários às 20h.

---

## 🚀 **Configuração (Já Implementado)**

### 1. **Arquivo `vercel.json` (Criado)**

```json
{
  "crons": [
    {
      "path": "/api/notifications/daily-reminder",
      "schedule": "0 23 * * *"
    }
  ]
}
```

**Explicação:**
- `path`: Rota da API que será executada
- `schedule`: Cron expression no formato UTC
  - `0 23 * * *` = 23h UTC = **20h BRT** (Horário de Brasília)

### 2. **API Route (Criada)**

Arquivo: `app/api/notifications/daily-reminder/route.ts`

**Funcionalidades:**
- ✅ Busca usuários com `daily_reminder_enabled: true`
- ✅ Verifica se `push_enabled: true`
- ✅ Envia notificação personalizada para cada usuário
- ✅ Protegido por `CRON_SECRET` (apenas Vercel pode chamar)
- ✅ Logs detalhados de sucesso/falha

### 3. **Variável de Ambiente `CRON_SECRET` (Adicionada)**

Adicionado ao `.env.local`:
```env
CRON_SECRET=7f8a2b1c4d5e6f9a0b3c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a
```

**⚠️ IMPORTANTE:** Você precisa adicionar essa variável no **Vercel Dashboard** também!

---

## 🔧 **Próximos Passos (Configuração no Vercel)**

### **Passo 1: Fazer Deploy**

```bash
git add .
git commit -m "Add daily reminder cron job"
git push
```

O Vercel vai detectar automaticamente o `vercel.json` e configurar o cron.

---

### **Passo 2: Adicionar `CRON_SECRET` no Vercel**

1. Acessar [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecionar o projeto **Sindoca**
3. Ir em **Settings → Environment Variables**
4. Adicionar nova variável:
   - **Name:** `CRON_SECRET`
   - **Value:** `7f8a2b1c4d5e6f9a0b3c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a`
   - **Environments:** Production, Preview, Development
5. Salvar e fazer redeploy

---

### **Passo 3: Verificar Configuração do Cron**

1. No Vercel Dashboard, ir em **Settings → Cron Jobs**
2. Você deve ver:
   ```
   Path: /api/notifications/daily-reminder
   Schedule: 0 23 * * * (Every day at 11:00 PM)
   ```
3. Verificar se está **Enabled** (ativado)

---

## 🧪 **Testando o Lembrete Diário**

### **Teste Manual (Sem Esperar 20h)**

1. Obter o `CRON_SECRET` do `.env.local`
2. Fazer uma requisição GET manualmente:

```bash
curl "https://sindoca.vercel.app/api/notifications/daily-reminder?secret=7f8a2b1c4d5e6f9a0b3c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a"
```

**Ou via Postman/Insomnia:**
```
GET https://sindoca.vercel.app/api/notifications/daily-reminder?secret=SEU_CRON_SECRET
```

**Resposta esperada:**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "total": 2
}
```

### **Verificar Logs no Vercel**

1. Vercel Dashboard → Projeto Sindoca
2. **Deployments** → Selecionar último deployment
3. **Functions** → `/api/notifications/daily-reminder`
4. Ver logs de execução

---

## 📅 **Horários do Cron**

### **Cron Expression Cheat Sheet**

| Cron | Horário UTC | Horário BRT | Descrição |
|------|-------------|-------------|-----------|
| `0 23 * * *` | 23h | **20h** | Lembrete noturno (atual) |
| `0 12 * * *` | 12h | 09h | Lembrete matinal |
| `0 17 * * *` | 17h | 14h | Lembrete tarde |
| `0 3 * * *` | 03h | 00h | Meia-noite |

**Para mudar o horário:**
1. Editar `vercel.json`
2. Alterar `schedule`
3. Fazer push para o GitHub
4. Vercel atualiza automaticamente

---

## 🔍 **Troubleshooting**

### **Problema: Cron não aparece no Vercel Dashboard**
**Solução:**
- Verificar se `vercel.json` está na raiz do projeto
- Fazer redeploy completo
- Aguardar alguns minutos (pode demorar para atualizar)

### **Problema: Notificações não são enviadas**
**Verificar:**
1. `CRON_SECRET` está configurado no Vercel?
2. Usuários têm `daily_reminder_enabled: true` e `push_enabled: true`?
3. Ver logs da função no Vercel (pode ter erro de execução)

### **Problema: Erro 401 Unauthorized**
**Solução:**
- `CRON_SECRET` no Vercel está diferente do código
- Atualizar variável de ambiente e fazer redeploy

---

## 📊 **Monitoramento**

### **Verificar Execuções do Cron**

1. Vercel Dashboard → Settings → Cron Jobs
2. Ver histórico de execuções
3. Verificar status (Success/Failed)

### **Analytics**

Todas as notificações são registradas na tabela `push_notification_analytics`:

```sql
SELECT
  notification_type,
  delivery_status,
  COUNT(*) as total,
  DATE(created_at) as date
FROM push_notification_analytics
WHERE notification_type = 'message'
  AND title LIKE '%Check-in%'
GROUP BY notification_type, delivery_status, DATE(created_at)
ORDER BY date DESC;
```

---

## ✅ **Checklist de Implementação**

- [x] ✅ Criar `vercel.json` com configuração do cron
- [x] ✅ Criar API route `/api/notifications/daily-reminder`
- [x] ✅ Adicionar `CRON_SECRET` ao `.env.local`
- [ ] ⏳ Adicionar `CRON_SECRET` no Vercel Dashboard
- [ ] ⏳ Fazer deploy para produção
- [ ] ⏳ Verificar cron no Vercel Dashboard
- [ ] ⏳ Testar manualmente via URL
- [ ] ⏳ Aguardar execução automática às 20h
- [ ] ⏳ Verificar logs e analytics

---

## 🎯 **Mensagem do Lembrete**

**Título:** `💑 Check-in do casal`
**Corpo:** `Dê um alô pro seu mozão e deixe o dia mais leve! ✨`

**Sugestões de variações (futuras):**
- "💕 Hora de mandar aquele carinho!"
- "🌙 Bora fechar o dia com amor?"
- "✨ Que tal fazer seu mozão sorrir agora?"
- "💌 Seu mozão tá esperando um alô!"

---

**Documentação criada em:** 2025-11-26
**Última atualização:** 2025-11-26

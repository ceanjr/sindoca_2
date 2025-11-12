# 🎵 Correção do Sistema de Turnos - Música

## 🔴 Problema Identificado

Sindy adicionou uma música, mas o turno continuou sendo dela.

### Causa Raiz

O código usava `.find()` para pegar o "parceiro", mas com **3 usuários no workspace**, isso não funcionava corretamente:

```typescript
// ❌ CÓDIGO ANTIGO (ERRADO)
const partnerId = members?.find(m => m.user_id !== user.id)?.user_id;
```

Isso pegava sempre o **primeiro** usuário diferente, não fazendo uma **rotação circular**.

---

## ✅ Correção Aplicada

### 1. Rotação Circular de Turnos

**Arquivo**: `app/api/spotify/playlist/add-track/route.ts` (linhas 166-189)

```typescript
// ✅ CÓDIGO NOVO (CORRETO)
// Busca todos os membros em ordem consistente
const { data: members } = await supabase
  .from('workspace_members')
  .select('user_id')
  .eq('workspace_id', workspaceId)
  .order('joined_at', { ascending: true }); // Ordem consistente

// Rotação circular
const currentUserIndex = members.findIndex(m => m.user_id === user.id);
const nextIndex = (currentUserIndex + 1) % members.length;
const nextUserId = members[nextIndex].user_id;
```

**Como funciona**:
- Usuário 1 adiciona → Turno passa para Usuário 2
- Usuário 2 adiciona → Turno passa para Usuário 3
- Usuário 3 adiciona → Turno volta para Usuário 1
- E assim por diante (circular)

### 2. Notificações para Todos

**Arquivo**: `app/api/spotify/playlist/add-track/route.ts` (linhas 192-225)

Agora envia notificações para **TODOS os outros membros** em paralelo:

```typescript
// ✅ Envia para todos os parceiros
const partnerIds = members?.filter(m => m.user_id !== user.id).map(m => m.user_id) || [];

const notificationPromises = partnerIds.map(partnerId => /* ... */);
await Promise.allSettled(notificationPromises);
```

---

## 🚀 Como Resolver Agora

### Passo 1: Corrigir Turno Atual

Execute no **Supabase SQL Editor**:

```sql
-- Copie e cole o conteúdo de: fix-turn-now.sql
-- Ou execute diretamente o UPDATE abaixo
```

Isso vai alternar o turno para a próxima pessoa na ordem.

### Passo 2: Deploy da Correção (Opcional)

Se quiser garantir que funcione para sempre:

```bash
git add .
git commit -m "Fix: Sistema de turnos com rotação circular

- Suportar múltiplos usuários (não apenas 2)
- Rotação circular automática
- Enviar notificações para todos os membros

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

### Passo 3: Testar

1. **Sindy** tenta adicionar música → Deve bloquear se não for sua vez
2. **Próxima pessoa** (quem está com turno) adiciona música → OK
3. Turno alterna para a próxima pessoa automaticamente
4. Repetir ciclo

---

## 🔍 Verificar Turno Atual

Execute no Supabase:

```sql
SELECT
  p.full_name,
  p.email,
  CASE
    WHEN p.id = w.data->>'current_music_turn_user_id' THEN '✅ É A VEZ'
    ELSE '⏸️ Aguardando'
  END as status
FROM workspaces w
CROSS JOIN profiles p
WHERE w.id = '99c966b1-98b9-4905-8d0d-80e357336114'
  AND p.id IN (
    SELECT user_id FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  );
```

---

## 📊 Ordem de Rotação

Baseado em `joined_at` (ordem de entrada no workspace):

1. **Célio Júnior** (2025-11-04 22:04:00)
2. **Sindy** (2025-11-06 03:24:01)
3. **ceanbrjr** (2025-11-11 21:06:33)

**Rotação**:
- Célio adiciona → Vez da Sindy
- Sindy adiciona → Vez do ceanbrjr
- ceanbrjr adiciona → Vez do Célio
- (repete)

---

## 🎯 Logs no Console

Após adicionar música, você verá:

```
[Music Turn] Current: 50e5a69d-8421-4fc1-a33a-8cb0d125ab50 (index 0), Next: d92c396b-db11-45f8-a45f-47ff5152484a (index 1)
[Music Turn] Updated to: d92c396b-db11-45f8-a45f-47ff5152484a
Push notifications sent to 2 partner(s)
```

---

## 🆘 Se o Turno Travar de Novo

### Opção 1: Corrigir Manualmente via SQL

```sql
-- Forçar turno para um usuário específico
UPDATE workspaces
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{current_music_turn_user_id}',
  '"USER_ID_AQUI"'::jsonb
)
WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114';
```

**IDs dos usuários**:
- Célio: `50e5a69d-8421-4fc1-a33a-8cb0d125ab50`
- Sindy: `d92c396b-db11-45f8-a45f-47ff5152484a`
- ceanbrjr: `b726a059-f7b3-4825-8e29-e4a4f93aae39`

### Opção 2: Resetar Turnos

```sql
-- Permitir que qualquer um adicione
UPDATE workspaces
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{current_music_turn_user_id}',
  'null'::jsonb
)
WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114';
```

---

## 💡 Recomendação

Se o usuário `ceanbrjr` foi apenas para teste, considere removê-lo:

```sql
DELETE FROM workspace_members
WHERE user_id = 'b726a059-f7b3-4825-8e29-e4a4f93aae39'
AND workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114';
```

Com apenas 2 usuários, o sistema fica mais simples e previsível.

---

## 📂 Arquivos Criados/Modificados

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `app/api/spotify/playlist/add-track/route.ts` | ✅ Modificado | Rotação circular + notif para todos |
| `check-turn-status.sql` | ✅ Criado | Verificar situação atual |
| `fix-turn.sql` | ✅ Criado | Diagnóstico + correção |
| `fix-turn-now.sql` | ✅ Criado | Correção rápida |
| `CORRECAO_SISTEMA_TURNOS.md` | ✅ Criado | Este documento |

---

**Status**: ✅ Correção aplicada no código
**Próximo passo**: Execute `fix-turn-now.sql` no Supabase para corrigir o turno atual
**Deploy**: Opcional, mas recomendado para garantir que funcione sempre

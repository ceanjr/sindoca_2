# 🗑️ Remover Usuário de Debug do Workspace

## 🎯 Quando Executar

Execute este script **DEPOIS** que:
- ✅ Sindy se conectar ao Spotify
- ✅ Sindy adicionar pelo menos 1 música
- ✅ Confirmar que o sistema de turnos está funcionando entre você e Sindy

---

## ✅ Script SQL (Supabase)

### Passo 1: Verificar Situação Atual

```sql
-- Ver todos os membros do workspace
SELECT
  w.name as workspace_name,
  p.email,
  p.full_name,
  wm.role,
  p.spotify_user_id IS NOT NULL as spotify_connected
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
JOIN profiles p ON wm.user_id = p.id
WHERE w.id IN (
  SELECT DISTINCT workspace_id
  FROM workspace_members wm
  JOIN profiles p ON wm.user_id = p.id
  WHERE p.email = 'celiojunior0110@gmail.com'
)
ORDER BY p.email;
```

**Resultado esperado**: Deve mostrar 3 pessoas (Você, Sindy, Debug)

---

### Passo 2: Remover Debug User do Workspace

```sql
-- Remover apenas o membro debug do workspace (NÃO deleta a conta)
DELETE FROM workspace_members
WHERE user_id = (
  SELECT id
  FROM profiles
  WHERE email = 'ceanbrjr@gmail.com'
  LIMIT 1
)
AND workspace_id IN (
  SELECT DISTINCT workspace_id
  FROM workspace_members wm
  JOIN profiles p ON wm.user_id = p.id
  WHERE p.email = 'celiojunior0110@gmail.com'
);
```

**O que isso faz**:
- ❌ Remove debug do workspace
- ✅ Mantém a conta debug (pode usar em outros testes)
- ✅ Mantém todas as músicas já adicionadas
- ✅ Não afeta você nem Sindy

---

### Passo 3: Atualizar Partner ID (Opcional)

```sql
-- Garantir que Sindy seja o partner oficial
UPDATE workspaces
SET partner_id = (
  SELECT id
  FROM profiles
  WHERE email = 'sindyguimaraes.a@gmail.com'
  LIMIT 1
)
WHERE id IN (
  SELECT DISTINCT workspace_id
  FROM workspace_members wm
  JOIN profiles p ON wm.user_id = p.id
  WHERE p.email = 'celiojunior0110@gmail.com'
)
AND creator_id = (
  SELECT id
  FROM profiles
  WHERE email = 'celiojunior0110@gmail.com'
  LIMIT 1
);
```

---

### Passo 4: Verificar que Funcionou

```sql
-- Deve mostrar apenas 2 pessoas agora
SELECT
  w.name as workspace_name,
  p.email,
  p.full_name,
  wm.role,
  COUNT(*) OVER (PARTITION BY w.id) as total_members
FROM workspaces w
JOIN workspace_members wm ON w.id = wm.workspace_id
JOIN profiles p ON wm.user_id = p.id
WHERE w.id IN (
  SELECT DISTINCT workspace_id
  FROM workspace_members wm
  JOIN profiles p ON wm.user_id = p.id
  WHERE p.email = 'celiojunior0110@gmail.com'
)
ORDER BY p.email;
```

**Resultado esperado**:
```
| workspace_name | email                        | full_name    | role    | total_members |
|----------------|------------------------------|--------------|---------|---------------|
| Nosso Espaço   | celiojunior0110@gmail.com    | Célio Júnior | partner | 2             |
| Nosso Espaço   | sindyguimaraes.a@gmail.com   | Sindy        | partner | 2             |
```

---

## 🔄 Após Remover

1. **Você** e **Sindy** façam **logout/login** ou hard refresh (`Ctrl + Shift + R`)
2. Sistema de turnos deve funcionar perfeitamente:
   - Quando você adiciona → "É a vez de Sindy"
   - Quando Sindy adiciona → "É a vez de [Seu Nome]"
3. Apenas vocês dois veem as músicas
4. Sistema alterna corretamente entre vocês

---

## ⚠️ IMPORTANTE

**NÃO execute este script ANTES de Sindy se conectar!**

Ordem correta:
1. ✅ Sindy cria conta / faz login
2. ✅ Sindy entra no workspace (com código de convite)
3. ✅ Sindy conecta ao Spotify
4. ✅ Você adiciona 1 música
5. ✅ Sindy adiciona 1 música (para testar)
6. ✅ Confirmar que turnos alternam corretamente
7. ✅ **ENTÃO** executar script de remoção do debug

---

## 🎯 Alternativa: Manter Debug para Testes

Se quiser manter o debug user para testes futuros:

**NÃO remova do workspace**, mas:
- Crie um **segundo workspace** só para testes
- Adicione debug nesse workspace de testes
- Mantenha o workspace principal limpo (só você e Sindy)

---

## 📋 Checklist Final

Após remover debug:

- [ ] Query de verificação mostra apenas 2 membros
- [ ] Você e Sindy fazem hard refresh
- [ ] Você adiciona música → Aparece "É a vez de Sindy"
- [ ] Sindy adiciona música → Aparece "É a vez de [Você]"
- [ ] Sistema alterna corretamente
- [ ] Nenhum erro no console
- [ ] Playlist Spotify funciona para ambos

---

**Execute somente após confirmar que tudo funciona com Sindy!** ✅

**Data**: 2025-01-11

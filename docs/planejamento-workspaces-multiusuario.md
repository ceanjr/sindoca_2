# Planejamento: Migração para Sistema Multiusuário com Múltiplos Espaços

**Data:** 2025-11-14
**Versão:** 1.0
**Status:** Planejamento
**Autor:** Claude (Análise Técnica)

---

## 📋 Índice

1. [Resumo Executivo](#resumo-executivo)
2. [Estado Atual do Projeto](#estado-atual-do-projeto)
3. [Problema e Limitações Atuais](#problema-e-limitações-atuais)
4. [Objetivo da Refatoração](#objetivo-da-refatoração)
5. [Novo Modelo Conceitual](#novo-modelo-conceitual)
6. [Modelo de Dados Detalhado](#modelo-de-dados-detalhado)
7. [Regras de Negócio dos Espaços](#regras-de-negócio-dos-espaços)
8. [Fluxos de UX](#fluxos-de-ux)
9. [Mudanças Necessárias no Backend](#mudanças-necessárias-no-backend)
10. [Mudanças Necessárias na UI](#mudanças-necessárias-na-ui)
11. [Segurança e RLS](#segurança-e-rls)
12. [Plano de Migração de Dados](#plano-de-migração-de-dados)
13. [Checklist Técnico](#checklist-técnico)
14. [Riscos e Edge Cases](#riscos-e-edge-cases)
15. [Cronograma Sugerido](#cronograma-sugerido)

---

## 📊 Resumo Executivo

O Sindoca é atualmente um aplicativo PWA romântico projetado para **um único casal**. Este documento detalha o plano completo para transformá-lo em uma plataforma **multiusuário**, onde cada usuário pode participar de **múltiplos "Espaços"** (workspaces), mantendo total compatibilidade com os dados existentes.

### Principais Mudanças

- ✅ **Usuários independentes**: Qualquer pessoa pode criar conta
- ✅ **Múltiplos espaços por usuário**: Um usuário pode ter N espaços
- ✅ **Seleção de espaço ativo**: UI para trocar entre espaços
- ✅ **Convites por código**: Sistema de invite_code funcional
- ✅ **Estados de espaço**: Active, Disabled, Archived
- ✅ **Preservação total dos dados**: Zero perda de dados existentes

---

## 🏗️ Estado Atual do Projeto

### Arquitetura Existente

O Sindoca já possui uma **arquitetura base** preparada para workspaces, mas configurada para operar com **um único workspace compartilhado**.

#### Tabelas Principais (22 migrações aplicadas)

```sql
-- Core tables
profiles              -- Perfis de usuários (extends auth.users)
workspaces            -- Espaços compartilhados
workspace_members     -- Relacionamento user ↔ workspace
content               -- Conteúdo (fotos, mensagens, músicas, etc.)
reactions             -- Reações e favoritos (incluindo emojis)

-- Feature tables
custom_emojis         -- Emojis personalizados por usuário
push_subscriptions    -- Subscrições Web Push
push_subscriptions_native -- Subscrições Expo (preparado para app nativo)
notification_preferences -- Preferências de notificação por usuário
push_notification_analytics -- Métricas de notificações
page_config           -- Configurações de visibilidade de páginas (admin)
```

#### Modelo Atual de Workspace

**Workspace único:**

- Nome: "Nosso Espaço"
- Criado automaticamente via trigger `ensure_user_in_workspace()`
- Todos os novos usuários são adicionados a este workspace
- `workspace_members` possui 2 membros (você e sua namorada)
- Todo `content` aponta para este workspace via `workspace_id`

**Campos importantes:**

```sql
workspaces (
  id UUID,
  name TEXT,
  invite_code TEXT UNIQUE,
  secret_question TEXT (nullable),
  secret_answer_hash TEXT (nullable),
  creator_id UUID,
  partner_id UUID (nullable),
  status TEXT ('pending', 'active'),
  data JSONB, -- Contém dados do Spotify, etc.
  created_at, updated_at
)
```

#### Contextos e Hooks Relevantes

**AuthContext** (`contexts/AuthContext.tsx`):

- Gerencia `user` e `profile`
- **NÃO gerencia workspace atual** (precisa ser adicionado)

**Hooks de dados:**

- `useRealtimePhotos`: Busca workspace via `workspace_members` em cada hook
- `useRealtimeMessages`, `useRealtimeAchievements`, `useRealtimePlaylist`: Mesma abordagem
- **Problema**: Cada hook busca workspace individualmente (ineficiente)

**API de workspace** (`lib/api/workspace.ts`):

- Já possui funções: `createWorkspace`, `getUserWorkspaces`, `getWorkspace`, etc.
- **Pronta para uso**, mas não utilizada na UI principal

---

## ⚠️ Problema e Limitações Atuais

### 1. Single-Couple Architecture

- **Hardcoded para um casal**: Trigger SQL adiciona todos os usuários ao mesmo workspace
- **Sem UI de seleção**: Não existe interface para escolher/criar/trocar espaços
- **Sem isolamento de dados**: Teoricamente, qualquer novo usuário cairia no workspace do casal

### 2. Estado Global Ausente

- **Não há `currentWorkspaceId`**: Cada hook busca workspace separadamente
- **Performance**: Múltiplas queries iguais em paralelo
- **Sincronização**: Difícil garantir que toda UI está no mesmo workspace

### 3. Modelo de Convite Incompleto

- `invite_code` existe, mas não há fluxo de signup com convite
- `secret_question` e `secret_answer` estão deprecated/nullable

### 4. RLS Policies Limitadas

- Policies atuais assumem um único workspace
- Faltam checks para `status` de workspace (disabled, archived)
- Não impedem escrita em workspaces desabilitados

---

## 🎯 Objetivo da Refatoração

### Visão Final

Transformar o Sindoca em uma **plataforma multiusuário** onde:

1. **Qualquer pessoa pode criar conta** (signup público)
2. **Cada usuário possui pelo menos 1 espaço** (workspace padrão criado automaticamente)
3. **Usuários podem criar N espaços** e convidar outros via código
4. **Usuários podem participar de N espaços** (sem limite)
5. **UI clara para trocar de espaço ativo** (workspace switcher)
6. **Cada espaço possui estados**: Active, Disabled, Archived
7. **Notificações configuráveis** por espaço ou globais
8. **Zero perda de dados existentes** (workspace atual permanece intacto)

### Requisitos Não-Funcionais

- ✅ Compatibilidade total com dados existentes
- ✅ Migração incremental (sem big-bang)
- ✅ Performance mantida (Realtime Subscriptions)
- ✅ Segurança reforçada (RLS policies atualizadas)
- ✅ UX mobile-first (bottom sheet, gestures)

---

## 🧩 Novo Modelo Conceitual

### Entidades Principais

```
┌─────────────┐
│   USUÁRIO   │ (profiles)
│             │
│ - id        │
│ - email     │
│ - nome      │
│ - avatar    │
└──────┬──────┘
       │
       │ N:M (via workspace_members)
       │
       ▼
┌─────────────────────┐
│      WORKSPACE      │ (workspaces)
│                     │
│ - id                │
│ - name              │
│ - invite_code       │
│ - status            │ ◄── NEW: 'active' | 'disabled' | 'archived'
│ - data (JSONB)      │
│ - archived_at       │ ◄── NEW
│ - archived_by       │ ◄── NEW
└──────┬──────────────┘
       │
       │ 1:N
       │
       ▼
┌─────────────────────┐
│      CONTENT        │ (content)
│                     │
│ - workspace_id      │
│ - author_id         │
│ - type              │
│ - data              │
└─────────────────────┘
```

### Novo Conceito: Current Workspace

Cada usuário terá um **workspace ativo** (current workspace) armazenado em:

**Opção A (Recomendada):** Cookie + Context

```typescript
// Cookie seguro (httpOnly)
currentWorkspaceId: UUID

// Context React
<WorkspaceContext>
  currentWorkspace
  setCurrentWorkspace()
  availableWorkspaces
</WorkspaceContext>
```

**Opção B:** Coluna em `profiles`

```sql
ALTER TABLE profiles
ADD COLUMN current_workspace_id UUID REFERENCES workspaces(id);
```

**Recomendação:** **Opção A** (Cookie + Context)

- ✅ Mais flexível (pode trocar sem salvar no banco)
- ✅ Não polui `profiles` com dado de sessão
- ✅ Funciona offline (localStorage como fallback)
- ❌ Requer logic de sincronização

---

## 💾 Modelo de Dados Detalhado

### 1. Tabela `workspaces` (Alterações)

**Colunas novas:**

```sql
-- Migration: 022_add_workspace_states.sql

ALTER TABLE workspaces
  -- Atualizar ENUM de status
  DROP CONSTRAINT IF EXISTS workspaces_status_check,
  ADD CONSTRAINT workspaces_status_check
    CHECK (status IN ('active', 'disabled', 'archived'));

-- Adicionar colunas de arquivamento
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

-- Tornar campos de convite opcionais (já são nullable)
-- Mas adicionar comentários explicativos
COMMENT ON COLUMN workspaces.invite_code IS 'Código único para convidar membros (ex: ABC123)';
COMMENT ON COLUMN workspaces.secret_question IS 'DEPRECATED - usar apenas invite_code';
COMMENT ON COLUMN workspaces.secret_answer_hash IS 'DEPRECATED - usar apenas invite_code';

-- Remover campos obsoletos
ALTER TABLE workspaces
  DROP COLUMN IF EXISTS secret_question,
  DROP COLUMN IF EXISTS secret_answer_hash,
  DROP COLUMN IF EXISTS partner_id, -- Usar workspace_members
  DROP COLUMN IF EXISTS max_attempts,
  DROP COLUMN IF EXISTS current_attempts;

-- Index para busca por código
CREATE INDEX IF NOT EXISTS idx_workspaces_invite_code
  ON workspaces(invite_code) WHERE status != 'archived';

-- Index para arquivados
CREATE INDEX IF NOT EXISTS idx_workspaces_archived
  ON workspaces(archived_at) WHERE status = 'archived';
```

**Estrutura final:**

```sql
workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Meu Espaço',
  invite_code TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'archived')),
  data JSONB DEFAULT '{}'::jsonb,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### 2. Tabela `workspace_members` (Alterações)

**Colunas novas:**

```sql
-- Migration: 022_add_workspace_states.sql (continuação)

ALTER TABLE workspace_members
  -- Adicionar campo de saída (soft delete)
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS left_reason TEXT;

-- Simplificar roles (remover 'creator' vs 'partner')
ALTER TABLE workspace_members
  DROP CONSTRAINT IF EXISTS workspace_members_role_check,
  ADD CONSTRAINT workspace_members_role_check
    CHECK (role IN ('member'));

-- Index para membros ativos
CREATE INDEX IF NOT EXISTS idx_workspace_members_active
  ON workspace_members(workspace_id, user_id)
  WHERE left_at IS NULL;

-- Index para buscar workspaces do usuário
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_active
  ON workspace_members(user_id)
  WHERE left_at IS NULL;
```

**Estrutura final:**

```sql
workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,              -- ◄── NEW: soft delete
  left_reason TEXT,                  -- ◄── NEW: motivo opcional
  PRIMARY KEY (workspace_id, user_id)
)
```

**Decisão de design:**

- ✅ **Soft delete** (coluna `left_at`) ao invés de deletar linha
- ✅ Permite histórico/auditoria
- ✅ Usuário pode ser "re-adicionado" ao mesmo workspace

### 3. Tabela `profiles` (Sem alterações estruturais)

Não adicionar `current_workspace_id` (usar Cookie + Context conforme recomendado).

### 4. Tabela `notification_preferences` (Alterações)

**Adicionar preferências por workspace:**

```sql
-- Migration: 023_add_workspace_notification_prefs.sql

-- Remover PK antiga
ALTER TABLE notification_preferences
  DROP CONSTRAINT notification_preferences_pkey;

-- Adicionar workspace_id
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Nova PK composta
ALTER TABLE notification_preferences
  ADD PRIMARY KEY (user_id, workspace_id);

-- Adicionar flag global
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS notify_all_workspaces BOOLEAN DEFAULT false;

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user
  ON notification_preferences(user_id);
```

**Estrutura final:**

```sql
notification_preferences (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT false,
  notify_new_music BOOLEAN DEFAULT true,
  notify_new_photos BOOLEAN DEFAULT true,
  notify_new_reasons BOOLEAN DEFAULT true,
  notify_all_workspaces BOOLEAN DEFAULT false,  -- ◄── NEW: global flag
  daily_reminder_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, workspace_id)
)
```

**Comportamento:**

- Preferências são **por usuário + workspace**
- Se `notify_all_workspaces = true`: recebe notificações de todos os espaços
- Se `false`: recebe apenas do workspace atual

### 5. Tabela `custom_emojis` (Alterações)

**Adicionar workspace_id:**

```sql
-- Migration: 024_add_workspace_to_custom_emojis.sql

ALTER TABLE custom_emojis
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Atualizar constraint UNIQUE
ALTER TABLE custom_emojis
  DROP CONSTRAINT IF EXISTS custom_emojis_user_id_emoji_key,
  ADD CONSTRAINT custom_emojis_workspace_emoji_unique
    UNIQUE(workspace_id, emoji);

-- Index
CREATE INDEX IF NOT EXISTS idx_custom_emojis_workspace
  ON custom_emojis(workspace_id);
```

**Estrutura final:**

```sql
custom_emojis (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,  -- ◄── NEW
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,       -- Quem criou
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, emoji)  -- Um emoji por workspace
)
```

**Decisão de design:**

- ✅ Emojis personalizados são **compartilhados no workspace** (não privados)
- ✅ `user_id` mantém autoria, mas todos os membros podem usar

### 6. Função: Geração de `invite_code`

**Melhorar geração de códigos:**

```sql
-- Migration: 022_add_workspace_states.sql (continuação)

CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
  exists_check BOOLEAN;
BEGIN
  LOOP
    result := '';

    -- Gerar código de 6 caracteres
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Verificar se já existe
    SELECT EXISTS(
      SELECT 1 FROM workspaces WHERE invite_code = result
    ) INTO exists_check;

    -- Se não existe, retornar
    IF NOT exists_check THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;

    -- Proteção contra loop infinito
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique invite code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📜 Regras de Negócio dos Espaços

### 1. Criação de Espaços

#### 1.1. Workspace Padrão (Signup sem Convite)

**Quando:** Novo usuário cria conta SEM código de convite

**Ação:**

1. Criar usuário em `auth.users` → `profiles`
2. **Criar workspace padrão**:
   ```sql
   INSERT INTO workspaces (name, invite_code, creator_id, status)
   VALUES (
     'Meu Espaço',  -- Nome padrão
     generate_unique_invite_code(),
     new_user_id,
     'active'
   );
   ```
3. Adicionar usuário como membro:
   ```sql
   INSERT INTO workspace_members (workspace_id, user_id, role)
   VALUES (new_workspace_id, new_user_id, 'member');
   ```

**Resultado:**

- Usuário possui 1 workspace (solo)
- Workspace está `active` mas com 1 membro apenas
- UI mostra "Você não tem nenhum vínculo" (mas workspace funciona normalmente)

#### 1.2. Signup com Código de Convite

**Quando:** Novo usuário cria conta COM código de convite

**Ação:**

1. Validar `invite_code`:
   ```sql
   SELECT * FROM workspaces
   WHERE invite_code = $1
     AND status IN ('active', 'disabled');  -- Não permitir join em archived
   ```
2. Criar usuário em `auth.users` → `profiles`
3. Adicionar usuário ao workspace do convite:
   ```sql
   INSERT INTO workspace_members (workspace_id, user_id, role)
   VALUES (workspace_from_invite_id, new_user_id, 'member');
   ```
4. **Opcional:** Criar também workspace padrão solo para o usuário
   - **Prós:** Usuário sempre tem espaço próprio
   - **Contras:** Pode confundir (2 espaços logo no início)
   - **Recomendação:** **NÃO criar** workspace padrão se entrou via convite

**Resultado:**

- Usuário ingressa diretamente no workspace convidado
- Workspace convidado se torna `currentWorkspaceId` inicial

#### 1.3. Criar Novo Espaço Manualmente

**Quando:** Usuário autenticado cria novo espaço via UI

**Formulário:**

- Nome do espaço (obrigatório)

**Ação:**

1. Validar usuário autenticado
2. Criar workspace:
   ```sql
   INSERT INTO workspaces (name, invite_code, creator_id, status)
   VALUES ($name, generate_unique_invite_code(), auth.uid(), 'active');
   ```
3. Adicionar usuário como membro:
   ```sql
   INSERT INTO workspace_members (workspace_id, user_id, role)
   VALUES (new_workspace_id, auth.uid(), 'member');
   ```
4. Retornar `invite_code` para compartilhar

**Resultado:**

- Novo workspace criado
- Usuário é o único membro
- `invite_code` gerado automaticamente

### 2. Estados de Workspace

#### 2.1. Estado: `active`

**Características:**

- ✅ Leitura permitida
- ✅ Escrita permitida (INSERT/UPDATE/DELETE em `content`)
- ✅ Visível no menu de espaços
- ✅ Pode receber novos membros via `invite_code`

**Transições possíveis:**

- → `disabled` (qualquer membro pode desativar)
- → `archived` (quando último membro sai)

#### 2.2. Estado: `disabled`

**Características:**

- ✅ Leitura permitida (modo somente leitura)
- ❌ Escrita bloqueada (RLS policy bloqueia INSERT/UPDATE/DELETE)
- ✅ Visível no menu de espaços (com badge "Desativado")
- ⚠️ Não aceita novos membros via `invite_code`

**Transições possíveis:**

- → `active` (qualquer membro pode reativar)
- → `archived` (quando último membro sai)

**Como desativar:**

```sql
UPDATE workspaces
SET status = 'disabled'
WHERE id = $workspace_id
  AND EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = $workspace_id
      AND user_id = auth.uid()
      AND left_at IS NULL
  );
```

**Como reativar:**

```sql
UPDATE workspaces
SET status = 'active'
WHERE id = $workspace_id
  AND status = 'disabled'
  AND EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = $workspace_id
      AND user_id = auth.uid()
      AND left_at IS NULL
  );
```

#### 2.3. Estado: `archived`

**Características:**

- ❌ Não visível na UI normal
- ❌ Sem leitura/escrita via RLS
- ✅ Dados preservados no banco (audit/backup)
- ✅ Pode ser restaurado via console SQL (admin only)

**Quando arquivar:**

- Quando o **último membro ativo** sair do workspace

**Trigger de arquivamento:**

```sql
CREATE OR REPLACE FUNCTION auto_archive_empty_workspaces()
RETURNS TRIGGER AS $$
DECLARE
  active_members_count INTEGER;
BEGIN
  -- Contar membros ativos no workspace
  SELECT COUNT(*) INTO active_members_count
  FROM workspace_members
  WHERE workspace_id = NEW.workspace_id
    AND left_at IS NULL;

  -- Se não há membros ativos, arquivar
  IF active_members_count = 0 THEN
    UPDATE workspaces
    SET status = 'archived',
        archived_at = NOW(),
        archived_by = NEW.user_id
    WHERE id = NEW.workspace_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_on_last_member_exit
  AFTER UPDATE OF left_at ON workspace_members
  FOR EACH ROW
  WHEN (NEW.left_at IS NOT NULL AND OLD.left_at IS NULL)
  EXECUTE FUNCTION auto_archive_empty_workspaces();
```

### 3. Membros e Saída de Workspace

#### 3.1. Desvincular-se de um Espaço

**Regras:**

1. ✅ Usuário pode sair de qualquer workspace
2. ❌ Usuário **NÃO pode** sair do último workspace ativo
3. ✅ Ao sair, workspace é automaticamente arquivado se era o último membro

**Validação antes de sair:**

```sql
-- Verificar quantos workspaces ativos o usuário possui
SELECT COUNT(*) FROM workspace_members wm
INNER JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = auth.uid()
  AND wm.left_at IS NULL
  AND w.status IN ('active', 'disabled');

-- Se COUNT = 1, bloquear saída
```

**Ação de sair:**

```sql
UPDATE workspace_members
SET left_at = NOW(),
    left_reason = $reason  -- Opcional
WHERE workspace_id = $workspace_id
  AND user_id = auth.uid()
  AND left_at IS NULL;
```

#### 3.2. Limite de Espaços

**Decisão de produto:**

- **Sem limite** para quantos espaços um usuário pode ter
- **Mínimo de 1** espaço ativo (validado antes de sair)

### 4. Convites

#### 4.1. Compartilhar Código de Convite

**Onde obter:**

- Menu "Espaços" → Selecionar espaço → "Código de Convite"
- Mostrar código + botão "Copiar"

**Formato do código:**

- 6 caracteres alfanuméricos (ex: `A3K9P2`)
- Único globalmente

#### 4.2. Aceitar Convite

**Fluxos:**

**A. Novo usuário (signup):**

1. Tela de signup → Toggle "Tenho um código de convite"
2. Input para digitar código
3. Validar código antes de criar conta
4. Criar conta + adicionar ao workspace

**B. Usuário existente:**

1. Menu "Espaços" → "Entrar com Código"
2. Input para digitar código
3. Validar código
4. Adicionar usuário ao workspace

**Validação:**

```sql
-- Verificar código
SELECT * FROM workspaces
WHERE invite_code = $code
  AND status IN ('active', 'disabled');  -- Não permitir archived

-- Verificar se já é membro
SELECT * FROM workspace_members
WHERE workspace_id = $workspace_id
  AND user_id = auth.uid()
  AND left_at IS NULL;
```

**Edge cases:**

- ❌ Código inválido → Erro "Código não encontrado"
- ❌ Workspace arquivado → Erro "Espaço não disponível"
- ❌ Já é membro → Erro "Você já faz parte deste espaço"

### 5. Notificações por Workspace

#### 5.1. Preferências Padrão

**Quando usuário entra em novo workspace:**

```sql
INSERT INTO notification_preferences (
  user_id,
  workspace_id,
  push_enabled,
  notify_all_workspaces
)
VALUES (
  auth.uid(),
  $workspace_id,
  true,   -- Push ativado por padrão
  false   -- Apenas workspace atual
)
ON CONFLICT DO NOTHING;
```

#### 5.2. Lógica de Envio de Notificação

**Quando enviar push:**

```sql
-- Buscar destinatários
SELECT DISTINCT ps.*
FROM push_subscriptions ps
INNER JOIN notification_preferences np
  ON np.user_id = ps.user_id
WHERE
  ps.user_id = $recipient_id
  AND (
    -- Opção 1: Preferência específica do workspace + push ativado
    (np.workspace_id = $workspace_id AND np.push_enabled = true)
    OR
    -- Opção 2: Flag global ativada
    (np.notify_all_workspaces = true AND np.push_enabled = true)
  );
```

---

## 🎨 Fluxos de UX

### 1. Fluxo de Autenticação

#### 1.1. Login (Usuário Existente)

```
┌─────────────────────────────────────┐
│     Tela de Login                   │
│                                     │
│  Email: ___________                 │
│  Senha: ___________                 │
│                                     │
│  [Entrar]  [Magic Link]             │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────┐
    │ Autenticação OK │
    └─────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Buscar workspaces do usuário       │
│  SELECT workspace_id                │
│  FROM workspace_members              │
│  WHERE user_id = ?                  │
│    AND left_at IS NULL              │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │ Tem workspaces?     │
    └─────────────────────┘
         ↙         ↘
       SIM         NÃO (Edge case - criar workspace default)
        ↓            ↓
   ┌────────┐   ┌──────────────┐
   │ N > 1? │   │ Criar espaço │
   └────────┘   │   padrão     │
     ↙    ↘     └──────────────┘
   SIM    NÃO
    ↓      ↓
┌──────┐ ┌────────────────────┐
│Escolher│ │Set currentWorkspace│
│espaço │ │  = último usado    │
│inicial│ │  (ou primeiro)     │
└──────┘ └────────────────────┘
    ↓          ↓
    └──────┬───┘
           ↓
   ┌───────────────┐
   │ Redirecionar  │
   │  para Home    │
   └───────────────┘
```

**Decisão: Como escolher workspace inicial?**

**Opção A (Recomendada):** Cookie/LocalStorage

- Salvar `lastUsedWorkspaceId` ao trocar espaço
- No login, carregar este workspace
- Se não existir/não for mais membro: usar primeiro da lista

**Opção B:** Modal de seleção

- Mostrar modal "Selecione um espaço" após login
- Forçar escolha explícita
- ❌ Pode irritar usuário com 1 único espaço

**Recomendação:** **Opção A**

#### 1.2. Signup SEM Código de Convite

```
┌─────────────────────────────────────┐
│     Tela de Cadastro                │
│                                     │
│  Nome: ___________                  │
│  Email: ___________                 │
│  Senha: ___________                 │
│                                     │
│  [ ] Tenho código de convite        │
│                                     │
│  [Criar Conta]                      │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │ Criar auth.user     │
    │ Criar profile       │
    └─────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Criar workspace padrão             │
│  INSERT INTO workspaces             │
│    (name='Meu Espaço', ...)         │
│                                     │
│  INSERT INTO workspace_members      │
│    (workspace_id, user_id, ...)     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Set currentWorkspaceId = novo_id   │
└─────────────────────────────────────┘
              ↓
   ┌───────────────┐
   │ Redirecionar  │
   │  para Home    │
   └───────────────┘
```

#### 1.3. Signup COM Código de Convite

```
┌─────────────────────────────────────┐
│     Tela de Cadastro                │
│                                     │
│  Nome: ___________                  │
│  Email: ___________                 │
│  Senha: ___________                 │
│                                     │
│  [X] Tenho código de convite        │
│                                     │
│  Código: [______]  (6 chars)        │
│                                     │
│  [Criar Conta]                      │
└─────────────────────────────────────┘
              ↓
    ┌───────────────────┐
    │ Validar código    │
    │ (tempo real)      │
    └───────────────────┘
         ↙         ↘
     VÁLIDO      INVÁLIDO
        ↓            ↓
┌───────────┐   ┌──────────────┐
│Criar user │   │ Mostrar erro │
│+ profile  │   │ "Código não  │
│           │   │  encontrado" │
└───────────┘   └──────────────┘
        ↓
┌─────────────────────────────────────┐
│  Adicionar ao workspace do convite  │
│  INSERT INTO workspace_members      │
│    (workspace_id_do_convite, ...)   │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│  Set currentWorkspaceId             │
│    = workspace_id_do_convite        │
└─────────────────────────────────────┘
        ↓
   ┌───────────────┐
   │ Redirecionar  │
   │  para Home    │
   └───────────────┘
```

### 2. Fluxo de Troca de Espaço (Workspace Switcher)

#### 2.1. Menu de Espaços

**Localização:** Configurações → Aba "Espaços"

```
┌─────────────────────────────────────┐
│  Configurações > Espaços            │
├─────────────────────────────────────┤
│                                     │
│  Espaço Atual:                      │
│  ┌──────────────────────────────┐  │
│  │ 💑 Nosso Espaço             │  │
│  │ 2 membros · Ativo           │  │
│  │ [Código: ABC123]  [Copiar]  │  │
│  └──────────────────────────────┘  │
│                                     │
│  Outros Espaços:                    │
│  ┌──────────────────────────────┐  │
│  │ 🏠 Meu Espaço Pessoal       │  │
│  │ 1 membro · Ativo            │  │
│  │ [Selecionar]                 │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ 💼 Espaço Trabalho          │  │
│  │ 5 membros · Desativado      │  │
│  │ [Selecionar]  [Reativar]     │  │
│  └──────────────────────────────┘  │
│                                     │
│  [+ Criar Novo Espaço]              │
│  [Entrar com Código]                │
└─────────────────────────────────────┘
```

#### 2.2. Ação: Trocar de Espaço

**Quando:** Usuário clica em "Selecionar" em outro espaço

**Efeito:**

1. Atualizar `currentWorkspaceId` no Cookie/Context
2. **MANTER página atual** (não redirecionar)
3. Recarregar dados da página com novo workspace
4. Mostrar toast: "Agora você está em: {nome_workspace}"

**Implementação:**

```typescript
// Context: WorkspaceContext.tsx
const switchWorkspace = async (newWorkspaceId: string) => {
  // 1. Atualizar cookie
  document.cookie = `currentWorkspaceId=${newWorkspaceId}; path=/; max-age=31536000`;

  // 2. Atualizar state
  setCurrentWorkspaceId(newWorkspaceId);

  // 3. Toast
  toast.success(`Agora você está em: ${workspace.name}`);

  // 4. Invalidar queries (se usar React Query)
  // queryClient.invalidateQueries();

  // 5. Broadcast para hooks recarregarem
  window.dispatchEvent(
    new CustomEvent('workspace-changed', {
      detail: { workspaceId: newWorkspaceId },
    })
  );
};
```

**Hooks devem ouvir evento:**

```typescript
// hooks/useRealtimePhotos.js
useEffect(() => {
  const handleWorkspaceChange = () => {
    loadPhotos(); // Recarregar com novo workspace
  };

  window.addEventListener('workspace-changed', handleWorkspaceChange);
  return () =>
    window.removeEventListener('workspace-changed', handleWorkspaceChange);
}, []);
```

### 3. Fluxo de Criar Novo Espaço

```
┌─────────────────────────────────────┐
│  Configurações > Espaços            │
│                                     │
│  [+ Criar Novo Espaço]  ◄── Click  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Modal/Bottom Sheet                 │
│                                     │
│  Criar Novo Espaço                  │
│  ───────────────────                │
│                                     │
│  Nome do Espaço:                    │
│  ┌──────────────────────────────┐  │
│  │ Meu Novo Espaço             │  │
│  └──────────────────────────────┘  │
│                                     │
│  [Cancelar]  [Criar]                │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │ Chamar API          │
    │ createWorkspace()   │
    └─────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Workspace criado!                  │
│                                     │
│  Código de convite:                 │
│  ┌──────────────────────────────┐  │
│  │  XYZ789                      │  │
│  │  [Copiar]  [Compartilhar]    │  │
│  └──────────────────────────────┘  │
│                                     │
│  Compartilhe este código para       │
│  adicionar pessoas ao espaço.       │
│                                     │
│  [Trocar para este espaço]          │
│  [Voltar]                           │
└─────────────────────────────────────┘
```

### 4. Fluxo de Desativar Espaço

```
┌─────────────────────────────────────┐
│  Detalhes do Espaço                 │
│                                     │
│  💑 Nosso Espaço                    │
│  Status: Ativo                      │
│  2 membros                          │
│                                     │
│  [Desativar Espaço]  ◄── Click     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Modal de Confirmação               │
│                                     │
│  ⚠️ Desativar Espaço?               │
│                                     │
│  Ao desativar:                      │
│  • Ninguém poderá adicionar/editar  │
│    conteúdo                         │
│  • Todos podem continuar vendo      │
│    (somente leitura)                │
│  • Qualquer membro pode reativar    │
│                                     │
│  [Cancelar]  [Desativar]            │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │ UPDATE workspaces   │
    │ SET status =        │
    │   'disabled'        │
    └─────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Toast: "Espaço desativado"         │
│                                     │
│  Badge no menu: "🔒 Desativado"     │
│                                     │
│  Comportamento:                     │
│  • Botões de criar/editar disabled  │
│  • Conteúdo visível normalmente     │
└─────────────────────────────────────┘
```

### 5. Fluxo de Desvincular-se de Espaço

```
┌─────────────────────────────────────┐
│  Detalhes do Espaço                 │
│                                     │
│  💼 Espaço Trabalho                 │
│  5 membros                          │
│                                     │
│  [Sair deste Espaço]  ◄── Click    │
└─────────────────────────────────────┘
              ↓
    ┌───────────────────────┐
    │ Verificar: é último   │
    │ espaço do usuário?    │
    └───────────────────────┘
         ↙         ↘
       SIM         NÃO
        ↓           ↓
┌─────────────┐  ┌──────────────────┐
│ Bloquear    │  │ Modal Confirmação│
│ com toast:  │  │                  │
│ "Você deve  │  │ ⚠️ Sair do       │
│ ter pelo    │  │   espaço?        │
│ menos 1     │  │                  │
│ espaço"     │  │ Você perderá     │
└─────────────┘  │ acesso a todo    │
                 │ conteúdo.        │
                 │                  │
                 │ [Cancelar][Sair] │
                 └──────────────────┘
                          ↓
                ┌──────────────────┐
                │ UPDATE           │
                │ workspace_members│
                │ SET left_at =    │
                │   NOW()          │
                └──────────────────┘
                          ↓
                ┌──────────────────┐
                │ Trigger verifica:│
                │ último membro?   │
                └──────────────────┘
                     ↙      ↘
                   SIM      NÃO
                    ↓        ↓
            ┌──────────┐  ┌─────┐
            │Arquivar  │  │ OK  │
            │workspace │  └─────┘
            └──────────┘
                    ↓
            ┌────────────────┐
            │ Redirecionar   │
            │ para outro     │
            │ espaço ativo   │
            └────────────────┘
```

---

## 🔧 Mudanças Necessárias no Backend

### 1. Criar `WorkspaceContext`

**Arquivo:** `contexts/WorkspaceContext.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase/client';

interface Workspace {
  id: string;
  name: string;
  invite_code: string;
  status: 'active' | 'disabled' | 'archived';
  member_count: number;
}

interface WorkspaceContextType {
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  availableWorkspaces: Workspace[];
  loading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load workspaces when user logs in
  const loadWorkspaces = async () => {
    if (!user) {
      setAvailableWorkspaces([]);
      setCurrentWorkspaceId(null);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      // Get user's workspaces
      const { data: members, error } = await supabase
        .from('workspace_members')
        .select(
          `
          workspace_id,
          workspaces (
            id,
            name,
            invite_code,
            status
          )
        `
        )
        .eq('user_id', user.id)
        .is('left_at', null);

      if (error) throw error;

      const workspaces =
        members
          ?.map((m) => m.workspaces)
          .filter((w) => w && w.status !== 'archived') || [];

      setAvailableWorkspaces(workspaces);

      // Set current workspace
      let targetWorkspaceId = currentWorkspaceId;

      // 1. Try to get from cookie
      if (!targetWorkspaceId) {
        const cookieMatch = document.cookie.match(/currentWorkspaceId=([^;]+)/);
        targetWorkspaceId = cookieMatch?.[1] || null;
      }

      // 2. Validate cookie workspace is still available
      if (
        targetWorkspaceId &&
        !workspaces.find((w) => w.id === targetWorkspaceId)
      ) {
        targetWorkspaceId = null;
      }

      // 3. Fallback to first workspace
      if (!targetWorkspaceId && workspaces.length > 0) {
        targetWorkspaceId = workspaces[0].id;
      }

      if (targetWorkspaceId) {
        await switchWorkspace(targetWorkspaceId, false);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = async (workspaceId: string, showToast = true) => {
    // Update cookie
    document.cookie = `currentWorkspaceId=${workspaceId}; path=/; max-age=31536000`;

    // Update state
    setCurrentWorkspaceId(workspaceId);

    // Get workspace details
    const workspace = availableWorkspaces.find((w) => w.id === workspaceId);
    setCurrentWorkspace(workspace || null);

    // Broadcast event for hooks to reload
    window.dispatchEvent(
      new CustomEvent('workspace-changed', {
        detail: { workspaceId },
      })
    );

    if (showToast) {
      // toast.success(`Agora você está em: ${workspace?.name}`);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [user]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspaceId,
        currentWorkspace,
        availableWorkspaces,
        loading,
        switchWorkspace,
        refreshWorkspaces: loadWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
```

### 2. Refatorar Hooks de Realtime

**Problema atual:** Cada hook busca `workspace_id` independentemente

**Solução:** Usar `useWorkspace()` para obter `currentWorkspaceId`

**Exemplo: `useRealtimePhotos.js`**

```javascript
// ANTES
const [workspaceId, setWorkspaceId] = useState(null);

useEffect(() => {
  const initAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      if (members) {
        setWorkspaceId(members.workspace_id);
      }
    }
  };
  initAuth();
}, [supabase]);

// DEPOIS
import { useWorkspace } from '@/contexts/WorkspaceContext';

const { currentWorkspaceId } = useWorkspace();

// Usar currentWorkspaceId diretamente nas queries
```

**Aplicar em todos os hooks:**

- `useRealtimePhotos.js`
- `useRealtimeMessages.js`
- `useRealtimeAchievements.js`
- `useRealtimePlaylist.js`
- `useNotificationPreferences.js`

### 3. Atualizar API Routes

#### 3.1. Nova API: `POST /api/workspaces/create`

```typescript
// app/api/workspaces/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Generate invite code
    const { data: codeData } = await supabase.rpc(
      'generate_unique_invite_code'
    );
    const inviteCode = codeData;

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: name.trim(),
        invite_code: inviteCode,
        creator_id: user.id,
        status: 'active',
      })
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // Add creator as member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'member',
      });

    if (memberError) throw memberError;

    return NextResponse.json({
      success: true,
      workspace,
      inviteCode,
    });
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### 3.2. Nova API: `POST /api/workspaces/join`

```typescript
// app/api/workspaces/join/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteCode } = await request.json();

    if (!inviteCode?.trim()) {
      return NextResponse.json(
        { error: 'Código é obrigatório' },
        { status: 400 }
      );
    }

    // Find workspace by invite code
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .in('status', ['active', 'disabled'])
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'Você já faz parte deste espaço' },
        { status: 400 }
      );
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'member',
      });

    if (memberError) throw memberError;

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error: any) {
    console.error('Error joining workspace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### 3.3. Nova API: `POST /api/workspaces/[id]/disable`

```typescript
// app/api/workspaces/[id]/disable/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.id;

    // Verify user is member
    const { data: member } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Disable workspace
    const { error: updateError } = await supabase
      .from('workspaces')
      .update({ status: 'disabled' })
      .eq('id', workspaceId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disabling workspace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### 3.4. Nova API: `POST /api/workspaces/[id]/enable`

(Similar ao disable, mas `status = 'active'`)

#### 3.5. Nova API: `POST /api/workspaces/[id]/leave`

```typescript
// app/api/workspaces/[id]/leave/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = params.id;

    // Check: is this the last workspace?
    const { count } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('left_at', null);

    if (count === 1) {
      return NextResponse.json(
        {
          error: 'Você deve ter pelo menos um espaço ativo',
        },
        { status: 400 }
      );
    }

    // Leave workspace
    const { error: updateError } = await supabase
      .from('workspace_members')
      .update({ left_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Trigger will auto-archive if last member

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error leaving workspace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 4. Atualizar Fluxo de Signup

**Arquivo:** `lib/api/auth.ts`

```typescript
// Adicionar parâmetro opcional inviteCode
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  inviteCode?: string
) {
  const supabase = createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) throw authError;

  const userId = authData.user?.id;
  if (!userId) throw new Error('User ID not found');

  // 2. Create profile (should be auto-created by trigger, but ensure)
  // ...

  // 3. Handle workspace
  if (inviteCode) {
    // Join existing workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .in('status', ['active', 'disabled'])
      .single();

    if (!workspaceError && workspace) {
      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'member',
      });
    }
  } else {
    // Create default workspace
    const inviteCodeGen = await generateUniqueInviteCode();

    const { data: newWorkspace, error: createError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Meu Espaço',
        invite_code: inviteCodeGen,
        creator_id: userId,
        status: 'active',
      })
      .select()
      .single();

    if (!createError && newWorkspace) {
      await supabase.from('workspace_members').insert({
        workspace_id: newWorkspace.id,
        user_id: userId,
        role: 'member',
      });
    }
  }

  return authData;
}
```

### 5. Desabilitar Trigger Antigo

**Migration:** `025_disable_auto_workspace_trigger.sql`

```sql
-- Desabilitar trigger que adiciona todos ao mesmo workspace
DROP TRIGGER IF EXISTS ensure_user_workspace ON public.profiles;
DROP FUNCTION IF EXISTS public.ensure_user_in_workspace();

-- Agora o signup manual cria workspaces conforme necessário
```

---

## 🎨 Mudanças Necessárias na UI

### 1. Novo Componente: `WorkspaceSwitcher`

**Arquivo:** `components/workspace/WorkspaceSwitcher.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Users, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspaceSwitcher() {
  const { currentWorkspace, availableWorkspaces, switchWorkspace } =
    useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-soft-sm"
      >
        <Users size={18} className="text-primary" />
        <span className="font-medium text-textPrimary">
          {currentWorkspace?.name || 'Selecione um espaço'}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-64 bg-white rounded-xl shadow-soft-lg overflow-hidden z-50"
          >
            {availableWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  switchWorkspace(workspace.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-surfaceAlt transition-colors ${
                  workspace.id === currentWorkspace?.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="font-medium text-textPrimary">
                  {workspace.name}
                </div>
                <div className="text-xs text-textSecondary">
                  {workspace.status === 'disabled' && '🔒 Desativado'}
                  {workspace.status === 'active' && `✅ Ativo`}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### 2. Nova Página: Gerenciamento de Espaços

**Arquivo:** `app/espacos/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Plus, Users, Lock, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function EspacosPage() {
  const {
    currentWorkspace,
    availableWorkspaces,
    switchWorkspace,
    refreshWorkspaces,
  } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const handleCreateWorkspace = async (name: string) => {
    try {
      const response = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success('Espaço criado!');
      refreshWorkspaces();
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-textPrimary mb-8">
            Meus Espaços
          </h1>

          {/* Current Workspace */}
          {currentWorkspace && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-textSecondary mb-1">
                    Espaço Atual
                  </div>
                  <h2 className="text-2xl font-bold text-textPrimary mb-2">
                    {currentWorkspace.name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {currentWorkspace.member_count} membros
                    </span>
                    {currentWorkspace.status === 'disabled' && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Lock size={14} />
                        Desativado
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopyInviteCode(currentWorkspace.invite_code)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl"
                >
                  <Copy size={16} />
                  {currentWorkspace.invite_code}
                </button>
              </div>
            </div>
          )}

          {/* Other Workspaces */}
          {availableWorkspaces.filter((w) => w.id !== currentWorkspace?.id)
            .length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Outros Espaços</h3>
              <div className="space-y-3">
                {availableWorkspaces
                  .filter((w) => w.id !== currentWorkspace?.id)
                  .map((workspace) => (
                    <div
                      key={workspace.id}
                      className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-textPrimary">
                          {workspace.name}
                        </div>
                        <div className="text-sm text-textSecondary">
                          {workspace.member_count} membros
                        </div>
                      </div>
                      <button
                        onClick={() => switchWorkspace(workspace.id)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition"
                      >
                        Selecionar
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-semibold"
            >
              <Plus size={20} />
              Criar Novo Espaço
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/80 text-textPrimary rounded-2xl font-semibold"
            >
              Entrar com Código
            </button>
          </div>
        </div>
      </div>

      {/* Modals... */}
    </ProtectedRoute>
  );
}
```

### 3. Atualizar Formulário de Signup

**Arquivo:** `app/auth/login/page.tsx` (adicionar toggle)

```tsx
// Adicionar state
const [hasInviteCode, setHasInviteCode] = useState(false);
const [inviteCode, setInviteCode] = useState('');

// No formulário
<div className="mb-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={hasInviteCode}
      onChange={(e) => setHasInviteCode(e.target.checked)}
    />
    <span>Tenho um código de convite</span>
  </label>
</div>;

{
  hasInviteCode && (
    <FormInput
      label="Código de Convite"
      name="inviteCode"
      placeholder="ABC123"
      value={inviteCode}
      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
    />
  );
}

// Passar para signUp()
await signUp(email, password, fullName, hasInviteCode ? inviteCode : undefined);
```

### 4. Adicionar Badge de "Somente Leitura"

**Em páginas de conteúdo (galeria, mensagens, etc.):**

```tsx
const { currentWorkspace } = useWorkspace();
const isReadOnly = currentWorkspace?.status === 'disabled';

return (
  <div>
    {isReadOnly && (
      <div className="bg-orange-100 border border-orange-300 rounded-xl p-3 mb-4 text-sm text-orange-800">
        🔒 Este espaço está desativado. Apenas visualização permitida.
      </div>
    )}

    {/* Botões de criar/editar devem ser disabled se isReadOnly */}
    <button
      disabled={isReadOnly}
      className={isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}
    >
      Adicionar Foto
    </button>
  </div>
);
```

### 5. Atualizar `BottomTabBar` para mostrar seletor de espaço

**Arquivo:** `components/BottomTabBar.jsx`

```jsx
// Adicionar ícone de workspace switcher
import { Users } from 'lucide-react';
import WorkspaceSwitcher from './workspace/WorkspaceSwitcher';

// No render, adicionar botão flutuante
<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
  <WorkspaceSwitcher />
</div>;
```

---

## 🔒 Segurança e RLS

### 1. Políticas RLS para `workspaces`

```sql
-- Migration: 026_update_workspace_rls.sql

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Creators can update own workspaces" ON workspaces;

-- Nova: Usuários veem workspaces dos quais são membros ativos
CREATE POLICY "Members can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Nova: Usuários podem criar workspaces
CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Nova: Membros podem atualizar nome/status do workspace
CREATE POLICY "Members can update workspace"
  ON workspaces FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
  )
  WITH CHECK (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Não permitir DELETE (usar status='archived')
-- Sem policy de DELETE = ninguém pode deletar
```

### 2. Políticas RLS para `content` (Atualizar)

```sql
-- Migration: 026_update_workspace_rls.sql (continuação)

-- Drop políticas antigas
DROP POLICY IF EXISTS "Members can view workspace content" ON content;
DROP POLICY IF EXISTS "Members can create content" ON content;
DROP POLICY IF EXISTS "Authors can update own content" ON content;
DROP POLICY IF EXISTS "Authors can delete own content" ON content;

-- Nova: Ver conteúdo apenas de workspaces ativos/disabled (não archived)
CREATE POLICY "Members can view content"
  ON content FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status IN ('active', 'disabled')
    )
  );

-- Nova: Criar conteúdo apenas em workspaces ATIVOS
CREATE POLICY "Members can create content in active workspaces"
  ON content FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status = 'active'  -- ◄── Apenas ACTIVE
    )
    AND author_id = auth.uid()
  );

-- Nova: Editar próprio conteúdo apenas em workspaces ATIVOS
CREATE POLICY "Authors can update own content in active workspaces"
  ON content FOR UPDATE
  USING (
    author_id = auth.uid()
    AND workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status = 'active'
    )
  )
  WITH CHECK (author_id = auth.uid());

-- Nova: Deletar próprio conteúdo apenas em workspaces ATIVOS
CREATE POLICY "Authors can delete own content in active workspaces"
  ON content FOR DELETE
  USING (
    author_id = auth.uid()
    AND workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status = 'active'
    )
  );
```

### 3. Políticas RLS para `reactions` (Atualizar)

```sql
-- Migration: 027_update_reactions_rls.sql

DROP POLICY IF EXISTS "Users can view reactions in their workspace" ON reactions;
DROP POLICY IF EXISTS "Users can create reactions in their workspace" ON reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON reactions;

-- Ver reações de conteúdo em workspaces ativos/disabled
CREATE POLICY "Members can view reactions"
  ON reactions FOR SELECT
  USING (
    content_id IN (
      SELECT c.id
      FROM content c
      INNER JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status IN ('active', 'disabled')
    )
  );

-- Criar reações apenas em workspaces ATIVOS
CREATE POLICY "Members can create reactions in active workspaces"
  ON reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND content_id IN (
      SELECT c.id
      FROM content c
      INNER JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status = 'active'  -- ◄── Apenas ACTIVE
    )
  );

-- Deletar próprias reações
CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE
  USING (user_id = auth.uid());

-- Editar próprias reações
CREATE POLICY "Users can update own reactions"
  ON reactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 4. Políticas RLS para `custom_emojis`

```sql
-- Migration: 028_update_custom_emojis_rls.sql

DROP POLICY IF EXISTS "Users can read own custom emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Users can insert own custom emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Users can update own custom emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Users can delete own custom emojis" ON custom_emojis;

-- Ver emojis do workspace
CREATE POLICY "Members can view workspace emojis"
  ON custom_emojis FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Criar emojis em workspaces ativos
CREATE POLICY "Members can create emojis in active workspaces"
  ON custom_emojis FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status = 'active'
    )
  );

-- Deletar próprios emojis
CREATE POLICY "Users can delete own emojis"
  ON custom_emojis FOR DELETE
  USING (user_id = auth.uid());

-- Atualizar próprios emojis
CREATE POLICY "Users can update own emojis"
  ON custom_emojis FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 5. Políticas RLS para `notification_preferences`

```sql
-- Migration: 029_update_notification_prefs_rls.sql

-- Já são seguras (user_id = auth.uid()), mas adicionar check de workspace

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
  );

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## 🔄 Plano de Migração de Dados

### Fase 1: Preparação (Sem Downtime)

**Objetivo:** Adicionar novas colunas e estruturas sem quebrar o existente

#### 1.1. Migration: `022_add_workspace_states.sql`

```sql
-- Executar ANTES de qualquer mudança de código

-- 1. Adicionar novos campos a workspaces
ALTER TABLE workspaces
  DROP CONSTRAINT IF EXISTS workspaces_status_check,
  ADD CONSTRAINT workspaces_status_check
    CHECK (status IN ('active', 'disabled', 'archived'));

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

-- 2. Tornar campos obsoletos nullable (já são)
-- secret_question, secret_answer_hash já são nullable

-- 3. Adicionar soft delete em workspace_members
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS left_reason TEXT;

-- 4. Criar função de geração de código
CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
  exists_check BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM workspaces WHERE invite_code = result) INTO exists_check;

    IF NOT exists_check THEN
      RETURN result;
    END IF;

    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique invite code';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger de auto-arquivamento
CREATE OR REPLACE FUNCTION auto_archive_empty_workspaces()
RETURNS TRIGGER AS $$
DECLARE
  active_members_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_members_count
  FROM workspace_members
  WHERE workspace_id = NEW.workspace_id
    AND left_at IS NULL;

  IF active_members_count = 0 THEN
    UPDATE workspaces
    SET status = 'archived',
        archived_at = NOW(),
        archived_by = NEW.user_id
    WHERE id = NEW.workspace_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_archive_on_last_member_exit
  AFTER UPDATE OF left_at ON workspace_members
  FOR EACH ROW
  WHEN (NEW.left_at IS NOT NULL AND OLD.left_at IS NULL)
  EXECUTE FUNCTION auto_archive_empty_workspaces();

-- 6. Criar indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_invite_code
  ON workspaces(invite_code) WHERE status != 'archived';

CREATE INDEX IF NOT EXISTS idx_workspace_members_active
  ON workspace_members(workspace_id, user_id) WHERE left_at IS NULL;
```

#### 1.2. Verificar Dados Existentes

```sql
-- Verificar workspace atual
SELECT * FROM workspaces WHERE name = 'Nosso Espaço';

-- Verificar membros
SELECT wm.*, p.full_name
FROM workspace_members wm
INNER JOIN profiles p ON p.id = wm.user_id
WHERE wm.workspace_id = (SELECT id FROM workspaces WHERE name = 'Nosso Espaço');

-- Verificar conteúdo
SELECT type, COUNT(*)
FROM content
WHERE workspace_id = (SELECT id FROM workspaces WHERE name = 'Nosso Espaço')
GROUP BY type;
```

**Checklist:**

- [ ] Workspace "Nosso Espaço" existe e está `active`
- [ ] 2 membros cadastrados (você e sua namorada)
- [ ] Todo conteúdo aponta para este workspace
- [ ] `invite_code` está gerado

### Fase 2: Atualizar Backend (Pode causar bugs temporários)

#### 2.1. Deploy de Código

**Ordem de deploy:**

1. **Criar `WorkspaceContext`**

   - Adicionar provider em `app/layout.jsx`
   - Ainda não usar nos hooks (manter compatibilidade)

2. **Criar APIs de workspace**

   - `/api/workspaces/create`
   - `/api/workspaces/join`
   - `/api/workspaces/[id]/disable`
   - `/api/workspaces/[id]/enable`
   - `/api/workspaces/[id]/leave`

3. **Atualizar RLS Policies** (Migration `026_update_workspace_rls.sql`)

   - ⚠️ **ATENÇÃO**: Isso pode bloquear acesso temporariamente
   - Fazer em horário de baixo uso
   - Ter rollback pronto

4. **Refatorar Hooks Gradualmente**

   - Um hook por vez
   - Testar após cada mudança
   - Começar por `useRealtimePhotos`

5. **Atualizar UI**
   - Adicionar `WorkspaceSwitcher` (inicialmente oculto)
   - Criar página `/espacos` (acessível mas não linkada)
   - Adicionar toggle de convite no signup

### Fase 3: Cleanup (Após tudo estável)

#### 3.1. Remover Código Obsoleto

```sql
-- Migration: 030_cleanup_obsolete_fields.sql

-- Remover campos não utilizados de workspaces
ALTER TABLE workspaces
  DROP COLUMN IF EXISTS secret_question,
  DROP COLUMN IF EXISTS secret_answer_hash,
  DROP COLUMN IF EXISTS partner_id,
  DROP COLUMN IF EXISTS max_attempts,
  DROP COLUMN IF EXISTS current_attempts;

-- Desabilitar trigger antigo
DROP TRIGGER IF EXISTS ensure_user_workspace ON public.profiles;
DROP FUNCTION IF EXISTS public.ensure_user_in_workspace();

-- Simplificar role em workspace_members
UPDATE workspace_members SET role = 'member' WHERE role IN ('creator', 'partner');

ALTER TABLE workspace_members
  DROP CONSTRAINT IF EXISTS workspace_members_role_check,
  ADD CONSTRAINT workspace_members_role_check
    CHECK (role IN ('member'));
```

### Fase 4: Testar Cenários Críticos

#### 4.1. Testes Funcionais

**Cenário 1: Workspace Existente**

- [ ] Login como você → workspace "Nosso Espaço" carrega
- [ ] Login como namorada → mesmo workspace carrega
- [ ] Visualizar fotos/mensagens → tudo visível
- [ ] Adicionar conteúdo → salva no workspace correto
- [ ] Trocar para outro workspace (se existir) → dados recarregam

**Cenário 2: Novo Usuário SEM Convite**

- [ ] Signup sem código → cria workspace padrão "Meu Espaço"
- [ ] Redireciona para home
- [ ] Workspace switcher mostra 1 espaço
- [ ] Usuário pode criar conteúdo normalmente

**Cenário 3: Novo Usuário COM Convite**

- [ ] Copiar código de convite do workspace "Nosso Espaço"
- [ ] Signup com código → entra no workspace
- [ ] Ver conteúdo existente (fotos/mensagens do casal)
- [ ] Criar novo conteúdo → salva no workspace compartilhado

**Cenário 4: Desativar Workspace**

- [ ] Desativar workspace → status = 'disabled'
- [ ] Visualização funciona normalmente
- [ ] Botões de criar/editar desabilitados
- [ ] Reativar → botões voltam a funcionar

**Cenário 5: Sair de Workspace**

- [ ] Tentar sair do último workspace → bloqueado com erro
- [ ] Criar segundo workspace → sair do primeiro → OK
- [ ] Workspace sem membros → auto-arquivado

### Rollback Plan

**Se algo der errado:**

#### Rollback 1: Reverter RLS Policies

```sql
-- Restaurar policies antigas (copiar de migration 001)
-- Executar migration de rollback pré-preparada
```

#### Rollback 2: Reverter Código

```bash
# Fazer rollback do deploy
git revert <commit>
git push
# Redeploy versão anterior
```

#### Rollback 3: Dados Corrompidos

```sql
-- Caso workspaces tenham sido criados erroneamente
DELETE FROM workspaces WHERE id NOT IN (
  SELECT id FROM workspaces WHERE name = 'Nosso Espaço'
);

-- Caso membros tenham saído acidentalmente
UPDATE workspace_members SET left_at = NULL WHERE left_at IS NOT NULL;
```

---

## ✅ Checklist Técnico

### Banco de Dados

- [ ] **Migration 022:** Adicionar campos `archived_at`, `archived_by`, `left_at` a tabelas
- [ ] **Migration 022:** Atualizar ENUM `status` para incluir 'disabled', 'archived'
- [ ] **Migration 022:** Criar função `generate_unique_invite_code()`
- [ ] **Migration 022:** Criar trigger `auto_archive_empty_workspaces()`
- [ ] **Migration 023:** Adicionar `workspace_id` e `notify_all_workspaces` a `notification_preferences`
- [ ] **Migration 024:** Adicionar `workspace_id` a `custom_emojis`
- [ ] **Migration 025:** Desabilitar trigger `ensure_user_in_workspace()`
- [ ] **Migration 026:** Atualizar RLS policies de `workspaces`
- [ ] **Migration 026:** Atualizar RLS policies de `content` (bloquear write em disabled)
- [ ] **Migration 027:** Atualizar RLS policies de `reactions`
- [ ] **Migration 028:** Atualizar RLS policies de `custom_emojis`
- [ ] **Migration 029:** Atualizar RLS policies de `notification_preferences`
- [ ] **Migration 030:** Cleanup de campos obsoletos

### Backend / API

- [ ] Criar `contexts/WorkspaceContext.tsx`
- [ ] Adicionar `WorkspaceProvider` em `app/layout.jsx`
- [ ] Criar `app/api/workspaces/create/route.ts`
- [ ] Criar `app/api/workspaces/join/route.ts`
- [ ] Criar `app/api/workspaces/[id]/disable/route.ts`
- [ ] Criar `app/api/workspaces/[id]/enable/route.ts`
- [ ] Criar `app/api/workspaces/[id]/leave/route.ts`
- [ ] Atualizar `lib/api/auth.ts` → adicionar parâmetro `inviteCode` em `signUp()`
- [ ] Atualizar `lib/api/workspace.ts` → adicionar funções de disable/enable/leave
- [ ] Refatorar `hooks/useRealtimePhotos.js` → usar `useWorkspace()`
- [ ] Refatorar `hooks/useRealtimeMessages.js` → usar `useWorkspace()`
- [ ] Refatorar `hooks/useRealtimeAchievements.js` → usar `useWorkspace()`
- [ ] Refatorar `hooks/useRealtimePlaylist.js` → usar `useWorkspace()`
- [ ] Refatorar `hooks/useNotificationPreferences.js` → suportar workspace_id
- [ ] Atualizar lógica de push notifications → verificar `notify_all_workspaces`

### UI / Componentes

- [ ] Criar `components/workspace/WorkspaceSwitcher.tsx`
- [ ] Criar `components/workspace/CreateWorkspaceModal.tsx`
- [ ] Criar `components/workspace/JoinWorkspaceModal.tsx`
- [ ] Criar `app/espacos/page.tsx` (Gerenciamento de Espaços)
- [ ] Atualizar `app/auth/login/page.tsx` → adicionar toggle "Tenho código de convite"
- [ ] Atualizar `components/BottomTabBar.jsx` → adicionar link para /espacos
- [ ] Adicionar badge "Somente Leitura" em páginas quando workspace disabled
- [ ] Desabilitar botões de criar/editar quando workspace disabled
- [ ] Adicionar `WorkspaceSwitcher` no header/navbar

### Testes

- [ ] Testar signup SEM convite → cria workspace padrão
- [ ] Testar signup COM convite → entra no workspace correto
- [ ] Testar login → carrega último workspace usado
- [ ] Testar trocar de workspace → dados recarregam corretamente
- [ ] Testar criar workspace → gera invite_code único
- [ ] Testar desativar workspace → bloqueia escrita
- [ ] Testar reativar workspace → libera escrita
- [ ] Testar sair do último workspace → bloqueado com erro
- [ ] Testar sair de workspace (tendo outros) → auto-arquiva se último membro
- [ ] Testar RLS: usuário A não vê conteúdo de workspace B
- [ ] Testar RLS: usuário não consegue escrever em workspace disabled
- [ ] Testar notificações: `notify_all_workspaces = true` → recebe de todos
- [ ] Testar notificações: `notify_all_workspaces = false` → recebe apenas do atual

### Documentação

- [ ] Atualizar `CLAUDE.md` com novo modelo de workspaces
- [ ] Atualizar `README.md` com instruções de convite
- [ ] Criar guia de usuário: "Como criar um espaço"
- [ ] Criar guia de usuário: "Como convidar alguém"

---

## ⚠️ Riscos e Edge Cases

### Riscos Técnicos

#### 1. RLS Policies Complexas

**Risco:** Policies com JOINs podem ter performance ruim

- **Mitigação:** Criar indexes adequados (`idx_workspace_members_active`)
- **Monitorar:** Queries lentas via Supabase Dashboard

#### 2. Migração de Dados

**Risco:** Dados corrompidos durante migration

- **Mitigação:** Backup completo antes de cada migration
- **Rollback:** Script SQL de rollback preparado

#### 3. Conflito de Context

**Risco:** `WorkspaceContext` carrega antes de `AuthContext`

- **Mitigação:** `WorkspaceProvider` dentro de `AuthProvider`
- **Ordem:**
  ```tsx
  <AuthProvider>
    <WorkspaceProvider>{children}</WorkspaceProvider>
  </AuthProvider>
  ```

#### 4. Cache de Workspace

**Risco:** Cookie desatualizado após sair de workspace

- **Mitigação:** Sempre validar cookie contra memberships reais
- **Fallback:** Se workspace inválido, usar primeiro disponível

### Edge Cases

#### Edge Case 1: Usuário Sem Workspaces

**Cenário:** Usuário saiu de todos os workspaces (bug ou hack)

**Comportamento esperado:**

- Bloquear saída do último workspace (validação no backend)
- Se acontecer: auto-criar workspace padrão no próximo login

**Código:**

```typescript
// No WorkspaceContext, ao carregar workspaces
if (workspaces.length === 0) {
  // Auto-criar workspace padrão
  await fetch('/api/workspaces/create', {
    method: 'POST',
    body: JSON.stringify({ name: 'Meu Espaço' }),
  });
  await loadWorkspaces();
}
```

#### Edge Case 2: Código de Convite Duplicado

**Cenário:** Geração de código falha e cria duplicata

**Mitigação:**

- Constraint UNIQUE em `invite_code`
- Função `generate_unique_invite_code()` faz até 10 tentativas
- Se falhar após 10 tentativas, lançar exception

#### Edge Case 3: Workspace Arquivado com Conteúdo

**Cenário:** Workspace foi arquivado mas tem muito conteúdo

**Comportamento:**

- Dados permanecem no banco (audit)
- RLS bloqueia visualização via UI
- Admin pode restaurar via SQL:
  ```sql
  UPDATE workspaces SET status = 'active', archived_at = NULL WHERE id = '...';
  ```

#### Edge Case 4: Último Membro Sai Enquanto Outro Está Online

**Cenário:** User A está vendo conteúdo, User B sai → workspace arquiva

**Comportamento:**

- Realtime subscription de User A detecta mudança de status
- UI mostra toast: "Este espaço foi arquivado"
- Redireciona User A para outro workspace

**Código:**

```typescript
// Ouvir mudanças de workspace via Realtime
const channel = supabase
  .channel('workspace-status')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'workspaces',
      filter: `id=eq.${currentWorkspaceId}`,
    },
    (payload) => {
      if (payload.new.status === 'archived') {
        toast.error('Este espaço foi arquivado');
        // Switch para outro workspace
        const otherWorkspace = availableWorkspaces.find(
          (w) => w.id !== currentWorkspaceId
        );
        if (otherWorkspace) {
          switchWorkspace(otherWorkspace.id);
        }
      }
    }
  )
  .subscribe();
```

#### Edge Case 5: Convite para Workspace Desativado

**Cenário:** User A desativa workspace, User B tenta entrar com código

**Comportamento:**

- Permitir entrada (workspace disabled ainda aceita membros)
- User B entra mas vê badge "Desativado"
- Qualquer membro pode reativar

**Validação:**

```sql
-- Na API /api/workspaces/join
WHERE invite_code = $1
  AND status IN ('active', 'disabled')  -- ✅ Ambos permitidos
```

#### Edge Case 6: Notificação Durante Troca de Workspace

**Cenário:** User troca de workspace A → B, chega notificação de A

**Comportamento:**

- Se `notify_all_workspaces = false`: notificação é enviada mas pode não ser relevante
- UI mostra notificação com indicação: "Em: {workspace_name}"

**Código:**

```typescript
// No push notification payload
{
  title: 'Nova foto!',
  body: 'Em: Nosso Espaço',
  data: {
    workspaceId: '...',
    workspaceName: 'Nosso Espaço',
  }
}
```

#### Edge Case 7: Emoji Personalizado em Workspace Desativado

**Cenário:** Workspace tem emojis personalizados, é desativado

**Comportamento:**

- Emojis ainda visíveis (para ver reações antigas)
- Não é possível adicionar novos emojis (RLS bloqueia INSERT)

#### Edge Case 8: Migração com Múltiplos Dispositivos Online

**Cenário:** Você e namorada estão online durante deploy

**Comportamento:**

- RLS pode causar erro temporário "permission denied"
- Frontend deve tratar erro gracefully
- Mostrar toast: "Atualizando, recarregue a página"

**Código:**

```typescript
// Em hooks de Realtime
.catch(error => {
  if (error.code === 'PGRST301' || error.message.includes('permission')) {
    toast.error('Aplicação foi atualizada. Recarregue a página.', {
      action: {
        label: 'Recarregar',
        onClick: () => window.location.reload(),
      },
    });
  }
});
```

---

## 📅 Cronograma Sugerido

### Semana 1: Preparação

**Dia 1-2: Migrations**

- [ ] Criar todas as migrations (022 a 030)
- [ ] Testar migrations em ambiente de dev local
- [ ] Fazer backup completo do banco de produção
- [ ] Aplicar migrations 022-025 em produção (preparação)

**Dia 3-4: Backend Core**

- [ ] Criar `WorkspaceContext`
- [ ] Criar APIs de workspace
- [ ] Atualizar `lib/api/auth.ts` com suporte a `inviteCode`

**Dia 5-7: Testes Backend**

- [ ] Testar signup sem convite → cria workspace padrão
- [ ] Testar signup com convite → entra no workspace
- [ ] Testar APIs de criar/join/disable/enable/leave

### Semana 2: UI e Integração

**Dia 1-2: Componentes de Workspace**

- [ ] Criar `WorkspaceSwitcher`
- [ ] Criar página `/espacos`
- [ ] Cria área de cadastro (signup)
- [ ] Criar modais de criar/join

**Dia 3-4: Refatorar Hooks**

- [ ] Refatorar todos os hooks de Realtime
- [ ] Testar carregamento de dados com troca de workspace

**Dia 5-7: UI de Estado Disabled**

- [ ] Adicionar badges "Somente Leitura"
- [ ] Desabilitar botões de criar/editar
- [ ] Adicionar fluxos de desativar/reativar

### Semana 3: RLS e Segurança

**Dia 1-2: Aplicar RLS Policies**

- [ ] **⚠️ ATENÇÃO:** Backup antes de aplicar
- [ ] Aplicar migrations 026-029 (RLS)
- [ ] Testar isolamento entre workspaces

**Dia 3-4: Testes de Segurança**

- [ ] Testar que User A não vê workspace de User B
- [ ] Testar que escrita em workspace disabled falha
- [ ] Testar que workspace archived não aparece

**Dia 5-7: Polimento**

- [ ] Melhorar mensagens de erro
- [ ] Adicionar loading states
- [ ] Adicionar animações de transição

### Semana 4: Testes Finais e Deploy

**Dia 1-3: Testes E2E**

- [ ] Executar todos os cenários do checklist
- [ ] Testar em múltiplos dispositivos
- [ ] Testar troca de workspace em tempo real

**Dia 4-5: Documentação**

- [ ] Atualizar `CLAUDE.md`
- [ ] Criar guias de usuário
- [ ] Documentar APIs

**Dia 6-7: Deploy e Monitoramento**

- [ ] Deploy final em produção
- [ ] Monitorar erros (Sentry/logs)
- [ ] Estar disponível para hotfixes

---

## 🎯 Resumo das Decisões Técnicas Principais

### 1. Armazenamento de `currentWorkspaceId`

**Decisão:** Cookie + Context (não coluna em `profiles`)

- **Prós:** Mais flexível, não polui banco
- **Contras:** Requer lógica de sincronização

### 2. Modelo de Saída de Workspace

**Decisão:** Soft delete (coluna `left_at`)

- **Prós:** Histórico, auditoria, possibilidade de re-adicionar
- **Contras:** Queries precisam filtrar `left_at IS NULL`

### 3. Estados de Workspace

**Decisão:** ENUM com 3 valores ('active', 'disabled', 'archived')

- **active:** Leitura + escrita
- **disabled:** Apenas leitura (RLS bloqueia write)
- **archived:** Não aparece na UI (RLS bloqueia tudo)

### 4. Roles em `workspace_members`

**Decisão:** Simplificar para apenas 'member' (sem 'creator' vs 'partner')

- **Todos têm permissões iguais** (democrático)
- **Criador** é apenas `workspaces.creator_id` (metadata)

### 5. Emojis Personalizados

**Decisão:** Por workspace (não por usuário)

- **Compartilhados entre membros** do workspace
- `user_id` mantém autoria, mas todos podem usar

### 6. Notificações

**Decisão:** Preferências por (user + workspace) + flag global

- **Por padrão:** Apenas workspace atual
- **Opcional:** `notify_all_workspaces = true` → recebe de todos

### 7. Signup com Convite

**Decisão:** NÃO criar workspace padrão se entrou via convite

- **Prós:** Menos confusão (1 workspace inicial)
- **Contras:** Se sair, fica sem workspace (mitigado por validação)

### 8. Invite Code

**Decisão:** 6 caracteres alfanuméricos, sem expiração

- **Fácil de compartilhar** (via WhatsApp, etc.)
- **Revogar:** Gerar novo código (feature futura)

---

## 📞 Próximos Passos

1. **Revisar este documento** com você (usuário)

   - Validar decisões técnicas
   - Aprovar cronograma
   - Esclarecer dúvidas

2. **Criar branch de desenvolvimento**

   ```bash
   git checkout -b feature/multi-workspace
   ```

3. **Começar pela Semana 1** (Migrations + Backend Core)

4. **Testes contínuos** a cada etapa

5. **Deploy incremental** (fase a fase)

---

**Fim do Planejamento**

Este documento é um **plano vivo** e deve ser atualizado conforme a implementação avança. Qualquer decisão de design que mude durante o desenvolvimento deve ser documentada aqui.

**Dúvidas ou sugestões:** Revisar e atualizar este documento antes de prosseguir com implementação.

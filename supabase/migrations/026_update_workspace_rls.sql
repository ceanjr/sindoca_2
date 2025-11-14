-- Migration 026: Update RLS policies for workspaces and content
-- Description: Atualiza políticas de segurança para suportar múltiplos workspaces e estados
-- Date: 2025-11-14
-- ⚠️ ATENÇÃO: Esta migration pode causar downtime temporário

-- ========================================
-- 1. RLS Policies para WORKSPACES
-- ========================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Creators can update own workspaces" ON workspaces;

-- Nova: Usuários veem workspaces dos quais são membros ativos (não arquivados)
CREATE POLICY "Members can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
    AND status != 'archived'  -- Não mostrar arquivados na UI
  );

-- Nova: Usuários podem criar workspaces
CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Nova: Membros podem atualizar workspace (nome, status)
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

-- Não permitir DELETE de workspaces (usar status='archived')

-- ========================================
-- 2. RLS Policies para CONTENT
-- ========================================

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

-- ========================================
-- 3. RLS Policies para WORKSPACE_MEMBERS
-- ========================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "System can insert workspace members" ON workspace_members;

-- Nova: Ver membros de workspaces dos quais faz parte
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Nova: Sistema pode adicionar membros (via API com autenticação)
CREATE POLICY "Authenticated users can join workspaces"
  ON workspace_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()  -- Só pode adicionar a si mesmo
  );

-- Nova: Usuário pode sair de workspace (soft delete)
CREATE POLICY "Users can leave workspaces"
  ON workspace_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

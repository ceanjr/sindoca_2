-- Migration 027: Update RLS policies for reactions
-- Description: Atualiza políticas para respeitar estados de workspace
-- Date: 2025-11-14

-- ========================================
-- 1. RLS Policies para REACTIONS
-- ========================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view reactions in their workspace" ON reactions;
DROP POLICY IF EXISTS "Users can create reactions in their workspace" ON reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON reactions;
DROP POLICY IF EXISTS "Members can view reactions" ON reactions;
DROP POLICY IF EXISTS "Members can create reactions in active workspaces" ON reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON reactions;

-- Nova: Ver reações de conteúdo em workspaces ativos/disabled
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

-- Nova: Criar reações apenas em workspaces ATIVOS
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

-- Nova: Deletar próprias reações
CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE
  USING (user_id = auth.uid());

-- Nova: Editar próprias reações (apenas em workspaces ativos)
CREATE POLICY "Users can update own reactions in active workspaces"
  ON reactions FOR UPDATE
  USING (
    user_id = auth.uid()
    AND content_id IN (
      SELECT c.id
      FROM content c
      INNER JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status = 'active'
    )
  )
  WITH CHECK (user_id = auth.uid());

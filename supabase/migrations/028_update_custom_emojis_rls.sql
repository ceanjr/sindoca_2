-- Migration 028: Update RLS policies for custom emojis
-- Description: Emojis são compartilhados no workspace, políticas respeitam estados
-- Date: 2025-11-14

-- ========================================
-- 1. RLS Policies para CUSTOM_EMOJIS
-- ========================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can read own custom emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Users can insert own custom emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Users can update own custom emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Users can delete own custom emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Members can view workspace emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Members can create emojis in active workspaces" ON custom_emojis;
DROP POLICY IF EXISTS "Users can delete own emojis" ON custom_emojis;
DROP POLICY IF EXISTS "Users can update own emojis" ON custom_emojis;

-- Nova: Ver emojis do workspace (compartilhados entre membros)
CREATE POLICY "Members can view workspace emojis"
  ON custom_emojis FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
    )
  );

-- Nova: Criar emojis em workspaces ativos
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

-- Nova: Deletar emojis que criou (ou qualquer membro pode deletar?)
-- Decisão: Apenas quem criou pode deletar
CREATE POLICY "Users can delete own emojis"
  ON custom_emojis FOR DELETE
  USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
        AND w.status = 'active'
    )
  );

-- Nova: Atualizar last_used_at (qualquer membro pode)
CREATE POLICY "Members can update emoji usage"
  ON custom_emojis FOR UPDATE
  USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.left_at IS NULL
    )
  );

-- Migration 029: Update RLS policies for notification preferences
-- Description: Políticas para preferências por workspace
-- Date: 2025-11-14

-- ========================================
-- 1. RLS Policies para NOTIFICATION_PREFERENCES
-- ========================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;

-- Nova: Ver próprias preferências
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Nova: Criar preferências (com validação de workspace)
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

-- Nova: Atualizar próprias preferências
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Nova: Deletar próprias preferências
CREATE POLICY "Users can delete own notification preferences"
  ON notification_preferences FOR DELETE
  USING (user_id = auth.uid());

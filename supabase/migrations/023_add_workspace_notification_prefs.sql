-- Migration 023: Add workspace support to notification preferences
-- Description: Adiciona workspace_id e notify_all_workspaces às preferências de notificação
-- Date: 2025-11-14

-- ========================================
-- 1. Adicionar workspace_id à tabela
-- ========================================

-- Primeiro, adicionar coluna (nullable por enquanto)
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Adicionar flag global
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS notify_all_workspaces BOOLEAN DEFAULT false;

COMMENT ON COLUMN notification_preferences.workspace_id IS 'Workspace ao qual esta preferência se aplica';
COMMENT ON COLUMN notification_preferences.notify_all_workspaces IS 'Se true, recebe notificações de TODOS os workspaces do usuário';

-- ========================================
-- 2. Migrar dados existentes
-- ========================================

-- Para cada usuário, associar preferências ao workspace atual
DO $$
DECLARE
  pref_record RECORD;
  user_workspace_id UUID;
BEGIN
  FOR pref_record IN
    SELECT user_id FROM notification_preferences WHERE workspace_id IS NULL
  LOOP
    -- Pegar primeiro workspace do usuário (workspace existente)
    SELECT workspace_id INTO user_workspace_id
    FROM workspace_members
    WHERE user_id = pref_record.user_id
      AND left_at IS NULL
    LIMIT 1;

    -- Se encontrou workspace, atualizar
    IF user_workspace_id IS NOT NULL THEN
      UPDATE notification_preferences
      SET workspace_id = user_workspace_id
      WHERE user_id = pref_record.user_id
        AND workspace_id IS NULL;

      RAISE NOTICE 'Migrated notification prefs for user % to workspace %',
        pref_record.user_id, user_workspace_id;
    END IF;
  END LOOP;
END $$;

-- ========================================
-- 3. Atualizar constraints
-- ========================================

-- Remover PK antiga (se existir como single column)
ALTER TABLE notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_pkey;

-- Tornar workspace_id NOT NULL agora que migramos os dados
ALTER TABLE notification_preferences
  ALTER COLUMN workspace_id SET NOT NULL;

-- Criar nova PK composta (user_id + workspace_id)
ALTER TABLE notification_preferences
  ADD CONSTRAINT notification_preferences_pkey
    PRIMARY KEY (user_id, workspace_id);

-- ========================================
-- 4. Criar indexes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user
  ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_workspace
  ON notification_preferences(workspace_id);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_global
  ON notification_preferences(user_id)
  WHERE notify_all_workspaces = true;

-- ========================================
-- 5. Atualizar função de criação automática
-- ========================================

-- Atualizar função para criar prefs quando usuário entra em workspace
CREATE OR REPLACE FUNCTION create_notification_prefs_for_workspace()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar preferências padrão para o novo membro do workspace
  INSERT INTO notification_preferences (
    user_id,
    workspace_id,
    push_enabled,
    notify_new_music,
    notify_new_photos,
    notify_new_reasons,
    notify_all_workspaces,
    daily_reminder_enabled
  )
  VALUES (
    NEW.user_id,
    NEW.workspace_id,
    false,  -- Push desabilitado por padrão
    true,   -- Notificações de conteúdo ativadas
    true,
    true,
    false,  -- Apenas workspace atual
    false   -- Daily reminder desabilitado
  )
  ON CONFLICT (user_id, workspace_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_notification_prefs_for_workspace() IS 'Cria preferências de notificação quando usuário entra em workspace';

-- Criar trigger
DROP TRIGGER IF EXISTS on_workspace_member_added_create_prefs ON workspace_members;

CREATE TRIGGER on_workspace_member_added_create_prefs
  AFTER INSERT ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_prefs_for_workspace();

-- ========================================
-- 6. Criar preferências para membros existentes
-- ========================================

-- Para cada membro de workspace que não tem preferências
INSERT INTO notification_preferences (
  user_id,
  workspace_id,
  push_enabled,
  notify_all_workspaces
)
SELECT
  wm.user_id,
  wm.workspace_id,
  false,  -- Push desabilitado por padrão
  false   -- Apenas workspace atual
FROM workspace_members wm
WHERE wm.left_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM notification_preferences np
    WHERE np.user_id = wm.user_id
      AND np.workspace_id = wm.workspace_id
  )
ON CONFLICT (user_id, workspace_id) DO NOTHING;

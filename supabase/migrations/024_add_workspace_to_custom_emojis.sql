-- Migration 024: Add workspace support to custom emojis
-- Description: Emojis personalizados são compartilhados no workspace (não privados por usuário)
-- Date: 2025-11-14

-- ========================================
-- 1. Adicionar workspace_id à tabela
-- ========================================

ALTER TABLE custom_emojis
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

COMMENT ON COLUMN custom_emojis.workspace_id IS 'Workspace ao qual este emoji pertence (compartilhado entre membros)';

-- ========================================
-- 2. Migrar dados existentes
-- ========================================

-- Para cada emoji, associar ao workspace do usuário criador
DO $$
DECLARE
  emoji_record RECORD;
  user_workspace_id UUID;
BEGIN
  FOR emoji_record IN
    SELECT id, user_id FROM custom_emojis WHERE workspace_id IS NULL
  LOOP
    -- Pegar primeiro workspace do usuário
    SELECT workspace_id INTO user_workspace_id
    FROM workspace_members
    WHERE user_id = emoji_record.user_id
      AND left_at IS NULL
    LIMIT 1;

    -- Se encontrou workspace, atualizar
    IF user_workspace_id IS NOT NULL THEN
      UPDATE custom_emojis
      SET workspace_id = user_workspace_id
      WHERE id = emoji_record.id;

      RAISE NOTICE 'Migrated custom emoji % to workspace %',
        emoji_record.id, user_workspace_id;
    ELSE
      -- Se não encontrou workspace, deletar emoji órfão
      DELETE FROM custom_emojis WHERE id = emoji_record.id;
      RAISE NOTICE 'Deleted orphan emoji %', emoji_record.id;
    END IF;
  END LOOP;
END $$;

-- ========================================
-- 3. Atualizar constraints
-- ========================================

-- Tornar workspace_id NOT NULL
ALTER TABLE custom_emojis
  ALTER COLUMN workspace_id SET NOT NULL;

-- Remover constraint antiga (emoji único por usuário)
ALTER TABLE custom_emojis
  DROP CONSTRAINT IF EXISTS custom_emojis_user_id_emoji_key;

-- Nova constraint: emoji único por workspace
ALTER TABLE custom_emojis
  DROP CONSTRAINT IF EXISTS custom_emojis_workspace_emoji_unique;

ALTER TABLE custom_emojis
  ADD CONSTRAINT custom_emojis_workspace_emoji_unique
    UNIQUE(workspace_id, emoji);

-- ========================================
-- 4. Criar indexes
-- ========================================

CREATE INDEX IF NOT EXISTS idx_custom_emojis_workspace
  ON custom_emojis(workspace_id);

CREATE INDEX IF NOT EXISTS idx_custom_emojis_workspace_last_used
  ON custom_emojis(workspace_id, last_used_at DESC);

-- ========================================
-- 5. Atualizar função de limpeza
-- ========================================

-- Função atualizada para limpar por workspace
CREATE OR REPLACE FUNCTION delete_unused_custom_emojis_by_workspace()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar emojis não usados em 30 dias (aumentado de 7 para 30)
  DELETE FROM custom_emojis
  WHERE last_used_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE 'Deleted % unused custom emojis', deleted_count;
  END IF;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_unused_custom_emojis_by_workspace() IS 'Deleta emojis personalizados não usados em 30 dias';

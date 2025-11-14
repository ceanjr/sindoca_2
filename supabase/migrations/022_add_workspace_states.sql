-- Migration 022: Add workspace states and multi-workspace support
-- Description: Adiciona estados de workspace (active, disabled, archived) e suporte para múltiplos espaços
-- Date: 2025-11-14

-- ========================================
-- 1. Atualizar ENUM de status em workspaces
-- ========================================

ALTER TABLE workspaces
  DROP CONSTRAINT IF EXISTS workspaces_status_check;

ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_status_check
    CHECK (status IN ('active', 'disabled', 'archived'));

-- ========================================
-- 2. Adicionar colunas de arquivamento
-- ========================================

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN workspaces.archived_at IS 'Data em que o workspace foi arquivado (quando último membro sai)';
COMMENT ON COLUMN workspaces.archived_by IS 'ID do último usuário que saiu, causando o arquivamento';

-- ========================================
-- 3. Adicionar soft delete em workspace_members
-- ========================================

ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS left_reason TEXT;

COMMENT ON COLUMN workspace_members.left_at IS 'Data em que o usuário saiu do workspace (soft delete)';
COMMENT ON COLUMN workspace_members.left_reason IS 'Motivo opcional da saída';

-- ========================================
-- 4. Atualizar comentários de colunas existentes
-- ========================================

COMMENT ON COLUMN workspaces.invite_code IS 'Código único para convidar membros (ex: ABC123). Não expira.';
COMMENT ON COLUMN workspaces.secret_question IS 'DEPRECATED - Usar apenas invite_code para convites';
COMMENT ON COLUMN workspaces.secret_answer_hash IS 'DEPRECATED - Usar apenas invite_code para convites';

-- ========================================
-- 5. Criar função de geração de código único
-- ========================================

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

COMMENT ON FUNCTION generate_unique_invite_code() IS 'Gera código único de 6 caracteres para convite de workspace';

-- ========================================
-- 6. Criar trigger de auto-arquivamento
-- ========================================

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

  -- Se não há membros ativos, arquivar workspace
  IF active_members_count = 0 THEN
    UPDATE workspaces
    SET status = 'archived',
        archived_at = NOW(),
        archived_by = NEW.user_id
    WHERE id = NEW.workspace_id;

    RAISE NOTICE 'Workspace % archived (no active members)', NEW.workspace_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_archive_empty_workspaces() IS 'Arquiva automaticamente workspace quando último membro sai';

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_archive_on_last_member_exit ON workspace_members;

CREATE TRIGGER trigger_archive_on_last_member_exit
  AFTER UPDATE OF left_at ON workspace_members
  FOR EACH ROW
  WHEN (NEW.left_at IS NOT NULL AND OLD.left_at IS NULL)
  EXECUTE FUNCTION auto_archive_empty_workspaces();

-- ========================================
-- 7. Criar indexes para performance
-- ========================================

-- Index para busca por código de convite (excluindo arquivados)
CREATE INDEX IF NOT EXISTS idx_workspaces_invite_code
  ON workspaces(invite_code)
  WHERE status != 'archived';

-- Index para workspaces arquivados
CREATE INDEX IF NOT EXISTS idx_workspaces_archived
  ON workspaces(archived_at)
  WHERE status = 'archived';

-- Index para membros ativos (usado em queries frequentes)
CREATE INDEX IF NOT EXISTS idx_workspace_members_active
  ON workspace_members(workspace_id, user_id)
  WHERE left_at IS NULL;

-- Index para buscar workspaces de um usuário
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_active
  ON workspace_members(user_id)
  WHERE left_at IS NULL;

-- Index para status de workspace
CREATE INDEX IF NOT EXISTS idx_workspaces_status
  ON workspaces(status);

-- ========================================
-- 8. Garantir que workspace existente está OK
-- ========================================

-- Atualizar workspace existente para garantir que está 'active'
UPDATE workspaces
SET status = 'active'
WHERE status = 'pending';

-- Garantir que invite_code existe em todos os workspaces
DO $$
DECLARE
  workspace_record RECORD;
  new_code TEXT;
BEGIN
  FOR workspace_record IN
    SELECT id FROM workspaces WHERE invite_code IS NULL OR invite_code = ''
  LOOP
    new_code := generate_unique_invite_code();
    UPDATE workspaces
    SET invite_code = new_code
    WHERE id = workspace_record.id;

    RAISE NOTICE 'Generated invite code % for workspace %', new_code, workspace_record.id;
  END LOOP;
END $$;

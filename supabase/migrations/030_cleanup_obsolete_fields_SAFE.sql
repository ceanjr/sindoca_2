-- Migration 030: Cleanup obsolete fields and simplify schema (SAFE VERSION)
-- Description: Remove campos não utilizados mas mantém compatibilidade com roles antigos
-- Date: 2025-11-14
-- ⚠️ Esta é a versão SEGURA - mantém 'creator' e 'partner' temporariamente

-- ========================================
-- 1. Manter roles existentes (compatibilidade)
-- ========================================

-- Atualizar constraint para aceitar todos os roles
ALTER TABLE workspace_members
  DROP CONSTRAINT IF EXISTS workspace_members_role_check;

ALTER TABLE workspace_members
  ADD CONSTRAINT workspace_members_role_check
    CHECK (role IN ('member', 'creator', 'partner'));

COMMENT ON COLUMN workspace_members.role IS 'Role do membro: member (padrão), creator ou partner (legacy)';

-- ========================================
-- 2. Remover apenas campos claramente obsoletos
-- ========================================

-- Estes campos foram substituídos completamente
ALTER TABLE workspaces
  DROP COLUMN IF EXISTS max_attempts CASCADE;

ALTER TABLE workspaces
  DROP COLUMN IF EXISTS current_attempts CASCADE;

-- ========================================
-- 3. Tornar campos opcionais (não deletar ainda)
-- ========================================

-- secret_question e secret_answer_hash podem ser NULL (já são)
-- partner_id pode ser NULL (já é)
-- Manter por enquanto para compatibilidade

-- ========================================
-- 4. Garantir que invite_code é sempre NOT NULL
-- ========================================

-- Gerar códigos para qualquer workspace sem código
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

-- Tornar NOT NULL
ALTER TABLE workspaces
  ALTER COLUMN invite_code SET NOT NULL;

-- ========================================
-- 5. Garantir que todos os workspaces têm status válido
-- ========================================

UPDATE workspaces
SET status = 'active'
WHERE status IS NULL OR status NOT IN ('active', 'disabled', 'archived');

ALTER TABLE workspaces
  ALTER COLUMN status SET NOT NULL;

-- ========================================
-- 6. Vacuum e análise
-- ========================================

ANALYZE workspaces;
ANALYZE workspace_members;
ANALYZE content;
ANALYZE reactions;
ANALYZE custom_emojis;
ANALYZE notification_preferences;

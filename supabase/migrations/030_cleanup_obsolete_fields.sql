-- Migration 030: Cleanup obsolete fields and simplify schema
-- Description: Remove campos não utilizados e simplifica estrutura
-- Date: 2025-11-14
-- ⚠️ Executar apenas APÓS confirmar que tudo está funcionando

-- ========================================
-- 1. Simplificar role em workspace_members
-- ========================================

-- Primeiro, remover a constraint antiga
ALTER TABLE workspace_members
  DROP CONSTRAINT IF EXISTS workspace_members_role_check;

-- Atualizar todos os roles existentes para 'member'
UPDATE workspace_members
SET role = 'member'
WHERE role IN ('creator', 'partner');

-- Criar nova constraint que aceita apenas 'member'
ALTER TABLE workspace_members
  ADD CONSTRAINT workspace_members_role_check
    CHECK (role IN ('member'));

COMMENT ON COLUMN workspace_members.role IS 'Sempre "member" - todos têm permissões iguais';

-- ========================================
-- 2. Remover campos obsoletos de workspaces
-- ========================================

-- Estes campos foram substituídos por invite_code simples
ALTER TABLE workspaces
  DROP COLUMN IF EXISTS secret_question CASCADE;

ALTER TABLE workspaces
  DROP COLUMN IF EXISTS secret_answer_hash CASCADE;

-- partner_id substituído por workspace_members
ALTER TABLE workspaces
  DROP COLUMN IF EXISTS partner_id CASCADE;

-- Campos de tentativas não são mais necessários
ALTER TABLE workspaces
  DROP COLUMN IF EXISTS max_attempts CASCADE;

ALTER TABLE workspaces
  DROP COLUMN IF EXISTS current_attempts CASCADE;

-- ========================================
-- 3. Garantir que invite_code é sempre NOT NULL
-- ========================================

-- Gerar códigos para qualquer workspace sem código
UPDATE workspaces
SET invite_code = generate_unique_invite_code()
WHERE invite_code IS NULL OR invite_code = '';

-- Tornar NOT NULL
ALTER TABLE workspaces
  ALTER COLUMN invite_code SET NOT NULL;

-- ========================================
-- 4. Adicionar validação de status
-- ========================================

-- Garantir que todos os workspaces têm status válido
UPDATE workspaces
SET status = 'active'
WHERE status IS NULL OR status NOT IN ('active', 'disabled', 'archived');

ALTER TABLE workspaces
  ALTER COLUMN status SET NOT NULL;

-- ========================================
-- 5. Vacuum e análise
-- ========================================

-- Reconstruir estatísticas após mudanças
ANALYZE workspaces;
ANALYZE workspace_members;
ANALYZE content;
ANALYZE reactions;
ANALYZE custom_emojis;
ANALYZE notification_preferences;

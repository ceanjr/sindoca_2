-- Migration 025: Disable automatic workspace assignment trigger
-- Description: Desabilita trigger que adiciona todos os usuários ao mesmo workspace
--              Agora o signup manual cria workspaces conforme necessário
-- Date: 2025-11-14

-- ========================================
-- 1. Desabilitar trigger antigo
-- ========================================

DROP TRIGGER IF EXISTS ensure_user_workspace ON public.profiles;

DROP FUNCTION IF EXISTS public.ensure_user_in_workspace();

-- ========================================
-- 2. Criar nova função para criar workspace padrão
-- ========================================

CREATE OR REPLACE FUNCTION create_default_workspace_for_user(
  p_user_id UUID,
  p_user_name TEXT DEFAULT 'Meu Espaço'
)
RETURNS UUID AS $$
DECLARE
  new_workspace_id UUID;
  invite_code_generated TEXT;
BEGIN
  -- Gerar código de convite único
  invite_code_generated := generate_unique_invite_code();

  -- Criar workspace padrão
  INSERT INTO workspaces (
    name,
    invite_code,
    creator_id,
    status
  )
  VALUES (
    p_user_name,
    invite_code_generated,
    p_user_id,
    'active'
  )
  RETURNING id INTO new_workspace_id;

  -- Adicionar usuário como membro
  INSERT INTO workspace_members (
    workspace_id,
    user_id,
    role
  )
  VALUES (
    new_workspace_id,
    p_user_id,
    'member'
  );

  RAISE NOTICE 'Created default workspace % for user % with code %',
    new_workspace_id, p_user_id, invite_code_generated;

  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_workspace_for_user(UUID, TEXT) IS 'Cria workspace padrão para novo usuário. Usado durante signup sem convite.';

-- ========================================
-- 3. Validar que usuários existentes têm workspace
-- ========================================

-- Verificar se há usuários sem workspace
DO $$
DECLARE
  orphan_user_record RECORD;
  new_workspace_id UUID;
BEGIN
  FOR orphan_user_record IN
    SELECT p.id, p.full_name
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.user_id = p.id
        AND wm.left_at IS NULL
    )
  LOOP
    -- Criar workspace padrão para usuário órfão
    new_workspace_id := create_default_workspace_for_user(
      orphan_user_record.id,
      COALESCE(orphan_user_record.full_name || ' - Espaço', 'Meu Espaço')
    );

    RAISE NOTICE 'Created workspace % for orphan user %',
      new_workspace_id, orphan_user_record.id;
  END LOOP;
END $$;

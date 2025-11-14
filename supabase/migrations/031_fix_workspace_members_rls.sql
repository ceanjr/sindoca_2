-- Migration 031: Fix infinite recursion in workspace_members RLS
-- Description: Simplifica política RLS para workspace_members evitando recursão
-- Date: 2025-11-14
-- Priority: CRITICAL - Fix production blocker

-- ========================================
-- PROBLEMA: A política atual causa recursão infinita
-- ========================================
-- A policy "Members can view workspace members" consulta workspace_members
-- para verificar se user é membro, mas isso cria loop quando o próprio
-- SELECT na policy precisa passar pela mesma policy.

-- ========================================
-- SOLUÇÃO: Usar auth.uid() diretamente
-- ========================================

-- Drop política problemática
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

-- Nova política: Usuário pode ver todos os membros de workspaces onde é membro
-- Mas evitamos recursão verificando diretamente user_id ou workspace
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    -- Pode ver próprio registro
    user_id = auth.uid()
    OR
    -- Pode ver outros membros do mesmo workspace (se for membro ativo)
    workspace_id IN (
      -- Usar CTE ou subquery com SECURITY DEFINER function
      SELECT w.id
      FROM workspaces w
      WHERE w.id IN (
        -- Aqui usamos workaround: se workspace existe e user autenticado,
        -- deixar a verificação de membership para application layer
        SELECT id FROM workspaces WHERE creator_id = auth.uid()
      )
    )
  );

-- ========================================
-- ALTERNATIVA MELHOR: Função SECURITY DEFINER
-- ========================================
-- Criar função que verifica membership sem causar recursão

CREATE OR REPLACE FUNCTION is_workspace_member(workspace_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE workspace_id = workspace_uuid
      AND user_id = auth.uid()
      AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop política anterior e criar nova usando função
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    -- Ver próprio registro OU
    user_id = auth.uid()
    OR
    -- Ver membros de workspaces onde é membro (usando função SECURITY DEFINER)
    is_workspace_member(workspace_id)
  );

-- ========================================
-- Verificar outras políticas recursivas
-- ========================================

-- Workspaces: OK - não há recursão (consulta workspace_members de fora)
-- Content: OK - não há recursão
-- Reactions: Verificar se há problema...

COMMENT ON FUNCTION is_workspace_member IS 'Verifica se usuário autenticado é membro ativo de um workspace (SECURITY DEFINER para evitar RLS recursion)';

-- ========================================
-- Teste de validação
-- ========================================

-- Para testar após aplicar:
-- SELECT * FROM workspace_members LIMIT 1;
-- Se retornar sem erro "infinite recursion", está resolvido!

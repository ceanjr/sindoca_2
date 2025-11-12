-- CORREÇÃO RÁPIDA DO TURNO
-- Execute este SQL no Supabase para corrigir o turno AGORA

-- Ver situação atual
SELECT
  '🔍 SITUAÇÃO ATUAL' as info,
  p.full_name,
  p.email,
  CASE
    WHEN p.id = w.data->>'current_music_turn_user_id' THEN '✅ É A VEZ'
    ELSE '⏸️ Aguardando'
  END as status
FROM workspaces w
CROSS JOIN profiles p
WHERE w.id = '99c966b1-98b9-4905-8d0d-80e357336114'
  AND p.id IN (
    SELECT user_id
    FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  );

-- ==================================================
-- CORREÇÃO: Alternar para o próximo na ordem circular
-- ==================================================

-- Atualizar para o próximo usuário (rotação circular)
WITH members_ordered AS (
  SELECT
    wm.user_id,
    ROW_NUMBER() OVER (ORDER BY wm.joined_at) as row_num
  FROM workspace_members wm
  WHERE wm.workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
),
current_user AS (
  SELECT row_num
  FROM members_ordered
  WHERE user_id = (
    SELECT data->>'current_music_turn_user_id'
    FROM workspaces
    WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114'
  )
),
total_members AS (
  SELECT COUNT(*) as total
  FROM members_ordered
),
next_user AS (
  SELECT user_id
  FROM members_ordered
  WHERE row_num = (
    CASE
      WHEN (SELECT row_num FROM current_user) >= (SELECT total FROM total_members)
      THEN 1  -- Volta pro primeiro
      ELSE (SELECT row_num FROM current_user) + 1  -- Próximo
    END
  )
)
UPDATE workspaces
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{current_music_turn_user_id}',
  to_jsonb((SELECT user_id::text FROM next_user))
)
WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114';

-- Verificar resultado
SELECT
  '✅ RESULTADO APÓS CORREÇÃO' as info,
  p.full_name,
  p.email,
  CASE
    WHEN p.id = w.data->>'current_music_turn_user_id' THEN '✅ É A VEZ AGORA'
    ELSE '⏸️ Aguardando vez'
  END as status
FROM workspaces w
CROSS JOIN profiles p
WHERE w.id = '99c966b1-98b9-4905-8d0d-80e357336114'
  AND p.id IN (
    SELECT user_id
    FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  )
ORDER BY
  CASE WHEN p.id = w.data->>'current_music_turn_user_id' THEN 0 ELSE 1 END,
  p.full_name;

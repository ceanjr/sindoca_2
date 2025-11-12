-- CORREÇÃO SIMPLES DO TURNO
-- Execute este SQL no Supabase

-- 1. Ver situação atual
SELECT
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
    SELECT user_id FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  );

-- 2. CORREÇÃO: Alternar para próximo usuário
WITH members_ordered AS (
  SELECT user_id, ROW_NUMBER() OVER (ORDER BY joined_at) as row_num
  FROM workspace_members
  WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
),
active_user AS (  -- ✅ Renomeado de current_user para active_user
  SELECT row_num FROM members_ordered
  WHERE user_id = (
    SELECT data->>'current_music_turn_user_id'
    FROM workspaces WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114'
  )
),
total_count AS (
  SELECT COUNT(*) as total FROM members_ordered
),
next_user AS (
  SELECT user_id FROM members_ordered
  WHERE row_num = (
    CASE
      WHEN (SELECT row_num FROM active_user) IS NULL THEN 1
      WHEN (SELECT row_num FROM active_user) >= (SELECT total FROM total_count) THEN 1
      ELSE (SELECT row_num FROM active_user) + 1
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

-- 3. Verificar resultado
SELECT
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
    SELECT user_id FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  )
ORDER BY
  CASE WHEN p.id = w.data->>'current_music_turn_user_id' THEN 0 ELSE 1 END,
  p.full_name;

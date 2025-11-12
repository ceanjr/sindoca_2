-- CORREÇÃO SUPER SIMPLES - APENAS 2 USUÁRIOS
-- Execute este SQL no Supabase

-- 1. Ver situação atual
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
    SELECT user_id FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  );

-- 2. Ver quem adicionou a última música
SELECT
  '🎵 ÚLTIMA MÚSICA' as info,
  p.full_name as adicionado_por,
  c.title as musica,
  c.created_at
FROM content c
JOIN profiles p ON p.id = c.author_id
WHERE c.workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  AND c.type = 'music'
ORDER BY c.created_at DESC
LIMIT 1;

-- ================================================================
-- 3. CORREÇÃO: Alternar para o OUTRO usuário (simples com 2 users)
-- ================================================================

UPDATE workspaces
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{current_music_turn_user_id}',
  to_jsonb((
    -- Pega o outro usuário (não quem adicionou a última música)
    SELECT user_id::text
    FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
      AND user_id != (
        SELECT author_id
        FROM content
        WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
          AND type = 'music'
        ORDER BY created_at DESC
        LIMIT 1
      )
    LIMIT 1
  ))
)
WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114';

-- 4. Verificar resultado
SELECT
  '✅ RESULTADO APÓS CORREÇÃO' as info,
  p.full_name,
  p.email,
  CASE
    WHEN p.id = w.data->>'current_music_turn_user_id' THEN '✅ É A VEZ AGORA!'
    ELSE '⏸️ Aguardando sua vez'
  END as status
FROM workspaces w
CROSS JOIN profiles p
WHERE w.id = '99c966b1-98b9-4905-8d0d-80e357336114'
  AND p.id IN (
    SELECT user_id FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  )
ORDER BY
  CASE WHEN p.id = w.data->>'current_music_turn_user_id' THEN 0 ELSE 1 END;

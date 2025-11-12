-- Script para corrigir o sistema de turnos

-- DIAGNÓSTICO: Execute este primeiro
-- Ver quem adicionou a última música e quem deveria ser o próximo
WITH last_track AS (
  SELECT
    author_id,
    created_at,
    title
  FROM content
  WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
    AND type = 'music'
  ORDER BY created_at DESC
  LIMIT 1
),
members AS (
  SELECT user_id
  FROM workspace_members
  WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
),
current_turn AS (
  SELECT data->>'current_music_turn_user_id' as turn_user_id
  FROM workspaces
  WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114'
)
SELECT
  'DIAGNÓSTICO' as secao,
  p1.full_name as ultima_pessoa_que_adicionou,
  p1.email as email_dessa_pessoa,
  lt.created_at as quando_adicionou,
  p2.full_name as vez_atual_segundo_banco,
  p2.email as email_vez_atual,
  CASE
    WHEN ct.turn_user_id = lt.author_id THEN '❌ ERRO: A mesma pessoa que adicionou ainda tem a vez!'
    ELSE '✅ OK: O turno foi alternado corretamente'
  END as status
FROM last_track lt
JOIN profiles p1 ON p1.id = lt.author_id
CROSS JOIN current_turn ct
LEFT JOIN profiles p2 ON p2.id = ct.turn_user_id;

-- ===================================================
-- CORREÇÃO MANUAL: Se o diagnóstico mostrar erro, execute abaixo
-- ===================================================

-- Opção 1: Alternar para o próximo usuário (recomendado)
-- Encontra o próximo usuário que não adicionou a última música
UPDATE workspaces
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{current_music_turn_user_id}',
  to_jsonb((
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

-- Verificar resultado
SELECT
  p.full_name,
  p.email,
  CASE
    WHEN p.id = w.data->>'current_music_turn_user_id' THEN '✅ É A VEZ AGORA'
    ELSE '⏸️ Não é a vez'
  END as status
FROM workspaces w
CROSS JOIN profiles p
WHERE w.id = '99c966b1-98b9-4905-8d0d-80e357336114'
  AND p.id IN (
    SELECT user_id
    FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  );

-- CORREÇÃO MANUAL - Escolha quem deve ser a próxima vez

-- IDs dos usuários (copie do resultado abaixo):
-- Célio Júnior: 50e5a69d-8421-4fc1-a33a-8cb0d125ab50
-- Sindy: d92c396b-db11-45f8-a45f-47ff5152484a

-- 1. Ver situação atual
SELECT
  p.id as user_id,
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

-- ================================================================
-- OPÇÃO A: Forçar vez do CÉLIO
-- ================================================================
UPDATE workspaces
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{current_music_turn_user_id}',
  '"50e5a69d-8421-4fc1-a33a-8cb0d125ab50"'::jsonb
)
WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114';

-- ================================================================
-- OPÇÃO B: Forçar vez da SINDY
-- ================================================================
-- UPDATE workspaces
-- SET data = jsonb_set(
--   COALESCE(data, '{}'::jsonb),
--   '{current_music_turn_user_id}',
--   '"d92c396b-db11-45f8-a45f-47ff5152484a"'::jsonb
-- )
-- WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114';

-- Verificar resultado
SELECT
  p.full_name,
  CASE
    WHEN p.id = w.data->>'current_music_turn_user_id' THEN '✅ É A VEZ AGORA!'
    ELSE '⏸️ Aguardando'
  END as status
FROM workspaces w
CROSS JOIN profiles p
WHERE w.id = '99c966b1-98b9-4905-8d0d-80e357336114'
  AND p.id IN (
    SELECT user_id FROM workspace_members
    WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  );

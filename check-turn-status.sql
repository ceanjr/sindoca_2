-- Verificar status do turno atual

-- 1. Ver dados do workspace (incluindo turno)
SELECT
  w.id as workspace_id,
  w.name as workspace_name,
  w.data->>'current_music_turn_user_id' as current_turn_user_id,
  w.data->>'spotify_playlist_id' as spotify_playlist_id,
  w.data->>'spotify_playlist_url' as spotify_playlist_url
FROM workspaces w
WHERE w.id = '99c966b1-98b9-4905-8d0d-80e357336114';

-- 2. Ver quem são os membros
SELECT
  p.id as user_id,
  p.full_name,
  p.email,
  CASE
    WHEN p.id = (
      SELECT data->>'current_music_turn_user_id'
      FROM workspaces
      WHERE id = '99c966b1-98b9-4905-8d0d-80e357336114'
    ) THEN '✅ É A VEZ DESTA PESSOA'
    ELSE '⏸️ Não é a vez'
  END as status_turno
FROM profiles p
WHERE p.id IN (
  SELECT user_id
  FROM workspace_members
  WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
);

-- 3. Ver última música adicionada
SELECT
  c.id,
  c.title as musica,
  c.description as artista,
  p.full_name as adicionado_por,
  c.created_at
FROM content c
JOIN profiles p ON p.id = c.author_id
WHERE c.workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114'
  AND c.type = 'music'
ORDER BY c.created_at DESC
LIMIT 1;

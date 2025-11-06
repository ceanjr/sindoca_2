-- Add data JSONB field to workspaces table for flexible storage
-- This will store turn information and other workspace-specific data

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the field
COMMENT ON COLUMN workspaces.data IS 'Flexible JSONB storage for workspace data like current_music_turn_user_id, spotify_playlist_url, etc.';

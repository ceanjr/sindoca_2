-- Migration: Add custom emojis support
-- Description: Allows users to add custom emojis to their reaction menu

-- Create custom_emojis table
CREATE TABLE IF NOT EXISTS custom_emojis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, emoji)
);

-- Enable RLS
ALTER TABLE custom_emojis ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own custom emojis
CREATE POLICY "Users can read own custom emojis"
  ON custom_emojis
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own custom emojis
CREATE POLICY "Users can insert own custom emojis"
  ON custom_emojis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own custom emojis
CREATE POLICY "Users can update own custom emojis"
  ON custom_emojis
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own custom emojis
CREATE POLICY "Users can delete own custom emojis"
  ON custom_emojis
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_custom_emojis_user_id ON custom_emojis(user_id);
CREATE INDEX idx_custom_emojis_last_used ON custom_emojis(last_used_at);

-- Function to auto-delete unused emojis after 7 days
CREATE OR REPLACE FUNCTION delete_unused_custom_emojis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM custom_emojis
  WHERE last_used_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create a cron job to run daily (requires pg_cron extension)
-- Note: This requires pg_cron to be enabled on Supabase
-- If not available, this needs to be run manually or via edge function
COMMENT ON FUNCTION delete_unused_custom_emojis() IS 'Deletes custom emojis not used in 7 days';

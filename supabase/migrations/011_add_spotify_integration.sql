-- Add Spotify integration columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS spotify_tokens JSONB,
ADD COLUMN IF NOT EXISTS spotify_user_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_display_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_spotify_user_id ON profiles(spotify_user_id);

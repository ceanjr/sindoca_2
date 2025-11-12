-- Add emoji reactions support
-- Extends the reactions table to support emoji reactions

-- Add emoji column to reactions table
ALTER TABLE reactions 
ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Update the type check to include 'emoji' type
ALTER TABLE reactions 
DROP CONSTRAINT IF EXISTS reactions_type_check;

ALTER TABLE reactions 
ADD CONSTRAINT reactions_type_check 
CHECK (type IN ('favorite', 'comment', 'like', 'emoji'));

-- Create index for better performance on emoji reactions
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(type);

-- Update unique constraint to allow one emoji reaction per user per content
ALTER TABLE reactions 
DROP CONSTRAINT IF EXISTS reactions_content_id_user_id_type_key;

-- For emoji reactions, we only want one per user per content
-- For other types (comment), we allow multiple
CREATE UNIQUE INDEX IF NOT EXISTS idx_reactions_emoji_unique 
ON reactions(content_id, user_id) 
WHERE type = 'emoji';

-- Enable RLS on reactions table if not already enabled
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view reactions in their workspace" ON reactions;
DROP POLICY IF EXISTS "Users can create reactions in their workspace" ON reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can update their own reactions" ON reactions;

-- Create RLS policies for reactions
CREATE POLICY "Users can view reactions in their workspace"
ON reactions FOR SELECT
USING (
  content_id IN (
    SELECT c.id FROM content c
    INNER JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create reactions in their workspace"
ON reactions FOR INSERT
WITH CHECK (
  content_id IN (
    SELECT c.id FROM content c
    INNER JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
    WHERE wm.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

CREATE POLICY "Users can delete their own reactions"
ON reactions FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own reactions"
ON reactions FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

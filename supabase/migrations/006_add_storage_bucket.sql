-- Create storage bucket for gallery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gallery bucket
CREATE POLICY "Authenticated users can view gallery photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload gallery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gallery' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'photos'
  );

CREATE POLICY "Users can delete own gallery photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gallery'
    AND auth.role() = 'authenticated'
  );

-- Update content table to better handle photos
-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_storage_path ON content(storage_path);

-- Update reactions table to allow null content_id temporarily during migration
-- (we'll use storage_path as fallback during transition)
ALTER TABLE reactions ALTER COLUMN content_id DROP NOT NULL;
ALTER TABLE reactions ADD COLUMN storage_path TEXT;
CREATE INDEX IF NOT EXISTS idx_reactions_storage_path ON reactions(storage_path);

-- Add a unique constraint that handles both old (storage_path) and new (content_id) favorites
DROP INDEX IF EXISTS reactions_content_id_user_id_type_key;
CREATE UNIQUE INDEX reactions_unique_favorite 
  ON reactions(user_id, type, COALESCE(content_id::text, storage_path))
  WHERE type = 'favorite';

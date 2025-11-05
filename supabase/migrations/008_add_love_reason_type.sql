-- Add 'love_reason' and 'legacy' types to content table type constraint
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_type_check;

ALTER TABLE content ADD CONSTRAINT content_type_check 
  CHECK (type IN ('photo', 'message', 'music', 'achievement', 'voice', 'story', 'love_reason', 'legacy'));

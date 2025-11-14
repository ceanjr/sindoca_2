-- Add notify_new_reactions column to notification_preferences
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS notify_new_reactions BOOLEAN DEFAULT true;

-- Update existing rows to have the new column set to true
UPDATE notification_preferences
SET notify_new_reactions = true
WHERE notify_new_reactions IS NULL;

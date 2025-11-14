-- Migration: Fix analytics delivery_status from 'sent' to 'delivered'
-- Date: 2025-11-13
-- Problem: Old records have 'sent' status but should be 'delivered' for stats calculation

-- Update existing records where delivery_status is 'sent' to 'delivered'
-- This is safe because 'sent' in our context means the web-push API accepted it,
-- which is equivalent to 'delivered' in push notification terminology
UPDATE push_notification_analytics
SET delivery_status = 'delivered'
WHERE delivery_status = 'sent';

-- Add comment explaining the status values
COMMENT ON COLUMN push_notification_analytics.delivery_status IS
'Status of notification delivery:
- delivered: Successfully sent to push service (web-push accepted it)
- failed: Failed to send (invalid subscription, network error, etc.)
- expired: Subscription expired before delivery
- clicked: User clicked on the notification (future feature)';

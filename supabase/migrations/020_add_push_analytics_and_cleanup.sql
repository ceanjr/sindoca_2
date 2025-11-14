-- Migration: Add push notification analytics and cleanup features
-- Date: 2025-11-13

-- 1. Add last_verified field to push_subscriptions for cleanup
ALTER TABLE push_subscriptions
ADD COLUMN IF NOT EXISTS last_verified TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verification_failures INT DEFAULT 0;

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_last_verified
  ON push_subscriptions(last_verified);

-- Comment
COMMENT ON COLUMN push_subscriptions.last_verified IS 'Last time this subscription was verified as working';
COMMENT ON COLUMN push_subscriptions.verification_failures IS 'Number of consecutive verification failures';

-- 2. Create push_notification_analytics table
CREATE TABLE IF NOT EXISTS push_notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'photo', 'reason', 'music', 'reaction', etc.
  title TEXT NOT NULL,
  body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'expired'
  error_message TEXT,
  clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMPTZ,
  metadata JSONB,

  -- Indexes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_push_analytics_workspace
  ON push_notification_analytics(workspace_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_analytics_recipient
  ON push_notification_analytics(recipient_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_analytics_status
  ON push_notification_analytics(delivery_status);
CREATE INDEX IF NOT EXISTS idx_push_analytics_type
  ON push_notification_analytics(notification_type);

-- Enable RLS
ALTER TABLE push_notification_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - workspace members can view analytics
DROP POLICY IF EXISTS "Workspace members can view analytics" ON push_notification_analytics;
CREATE POLICY "Workspace members can view analytics"
  ON push_notification_analytics FOR SELECT
  USING (
    workspace_id IN (
      SELECT wm.workspace_id
      FROM workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- Only system can insert (via service role or internal API)
DROP POLICY IF EXISTS "System can insert analytics" ON push_notification_analytics;
CREATE POLICY "System can insert analytics"
  ON push_notification_analytics FOR INSERT
  WITH CHECK (true); -- Will be controlled by app-level auth

-- Comment
COMMENT ON TABLE push_notification_analytics IS 'Tracks push notification delivery and engagement metrics';

-- 3. Function to clean up expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_push_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete subscriptions that:
  -- 1. Haven't been verified in 30 days, OR
  -- 2. Have 3+ consecutive verification failures
  DELETE FROM push_subscriptions
  WHERE
    last_verified < NOW() - INTERVAL '30 days'
    OR verification_failures >= 3;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION cleanup_expired_push_subscriptions() IS 'Removes push subscriptions that are no longer valid or verified';

-- 4. Function to get push notification stats for a workspace
CREATE OR REPLACE FUNCTION get_push_stats(workspace_uuid UUID, days_back INT DEFAULT 7)
RETURNS TABLE(
  total_sent BIGINT,
  total_delivered BIGINT,
  total_failed BIGINT,
  total_clicked BIGINT,
  delivery_rate NUMERIC,
  click_rate NUMERIC,
  by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered,
      COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed,
      COUNT(*) FILTER (WHERE clicked = true) as clicked,
      notification_type
    FROM push_notification_analytics
    WHERE
      workspace_id = workspace_uuid
      AND sent_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY notification_type
  ),
  totals AS (
    SELECT
      SUM(total)::BIGINT as total_sent,
      SUM(delivered)::BIGINT as total_delivered,
      SUM(failed)::BIGINT as total_failed,
      SUM(clicked)::BIGINT as total_clicked
    FROM stats
  ),
  by_type_agg AS (
    SELECT jsonb_object_agg(
      notification_type,
      jsonb_build_object(
        'sent', total,
        'delivered', delivered,
        'failed', failed,
        'clicked', clicked
      )
    ) as types
    FROM stats
  )
  SELECT
    COALESCE(t.total_sent, 0),
    COALESCE(t.total_delivered, 0),
    COALESCE(t.total_failed, 0),
    COALESCE(t.total_clicked, 0),
    CASE
      WHEN COALESCE(t.total_sent, 0) > 0
      THEN ROUND((COALESCE(t.total_delivered, 0)::NUMERIC / t.total_sent) * 100, 2)
      ELSE 0
    END as delivery_rate,
    CASE
      WHEN COALESCE(t.total_delivered, 0) > 0
      THEN ROUND((COALESCE(t.total_clicked, 0)::NUMERIC / t.total_delivered) * 100, 2)
      ELSE 0
    END as click_rate,
    COALESCE(bt.types, '{}'::JSONB)
  FROM totals t
  CROSS JOIN by_type_agg bt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION get_push_stats(UUID, INT) IS 'Returns push notification statistics for a workspace';

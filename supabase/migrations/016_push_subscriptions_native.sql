-- Migration: Add push_subscriptions_native table for React Native app
-- Date: 2025-01-12

CREATE TABLE IF NOT EXISTS push_subscriptions_native (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_push_native_user ON push_subscriptions_native(user_id);
CREATE INDEX IF NOT EXISTS idx_push_native_token ON push_subscriptions_native(expo_push_token);

-- RLS policies
ALTER TABLE push_subscriptions_native ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own push token" ON push_subscriptions_native;
CREATE POLICY "Users can insert own push token"
  ON push_subscriptions_native FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push token" ON push_subscriptions_native;
CREATE POLICY "Users can update own push token"
  ON push_subscriptions_native FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own push token" ON push_subscriptions_native;
CREATE POLICY "Users can view own push token"
  ON push_subscriptions_native FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push token" ON push_subscriptions_native;
CREATE POLICY "Users can delete own push token"
  ON push_subscriptions_native FOR DELETE
  USING (auth.uid() = user_id);

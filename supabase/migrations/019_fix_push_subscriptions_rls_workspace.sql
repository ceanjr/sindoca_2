-- Migration: Fix push_subscriptions RLS to allow workspace members to view each other's subscriptions
-- Date: 2025-11-13
-- Problem: Users can only see their own subscriptions, not their partner's subscriptions
-- Solution: Allow workspace members to see all subscriptions from workspace members

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own subscriptions" ON push_subscriptions;

-- Create new policy that allows viewing subscriptions from workspace members
CREATE POLICY "Workspace members can view all workspace subscriptions"
  ON push_subscriptions
  FOR SELECT
  USING (
    user_id IN (
      -- Get all user_ids from the same workspace as the current user
      SELECT wm2.user_id
      FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
    )
  );

-- The INSERT, UPDATE, and DELETE policies remain unchanged (users can only modify their own)
-- This is correct for security - you can see your partner's subscriptions but not modify them

-- Comment
COMMENT ON POLICY "Workspace members can view all workspace subscriptions" ON push_subscriptions
IS 'Allows workspace members to view push subscriptions of all members in their workspace. This is needed for debugging and for the app to show correct push status for partners.';

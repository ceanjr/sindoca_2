-- Improve RLS policies for better privacy
-- This migration restricts profile visibility to only the user themselves
-- and their partner in the workspace

-- Drop the overly permissive read policy
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;

-- Create more restrictive policy: users can only see their own profile
-- and their partner's profile in the workspace
CREATE POLICY "Users can read own or partner profile"
  ON profiles FOR SELECT
  USING (
    -- User can see their own profile
    auth.uid() = id
    OR
    -- User can see profiles of workspace partners
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE (creator_id = auth.uid() OR partner_id = auth.uid())
      AND (creator_id = profiles.id OR partner_id = profiles.id)
    )
    OR
    -- User can see profiles of workspace members
    EXISTS (
      SELECT 1 FROM workspace_members wm1
      INNER JOIN workspace_members wm2
        ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid()
      AND wm2.user_id = profiles.id
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Users can read own or partner profile" ON profiles IS
  'Users can view their own profile and profiles of users in their workspace. This provides privacy while allowing workspace collaboration.';

-- Fix infinite recursion in workspace_members RLS policy
-- The original policy was querying workspace_members from within the workspace_members policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;

-- Create a simpler policy that doesn't cause recursion
-- Users can view workspace members for workspaces they're part of
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    -- User can see their own membership records
    user_id = auth.uid()
    OR
    -- User can see other members of workspaces where they are creator/partner
    workspace_id IN (
      SELECT id FROM workspaces
      WHERE creator_id = auth.uid() OR partner_id = auth.uid()
    )
  );

-- Also fix the profiles policy to allow workspace members to view each other
-- This was likely also affected by the recursion issue
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to view profiles of members in their workspaces
CREATE POLICY "Members can view workspace profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT creator_id FROM workspaces WHERE creator_id = auth.uid() OR partner_id = auth.uid()
      UNION
      SELECT partner_id FROM workspaces WHERE creator_id = auth.uid() OR partner_id = auth.uid()
    )
  );

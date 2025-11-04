-- Create a single shared workspace for the couple
-- This migration ensures there's always one workspace available

-- First, make the workspace columns nullable since we're simplifying
ALTER TABLE workspaces 
  ALTER COLUMN invite_code DROP NOT NULL,
  ALTER COLUMN secret_question DROP NOT NULL,
  ALTER COLUMN secret_answer_hash DROP NOT NULL;

-- Function to ensure workspace exists and add users to it
CREATE OR REPLACE FUNCTION public.ensure_user_in_workspace()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id_var UUID;
BEGIN
  -- Get or create the single workspace
  SELECT id INTO workspace_id_var
  FROM workspaces
  WHERE name = 'Nosso Espaço'
  LIMIT 1;

  -- Create workspace if it doesn't exist
  IF workspace_id_var IS NULL THEN
    INSERT INTO workspaces (
      name, 
      creator_id,
      invite_code,
      secret_question,
      secret_answer_hash,
      status
    )
    VALUES (
      'Nosso Espaço', 
      NEW.id,
      'nosso-amor-' || substr(md5(random()::text), 1, 8),
      'Qual é nosso lugar especial?',
      'deprecated',
      'active'
    )
    RETURNING id INTO workspace_id_var;
  END IF;

  -- Add user to workspace if not already a member
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id_var, NEW.id, 'partner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add new users to the workspace
DROP TRIGGER IF EXISTS ensure_user_workspace ON public.profiles;
CREATE TRIGGER ensure_user_workspace
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_in_workspace();

-- Add existing users to workspace if they aren't already
DO $$
DECLARE
  workspace_id_var UUID;
  creator_id_var UUID;
  user_record RECORD;
BEGIN
  -- Get or create the workspace
  SELECT id INTO workspace_id_var
  FROM workspaces
  WHERE name = 'Nosso Espaço'
  LIMIT 1;

  -- Create if doesn't exist
  IF workspace_id_var IS NULL THEN
    -- Get the first user to be the creator
    SELECT id INTO creator_id_var FROM profiles LIMIT 1;
    
    IF creator_id_var IS NOT NULL THEN
      INSERT INTO workspaces (
        name, 
        creator_id,
        invite_code,
        secret_question,
        secret_answer_hash,
        status
      )
      VALUES (
        'Nosso Espaço', 
        creator_id_var,
        'nosso-amor-' || substr(md5(random()::text), 1, 8),
        'Qual é nosso lugar especial?',
        'deprecated',
        'active'
      )
      RETURNING id INTO workspace_id_var;
    END IF;
  END IF;

  -- Add all existing users to the workspace
  IF workspace_id_var IS NOT NULL THEN
    FOR user_record IN SELECT id FROM profiles LOOP
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES (workspace_id_var, user_record.id, 'partner')
      ON CONFLICT (workspace_id, user_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

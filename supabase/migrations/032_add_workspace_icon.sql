-- Migration 032: Add icon field to workspaces
-- Description: Adiciona campo icon para personalização de workspaces
-- Date: 2025-11-14

-- Adicionar coluna icon
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'heart';

-- Comentário explicativo
COMMENT ON COLUMN workspaces.icon IS 'Ícone do workspace (heart, users, home, briefcase, star, etc)';

-- Atualizar workspaces existentes com ícones aleatórios
DO $$
DECLARE
  workspace_record RECORD;
  icons TEXT[] := ARRAY['heart', 'users', 'home', 'briefcase', 'star', 'sparkles', 'crown', 'flame'];
  random_icon TEXT;
BEGIN
  FOR workspace_record IN SELECT id FROM workspaces WHERE icon IS NULL OR icon = '' LOOP
    -- Gerar índice aleatório
    random_icon := icons[1 + floor(random() * array_length(icons, 1))::int];

    -- Atualizar workspace
    UPDATE workspaces
    SET icon = random_icon
    WHERE id = workspace_record.id;

    RAISE NOTICE 'Assigned icon % to workspace %', random_icon, workspace_record.id;
  END LOOP;
END $$;

-- Tornar NOT NULL após preencher
ALTER TABLE workspaces
  ALTER COLUMN icon SET NOT NULL;

-- Índice para performance (opcional)
CREATE INDEX IF NOT EXISTS idx_workspaces_icon ON workspaces(icon);

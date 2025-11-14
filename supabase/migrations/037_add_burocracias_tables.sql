-- Migration: 037 - Burocracias a Dois (Discussões)
-- Description: Cria todas as tabelas necessárias para a funcionalidade de discussões/burocracias

-- ============================================
-- 1. TABELA PRINCIPAL: discussions
-- ============================================
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Conteúdo
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  treta_reason TEXT,
  category TEXT NOT NULL,
  image_url TEXT,

  -- Status
  status TEXT DEFAULT 'em_andamento' NOT NULL,

  -- Métricas
  intensity_score INT DEFAULT 0 NOT NULL,
  total_messages INT DEFAULT 0 NOT NULL,
  unread_count_user_a INT DEFAULT 0 NOT NULL,
  unread_count_user_b INT DEFAULT 0 NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_category CHECK (category IN ('financeiro', 'casa', 'planejamento', 'dr', 'diversao', 'importante')),
  CONSTRAINT valid_status CHECK (status IN ('em_andamento', 'resolvida', 'pausada', 'acordo_fechado')),
  CONSTRAINT valid_intensity CHECK (intensity_score >= 0 AND intensity_score <= 100)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_discussions_workspace ON discussions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity ON discussions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_status ON discussions(status);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON discussions(category);

-- ============================================
-- 2. TABELA DE MENSAGENS: discussion_messages
-- ============================================
CREATE TABLE IF NOT EXISTS discussion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Thread support
  parent_message_id UUID REFERENCES discussion_messages(id) ON DELETE CASCADE,
  thread_level INT DEFAULT 0 NOT NULL,
  thread_message_count INT DEFAULT 0 NOT NULL,

  -- Conteúdo
  content TEXT NOT NULL,
  image_url TEXT,

  -- Metadata
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT max_thread_level CHECK (thread_level >= 0 AND thread_level <= 2)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_messages_discussion ON discussion_messages(discussion_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON discussion_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON discussion_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON discussion_messages(is_pinned) WHERE is_pinned = TRUE;

-- ============================================
-- 3. TABELA DE REAÇÕES: discussion_reactions
-- ============================================
CREATE TABLE IF NOT EXISTS discussion_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES discussion_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Previne duplicatas: mesmo usuário não pode reagir com mesmo emoji na mesma mensagem
  UNIQUE(message_id, user_id, emoji)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reactions_message ON discussion_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON discussion_reactions(user_id);

-- ============================================
-- 4. TABELA DE RASCUNHOS: discussion_drafts
-- ============================================
CREATE TABLE IF NOT EXISTS discussion_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_message_id UUID REFERENCES discussion_messages(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Um rascunho por contexto (discussão + usuário + thread)
  UNIQUE(discussion_id, user_id, parent_message_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_drafts_discussion_user ON discussion_drafts(discussion_id, user_id);

-- ============================================
-- 5. TABELA DE STATUS DE LEITURA: discussion_read_status
-- ============================================
CREATE TABLE IF NOT EXISTS discussion_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_read_message_id UUID REFERENCES discussion_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Um registro por discussão por usuário
  UNIQUE(discussion_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_read_status_discussion_user ON discussion_read_status(discussion_id, user_id);

-- ============================================
-- 6. TABELA DE FILA DE NOTIFICAÇÕES: discussion_notification_queue
-- ============================================
CREATE TABLE IF NOT EXISTS discussion_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  message_count INT DEFAULT 1 NOT NULL,
  last_message_content TEXT,
  notification_type TEXT NOT NULL,
  thread_context TEXT,

  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE NOT NULL,

  CONSTRAINT valid_notification_type CHECK (notification_type IN ('new_message', 'thread_reply', 'status_change', 'pinned_argument', 'reaction'))
);

-- Índice para performance e garantir unicidade de notificações não enviadas
CREATE INDEX IF NOT EXISTS idx_notif_queue_discussion_recipient ON discussion_notification_queue(discussion_id, recipient_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_queue_unique_pending ON discussion_notification_queue(discussion_id, recipient_id, notification_type) WHERE is_sent = FALSE;

-- ============================================
-- 7. STORAGE BUCKET para imagens
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('burocracias-images', 'burocracias-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. RLS POLICIES - Segurança
-- ============================================

-- DISCUSSIONS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Ver discussões: apenas membros do workspace
CREATE POLICY "Members can view discussions"
  ON discussions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Criar discussões: apenas membros do workspace
CREATE POLICY "Members can create discussions"
  ON discussions FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    AND author_id = auth.uid()
  );

-- Atualizar discussões: apenas membros do workspace
CREATE POLICY "Members can update discussions"
  ON discussions FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Deletar discussões: apenas autor ou membros do workspace
CREATE POLICY "Members can delete discussions"
  ON discussions FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- DISCUSSION_MESSAGES
ALTER TABLE discussion_messages ENABLE ROW LEVEL SECURITY;

-- Ver mensagens: membros do workspace da discussão
CREATE POLICY "Members can view messages"
  ON discussion_messages FOR SELECT
  USING (
    discussion_id IN (
      SELECT d.id FROM discussions d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Criar mensagens: membros do workspace
CREATE POLICY "Members can create messages"
  ON discussion_messages FOR INSERT
  WITH CHECK (
    discussion_id IN (
      SELECT d.id FROM discussions d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
    AND author_id = auth.uid()
  );

-- Atualizar mensagens: apenas autor
CREATE POLICY "Authors can update own messages"
  ON discussion_messages FOR UPDATE
  USING (author_id = auth.uid());

-- Deletar mensagens: apenas autor
CREATE POLICY "Authors can delete own messages"
  ON discussion_messages FOR DELETE
  USING (author_id = auth.uid());

-- DISCUSSION_REACTIONS
ALTER TABLE discussion_reactions ENABLE ROW LEVEL SECURITY;

-- Ver reações: membros do workspace
CREATE POLICY "Members can view reactions"
  ON discussion_reactions FOR SELECT
  USING (
    message_id IN (
      SELECT dm.id FROM discussion_messages dm
      JOIN discussions d ON d.id = dm.discussion_id
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Criar reações: membros do workspace
CREATE POLICY "Members can create reactions"
  ON discussion_reactions FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT dm.id FROM discussion_messages dm
      JOIN discussions d ON d.id = dm.discussion_id
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Deletar reações: apenas quem criou
CREATE POLICY "Users can delete own reactions"
  ON discussion_reactions FOR DELETE
  USING (user_id = auth.uid());

-- DISCUSSION_DRAFTS
ALTER TABLE discussion_drafts ENABLE ROW LEVEL SECURITY;

-- Ver rascunhos: apenas próprios rascunhos
CREATE POLICY "Users can view own drafts"
  ON discussion_drafts FOR SELECT
  USING (user_id = auth.uid());

-- Criar/Atualizar/Deletar rascunhos: apenas próprios
CREATE POLICY "Users can manage own drafts"
  ON discussion_drafts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DISCUSSION_READ_STATUS
ALTER TABLE discussion_read_status ENABLE ROW LEVEL SECURITY;

-- Ver status de leitura: apenas próprio status
CREATE POLICY "Users can view own read status"
  ON discussion_read_status FOR SELECT
  USING (user_id = auth.uid());

-- Criar/Atualizar status de leitura: apenas próprio
CREATE POLICY "Users can manage own read status"
  ON discussion_read_status FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DISCUSSION_NOTIFICATION_QUEUE
ALTER TABLE discussion_notification_queue ENABLE ROW LEVEL SECURITY;

-- Sistema de notificações: permitir acesso do backend
CREATE POLICY "Service role can manage notifications"
  ON discussion_notification_queue FOR ALL
  USING (true)
  WITH CHECK (true);

-- STORAGE POLICIES para burocracias-images
CREATE POLICY "Members can view burocracias images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'burocracias-images');

CREATE POLICY "Authenticated users can upload burocracias images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'burocracias-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own burocracias images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'burocracias-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own burocracias images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'burocracias-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 9. TRIGGERS - Automações
-- ============================================

-- Trigger para atualizar updated_at em discussions
CREATE OR REPLACE FUNCTION update_discussion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_discussion_timestamp
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_timestamp();

-- Trigger para atualizar last_activity_at quando nova mensagem
CREATE OR REPLACE FUNCTION update_discussion_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discussions
  SET last_activity_at = NOW(),
      total_messages = total_messages + 1
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_discussion_activity
  AFTER INSERT ON discussion_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_activity();

-- Trigger para atualizar contador de threads
CREATE OR REPLACE FUNCTION update_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE discussion_messages
    SET thread_message_count = thread_message_count + 1
    WHERE id = NEW.parent_message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_thread_count
  AFTER INSERT ON discussion_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_count();

-- Trigger para atualizar updated_at em drafts
CREATE OR REPLACE FUNCTION update_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_draft_timestamp
  BEFORE UPDATE ON discussion_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_draft_timestamp();

-- ============================================
-- FIM DA MIGRATION
-- ============================================

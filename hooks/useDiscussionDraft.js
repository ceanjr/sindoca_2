'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para gerenciar rascunhos automáticos de mensagens
 * - Salva automaticamente a cada 3 segundos
 * - Recupera rascunho ao abrir discussão
 * - Limpa rascunho ao enviar mensagem
 */
export function useDiscussionDraft(discussionId, parentMessageId = null) {
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const supabase = createClient();
  const { user } = useAuth();

  // Carregar rascunho existente
  useEffect(() => {
    if (!discussionId || !user) return;

    loadDraft();
  }, [discussionId, user, parentMessageId]);

  const loadDraft = async () => {
    try {
      const { data, error } = await supabase
        .from('discussion_drafts')
        .select('content, updated_at')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .is('parent_message_id', parentMessageId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error loading draft:', error);
        return;
      }

      if (data) {
        setDraft(data.content);
        setLastSaved(new Date(data.updated_at));
      }
    } catch (err) {
      console.error('Error loading draft:', err);
    }
  };

  // Salvar rascunho
  const saveDraft = useCallback(async (content) => {
    if (!discussionId || !user || !content.trim()) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('discussion_drafts')
        .upsert({
          discussion_id: discussionId,
          user_id: user.id,
          parent_message_id: parentMessageId,
          content: content.trim(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'discussion_id,user_id,parent_message_id'
        });

      if (error) throw error;

      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving draft:', err);
    } finally {
      setIsSaving(false);
    }
  }, [discussionId, user, parentMessageId, supabase]);

  // Auto-save a cada 3 segundos
  useEffect(() => {
    if (!draft.trim()) return;

    const timeout = setTimeout(() => {
      saveDraft(draft);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [draft, saveDraft]);

  // Limpar rascunho
  const clearDraft = async () => {
    if (!discussionId || !user) return;

    try {
      await supabase
        .from('discussion_drafts')
        .delete()
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .is('parent_message_id', parentMessageId);

      setDraft('');
      setLastSaved(null);
    } catch (err) {
      console.error('Error clearing draft:', err);
    }
  };

  return {
    draft,
    setDraft,
    isSaving,
    lastSaved,
    clearDraft,
  };
}

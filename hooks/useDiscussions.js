'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para gerenciar discussões (Burocracias a Dois)
 * - Carrega discussões do workspace
 * - Sincronização em tempo real via Supabase Realtime
 * - Filtros por status
 * - Contador de mensagens não lidas
 */
export function useDiscussions(filterStatus = null) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = createClient();

  const { currentWorkspaceId } = useWorkspace();
  const { user } = useAuth();

  // Carregar discussões do banco
  const loadDiscussions = useCallback(async () => {
    if (!currentWorkspaceId) {
      setDiscussions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from('discussions')
        .select(`
          *,
          author:profiles!discussions_author_id_fkey(id, full_name, nickname, avatar_url)
        `)
        .eq('workspace_id', currentWorkspaceId)
        .order('last_activity_at', { ascending: false });

      // Aplicar filtro de status se fornecido
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Calcular mensagens não lidas para cada discussão
      const discussionsWithUnread = await Promise.all(
        (data || []).map(async (discussion) => {
          const unreadCount = await getUnreadCount(discussion.id);
          return {
            ...discussion,
            unreadCount,
          };
        })
      );

      setDiscussions(discussionsWithUnread);
      setError(null);
    } catch (err) {
      console.error('Error loading discussions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId, filterStatus, supabase]);

  // Obter contador de mensagens não lidas
  const getUnreadCount = async (discussionId) => {
    if (!user) return 0;

    try {
      // Buscar última mensagem lida pelo usuário
      const { data: readStatus } = await supabase
        .from('discussion_read_status')
        .select('last_read_message_id, last_read_at')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .single();

      if (!readStatus) {
        // Se não tem registro de leitura, contar todas as mensagens que não são do usuário
        const { count } = await supabase
          .from('discussion_messages')
          .select('*', { count: 'exact', head: true })
          .eq('discussion_id', discussionId)
          .neq('author_id', user.id);

        return count || 0;
      }

      // Contar mensagens após a última leitura
      const { count } = await supabase
        .from('discussion_messages')
        .select('*', { count: 'exact', head: true })
        .eq('discussion_id', discussionId)
        .neq('author_id', user.id)
        .gt('created_at', readStatus.last_read_at);

      return count || 0;
    } catch (err) {
      console.error('Error getting unread count:', err);
      return 0;
    }
  };

  // Criar nova discussão
  const createDiscussion = async (discussionData) => {
    if (!currentWorkspaceId || !user) {
      throw new Error('Workspace ou usuário não encontrado');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('discussions')
        .insert({
          workspace_id: currentWorkspaceId,
          author_id: user.id,
          title: discussionData.title,
          description: discussionData.description,
          treta_reason: discussionData.treta_reason || null,
          category: discussionData.category,
          image_url: discussionData.image_url || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { data, error: null };
    } catch (err) {
      console.error('Error creating discussion:', err);
      return { data: null, error: err.message };
    }
  };

  // Atualizar discussão
  const updateDiscussion = async (discussionId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('discussions')
        .update(updates)
        .eq('id', discussionId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (err) {
      console.error('Error updating discussion:', err);
      return { data: null, error: err.message };
    }
  };

  // Deletar discussão
  const deleteDiscussion = async (discussionId) => {
    try {
      const { error: deleteError } = await supabase
        .from('discussions')
        .delete()
        .eq('id', discussionId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      console.error('Error deleting discussion:', err);
      return { error: err.message };
    }
  };

  // Marcar discussão como lida
  const markAsRead = async (discussionId, lastMessageId = null) => {
    if (!user) return;

    try {
      // Upsert (insert or update) do status de leitura
      const { error: upsertError } = await supabase
        .from('discussion_read_status')
        .upsert({
          discussion_id: discussionId,
          user_id: user.id,
          last_read_message_id: lastMessageId,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'discussion_id,user_id'
        });

      if (upsertError) throw upsertError;

      // Atualizar contador local
      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussionId ? { ...d, unreadCount: 0 } : d
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Upload de imagem para discussão
  const uploadImage = async (file) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('burocracias-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('burocracias-images')
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (err) {
      console.error('Error uploading image:', err);
      return { url: null, error: err.message };
    }
  };

  // Carregar discussões ao montar e quando workspace mudar
  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  // Subscrição Realtime para mudanças nas discussões
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const channel = supabase
      .channel('discussions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussions',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Nova discussão criada
            const { data: newDiscussion } = await supabase
              .from('discussions')
              .select(`
                *,
                author:profiles!discussions_author_id_fkey(id, full_name, nickname, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (newDiscussion) {
              setDiscussions((prev) => [{ ...newDiscussion, unreadCount: 0 }, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Discussão atualizada
            setDiscussions((prev) =>
              prev.map((d) =>
                d.id === payload.new.id
                  ? { ...d, ...payload.new }
                  : d
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Discussão deletada
            setDiscussions((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscrição para mudanças nas mensagens (atualizar contador de não lidas)
    const messagesChannel = supabase
      .channel('discussion-messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_messages',
        },
        async (payload) => {
          // Atualizar contador de não lidas se a mensagem não é do usuário atual
          if (payload.new.author_id !== user?.id) {
            const discussionId = payload.new.discussion_id;
            const unreadCount = await getUnreadCount(discussionId);

            setDiscussions((prev) =>
              prev.map((d) =>
                d.id === discussionId
                  ? { ...d, unreadCount, last_activity_at: payload.new.created_at }
                  : d
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentWorkspaceId, supabase, user]);

  return {
    discussions,
    loading,
    error,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    markAsRead,
    uploadImage,
    refresh: loadDiscussions,
  };
}

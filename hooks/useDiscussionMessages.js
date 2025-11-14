'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para gerenciar mensagens de uma discussão
 * - Carrega mensagens com autores
 * - Sincronização em tempo real via Supabase Realtime
 * - Suporte a threads (Fase 3)
 * - CRUD de mensagens
 * - Reações
 */
export function useDiscussionMessages(discussionId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const supabase = createClient();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Carregar mensagens do banco
  const loadMessages = useCallback(async () => {
    if (!discussionId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('discussion_messages')
        .select(`
          *,
          author:profiles!discussion_messages_author_id_fkey(
            id,
            full_name,
            nickname,
            avatar_url
          ),
          reactions:discussion_reactions(
            id,
            emoji,
            user_id,
            user:profiles!discussion_reactions_user_id_fkey(
              id,
              full_name,
              nickname
            )
          )
        `)
        .eq('discussion_id', discussionId)
        .is('parent_message_id', null) // Apenas mensagens principais (não threads)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
      setError(null);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [discussionId, supabase]);

  // Enviar notificação para o parceiro
  const sendNotification = async (type, metadata = {}) => {
    try {
      // Buscar workspace e parceiro
      const { data: discussion } = await supabase
        .from('discussions')
        .select('workspace_id')
        .eq('id', discussionId)
        .single();

      if (!discussion) return;

      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', discussion.workspace_id);

      // Encontrar parceiro (outro membro que não é o usuário atual)
      const partner = members?.find(m => m.user_id !== user.id);
      if (!partner) return;

      // Enviar notificação via API
      await fetch('/api/burocracias/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discussionId,
          recipientId: partner.user_id,
          senderId: user.id,
          type,
          metadata: {
            ...metadata,
            senderId: user.id,
          },
        }),
      });
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  // Enviar nova mensagem
  const sendMessage = async (content, imageUrl = null, parentMessageId = null) => {
    if (!discussionId || !user) {
      throw new Error('Discussão ou usuário não encontrado');
    }

    if (!content.trim() && !imageUrl) {
      throw new Error('Mensagem não pode estar vazia');
    }

    setSending(true);

    try {
      const threadLevel = parentMessageId ? 1 : 0; // 0 = principal, 1 = thread (Fase 3)

      const { data, error: insertError } = await supabase
        .from('discussion_messages')
        .insert({
          discussion_id: discussionId,
          author_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
          parent_message_id: parentMessageId,
          thread_level: threadLevel,
        })
        .select(`
          *,
          author:profiles!discussion_messages_author_id_fkey(
            id,
            full_name,
            nickname,
            avatar_url
          )
        `)
        .single();

      if (insertError) throw insertError;

      // Enviar notificação
      const notifType = parentMessageId ? 'thread_reply' : 'new_message';
      await sendNotification(notifType, {
        messageContent: content.trim(),
        threadContext: parentMessageId ? 'resposta em thread' : null,
      });

      return { data, error: null };
    } catch (err) {
      console.error('Error sending message:', err);
      return { data: null, error: err.message };
    } finally {
      setSending(false);
    }
  };

  // Editar mensagem
  const editMessage = async (messageId, newContent) => {
    if (!messageId || !newContent.trim()) {
      throw new Error('ID ou conteúdo inválido');
    }

    try {
      const { data, error: updateError } = await supabase
        .from('discussion_messages')
        .update({
          content: newContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('author_id', user.id) // Só pode editar próprias mensagens
        .select()
        .single();

      if (updateError) throw updateError;

      return { data, error: null };
    } catch (err) {
      console.error('Error editing message:', err);
      return { data: null, error: err.message };
    }
  };

  // Deletar mensagem
  const deleteMessage = async (messageId) => {
    if (!messageId) {
      throw new Error('ID da mensagem inválido');
    }

    try {
      const { error: deleteError } = await supabase
        .from('discussion_messages')
        .update({
          is_deleted: true,
          content: 'Mensagem deletada',
        })
        .eq('id', messageId)
        .eq('author_id', user.id); // Só pode deletar próprias mensagens

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      console.error('Error deleting message:', err);
      return { error: err.message };
    }
  };

  // Fixar/Desafixar mensagem como argumento
  const togglePinMessage = async (messageId, isPinned) => {
    if (!messageId) {
      throw new Error('ID da mensagem inválido');
    }

    try {
      const { data, error: updateError } = await supabase
        .from('discussion_messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Enviar notificação se fixou
      if (isPinned) {
        await sendNotification('pinned_argument', {});
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error toggling pin:', err);
      return { data: null, error: err.message };
    }
  };

  // Adicionar reação
  const addReaction = async (messageId, emoji) => {
    if (!messageId || !emoji || !user) {
      throw new Error('Dados inválidos');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('discussion_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji: emoji,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return { data, error: null };
    } catch (err) {
      console.error('Error adding reaction:', err);
      return { data: null, error: err.message };
    }
  };

  // Remover reação
  const removeReaction = async (messageId, emoji) => {
    if (!messageId || !emoji || !user) {
      throw new Error('Dados inválidos');
    }

    try {
      const { error: deleteError } = await supabase
        .from('discussion_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      console.error('Error removing reaction:', err);
      return { error: err.message };
    }
  };

  // Upload de imagem para mensagem
  const uploadMessageImage = async (file) => {
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

  // Scroll para o final (últimas mensagens)
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll para mensagem específica
  const scrollToMessage = (messageId, behavior = 'smooth') => {
    const element = document.getElementById(`message-${messageId}`);
    element?.scrollIntoView({ behavior, block: 'center' });
  };

  // Carregar mensagens ao montar
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscrição Realtime para novas mensagens
  useEffect(() => {
    if (!discussionId) return;

    const channel = supabase
      .channel(`discussion-messages-${discussionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_messages',
          filter: `discussion_id=eq.${discussionId}`,
        },
        async (payload) => {
          // Carregar dados completos da nova mensagem (com autor)
          const { data: newMessage } = await supabase
            .from('discussion_messages')
            .select(`
              *,
              author:profiles!discussion_messages_author_id_fkey(
                id,
                full_name,
                nickname,
                avatar_url
              ),
              reactions:discussion_reactions(
                id,
                emoji,
                user_id,
                user:profiles!discussion_reactions_user_id_fkey(
                  id,
                  full_name,
                  nickname
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage && !newMessage.parent_message_id) {
            setMessages((prev) => [...prev, newMessage]);

            // Auto-scroll se for mensagem do usuário atual
            if (newMessage.author_id === user?.id) {
              setTimeout(() => scrollToBottom(), 100);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'discussion_messages',
          filter: `discussion_id=eq.${discussionId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'discussion_messages',
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    // Subscrição para reações
    const reactionsChannel = supabase
      .channel(`discussion-reactions-${discussionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussion_reactions',
        },
        async () => {
          // Recarregar mensagens quando reações mudarem
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reactionsChannel);
    };
  }, [discussionId, supabase, user, loadMessages]);

  // Obter mensagens fixadas
  const pinnedMessages = messages.filter((msg) => msg.is_pinned);

  return {
    messages,
    pinnedMessages,
    loading,
    error,
    sending,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePinMessage,
    addReaction,
    removeReaction,
    uploadMessageImage,
    scrollToBottom,
    scrollToMessage,
    messagesEndRef,
    refresh: loadMessages,
  };
}

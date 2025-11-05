'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUserWorkspaces } from '@/lib/api/workspace';

/**
 * Hook para sincronização em tempo real de mensagens via Supabase Realtime
 * Atualiza automaticamente quando há mudanças (INSERT, UPDATE, DELETE)
 */
export function useRealtimeMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);

  // Get workspace ID
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const getWorkspace = async () => {
      try {
        const workspacesData = await getUserWorkspaces(user.id);
        if (workspacesData.length > 0) {
          setWorkspaceId(workspacesData[0].workspace_id);
        }
      } catch (err) {
        console.error('Error getting workspace:', err);
        setError(err.message);
      }
    };

    getWorkspace();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    setLoading(true);

    // Initial load
    const loadMessages = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('content')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('type', 'message')
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const formattedMessages = data.map(item => ({
          id: item.id,
          title: item.data?.title || 'Mensagem',
          message: item.data?.message || '',
          author: item.data?.author || user?.email || 'Você',
          date: item.created_at,
        }));

        setMessages(formattedMessages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadMessages();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('🔄 Realtime message change:', payload);

          if (payload.eventType === 'INSERT') {
            const newItem = payload.new;
            if (newItem.type === 'message') {
              const newMessage = {
                id: newItem.id,
                title: newItem.data?.title || 'Mensagem',
                message: newItem.data?.message || '',
                author: newItem.data?.author || user?.email || 'Você',
                date: newItem.created_at,
              };
              setMessages((prev) => [newMessage, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new;
            if (updatedItem.type === 'message') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === updatedItem.id
                    ? {
                        ...msg,
                        title: updatedItem.data?.title || msg.title,
                        message: updatedItem.data?.message || msg.message,
                        author: updatedItem.data?.author || msg.author,
                      }
                    : msg
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, user]);

  return { messages, loading, error };
}

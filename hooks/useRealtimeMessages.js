'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // ✅ Refs para manter estado persistente
  const supabaseRef = useRef(null);
  const workspaceRef = useRef(null);
  const channelRef = useRef(null);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  // ✅ Load messages com timeout
  const loadMessages = useCallback(async () => {
    if (!supabaseRef.current || !workspaceRef.current) {
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Timeout de 8 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const { data, error: fetchError } = await supabaseRef.current
        .from('content')
        .select('*')
        .eq('workspace_id', workspaceRef.current)
        .eq('type', 'message')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (fetchError) throw fetchError;

      const formattedMessages = data.map(item => ({
        id: item.id,
        title: item.data?.title || 'Mensagem',
        message: item.data?.message || '',
        author: item.data?.author || user?.email || 'Você',
        date: item.created_at,
      }));

      setMessages(formattedMessages);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('❌ Messages load timed out');
        setError('Request timed out');
      } else {
        console.error('Error loading messages:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // ✅ Prevenir múltiplas inicializações
    if (initializingRef.current || initializedRef.current) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    initializingRef.current = true;

    const initAuth = async () => {
      try {
        // ✅ Criar instância única
        if (!supabaseRef.current) {
          supabaseRef.current = createClient();
        }
        
        const workspacesData = await getUserWorkspaces(user.id);
        if (workspacesData.length > 0) {
          workspaceRef.current = workspacesData[0].workspace_id;
          await loadMessages();

          // ✅ Setup subscription apenas se não existir
          if (!channelRef.current) {
            setupRealtimeSubscription(supabaseRef.current, workspaceRef.current);
          }
        }

        initializedRef.current = true;
        initializingRef.current = false;
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
        setLoading(false);
        initializingRef.current = false;
      }
    };

    initAuth();

    // ✅ Cleanup completo
    return () => {
      if (channelRef.current && supabaseRef.current) {
        console.log('🧹 Cleaning up messages subscription');
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // ✅ SEM DEPENDÊNCIAS - executa apenas uma vez

  const setupRealtimeSubscription = (supabase, workspaceId) => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('📡 Realtime message change:', payload);

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
      .subscribe((status) => {
        console.log('📡 Messages subscription status:', status);
      });

    channelRef.current = channel;
  };

  return { messages, loading, error, refresh: loadMessages };
}

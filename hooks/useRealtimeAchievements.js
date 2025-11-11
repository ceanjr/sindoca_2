'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUserWorkspaces } from '@/lib/api/workspace';

/**
 * Hook para sincronização em tempo real de conquistas via Supabase Realtime
 * Atualiza automaticamente quando há mudanças (INSERT, UPDATE, DELETE)
 */
export function useRealtimeAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Refs para manter estado persistente
  const supabaseRef = useRef(null);
  const workspaceRef = useRef(null);
  const channelRef = useRef(null);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  // ✅ Load achievements com timeout
  const loadAchievements = useCallback(async () => {
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
        .eq('type', 'achievement')
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (fetchError) throw fetchError;

      const formattedAchievements = data.map(item => ({
        id: item.id,
        title: item.data?.title || 'Conquista',
        description: item.data?.description || '',
        icon: item.data?.icon || 'Trophy',
        date: item.data?.date || item.created_at,
        isSecret: item.data?.isSecret || false,
        isRevealed: item.data?.isRevealed || false,
      }));

      setAchievements(formattedAchievements);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('❌ Achievements load timed out');
        setError('Request timed out');
      } else {
        console.error('Error loading achievements:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
          await loadAchievements();

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
        console.log('🧹 Cleaning up achievements subscription');
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // ✅ SEM DEPENDÊNCIAS - executa apenas uma vez

  const setupRealtimeSubscription = (supabase, workspaceId) => {
    const channel = supabase
      .channel('achievements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('📡 Realtime achievement change:', payload);

          if (payload.eventType === 'INSERT') {
            const newItem = payload.new;
            if (newItem.type === 'achievement') {
              const newAchievement = {
                id: newItem.id,
                title: newItem.data?.title || 'Conquista',
                description: newItem.data?.description || '',
                icon: newItem.data?.icon || 'Trophy',
                date: newItem.data?.date || newItem.created_at,
                isSecret: newItem.data?.isSecret || false,
                isRevealed: newItem.data?.isRevealed || false,
              };
              setAchievements((prev) => [newAchievement, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new;
            if (updatedItem.type === 'achievement') {
              setAchievements((prev) =>
                prev.map((ach) =>
                  ach.id === updatedItem.id
                    ? {
                        ...ach,
                        title: updatedItem.data?.title || ach.title,
                        description: updatedItem.data?.description || ach.description,
                        icon: updatedItem.data?.icon || ach.icon,
                        date: updatedItem.data?.date || ach.date,
                        isSecret: updatedItem.data?.isSecret ?? ach.isSecret,
                        isRevealed: updatedItem.data?.isRevealed ?? ach.isRevealed,
                      }
                    : ach
                )
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setAchievements((prev) => prev.filter((ach) => ach.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Achievements subscription status:', status);
      });

    channelRef.current = channel;
  };

  return { achievements, loading, error, refresh: loadAchievements };
}

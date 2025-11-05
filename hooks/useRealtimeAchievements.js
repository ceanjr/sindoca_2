'use client';

import { useState, useEffect } from 'react';
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
    const loadAchievements = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('content')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('type', 'achievement')
          .order('created_at', { ascending: false });

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
        setLoading(false);
      } catch (err) {
        console.error('Error loading achievements:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadAchievements();

    // Subscribe to realtime changes
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
          console.log('🔄 Realtime achievement change:', payload);

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
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, user]);

  return { achievements, loading, error };
}

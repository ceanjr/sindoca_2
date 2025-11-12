/**
 * Hook for managing emoji reactions on content
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useReactions(contentId) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState([]);
  const [myReaction, setMyReaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load reactions for this content
  const loadReactions = useCallback(async () => {
    if (!contentId) return;

    try {
      const { data, error } = await supabase
        .from('reactions')
        .select('id, user_id, emoji, created_at')
        .eq('content_id', contentId)
        .eq('type', 'emoji')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setReactions(data || []);
      
      // Find current user's reaction
      const userReaction = data?.find((r) => r.user_id === user?.id);
      setMyReaction(userReaction?.emoji || null);
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setLoading(false);
    }
  }, [contentId, user?.id, supabase]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!contentId) return;

    const channel = supabase
      .channel(`reactions:${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `content_id=eq.${contentId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReactions((prev) => [...prev, payload.new]);
            if (payload.new.user_id === user?.id) {
              setMyReaction(payload.new.emoji);
            }
          } else if (payload.eventType === 'DELETE') {
            setReactions((prev) => prev.filter((r) => r.id !== payload.old.id));
            if (payload.old.user_id === user?.id) {
              setMyReaction(null);
            }
          } else if (payload.eventType === 'UPDATE') {
            setReactions((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            );
            if (payload.new.user_id === user?.id) {
              setMyReaction(payload.new.emoji);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentId, user?.id, supabase]);

  // Add or update reaction
  const addReaction = useCallback(
    async (emoji) => {
      if (!user || !contentId) return { success: false };

      try {
        // Check if user already has a reaction
        const existingReaction = reactions.find((r) => r.user_id === user.id);

        if (existingReaction) {
          // Update existing reaction
          const { error } = await supabase
            .from('reactions')
            .update({ emoji, updated_at: new Date().toISOString() })
            .eq('id', existingReaction.id);

          if (error) throw error;
        } else {
          // Insert new reaction
          const { error } = await supabase
            .from('reactions')
            .insert({
              content_id: contentId,
              user_id: user.id,
              type: 'emoji',
              emoji,
            });

          if (error) throw error;
        }

        return { success: true };
      } catch (error) {
        console.error('Error adding reaction:', error);
        toast.error('Erro ao adicionar reação');
        return { success: false, error };
      }
    },
    [contentId, user, reactions, supabase]
  );

  // Remove reaction
  const removeReaction = useCallback(async () => {
    if (!user || !contentId) return { success: false };

    try {
      const existingReaction = reactions.find((r) => r.user_id === user.id);
      
      if (!existingReaction) {
        return { success: true }; // Nothing to remove
      }

      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast.error('Erro ao remover reação');
      return { success: false, error };
    }
  }, [contentId, user, reactions, supabase]);

  // Toggle reaction (add if not exists, remove if exists)
  const toggleReaction = useCallback(
    async (emoji) => {
      if (myReaction === emoji) {
        return await removeReaction();
      } else {
        return await addReaction(emoji);
      }
    },
    [myReaction, addReaction, removeReaction]
  );

  // Get reaction counts grouped by emoji
  const reactionCounts = reactions.reduce((acc, reaction) => {
    if (!reaction.emoji) return acc;
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {});

  return {
    reactions,
    myReaction,
    loading,
    reactionCounts,
    addReaction,
    removeReaction,
    toggleReaction,
    refresh: loadReactions,
  };
}

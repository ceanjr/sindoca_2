/**
 * Hook for real-time playlist sync
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimePlaylist() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playlistUrl, setPlaylistUrl] = useState(null);
  const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
  const [partnerName, setPartnerName] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(true); // Default to true for first add
  const supabaseRef = useRef(null);
  const userRef = useRef(null);
  const workspaceRef = useRef(null);
  const channelRef = useRef(null);
  const workspaceChannelRef = useRef(null);

  useEffect(() => {
    const initPlaylist = async () => {
      try {
        const supabase = createClient();
        supabaseRef.current = supabase;

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setLoading(false);
          return;
        }

        userRef.current = user;

        const { data: members, error: membersError } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        if (membersError || !members) {
          setLoading(false);
          return;
        }

        workspaceRef.current = members.workspace_id;
        await loadTracks();
        await loadPlaylistUrl();
        await loadTurnInfo();
        await loadPartnerName();
        setupRealtimeSubscription(supabase, members.workspace_id);
        setupWorkspaceSubscription(supabase, members.workspace_id);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initPlaylist();

    // Cleanup subscriptions on unmount
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
      if (workspaceChannelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(workspaceChannelRef.current);
      }
    };
  }, []);

  const loadTracks = useCallback(async () => {
    if (!supabaseRef.current || !workspaceRef.current) return;

    try {
      setLoading(true);
      const { data, error } = await supabaseRef.current
        .from('content')
        .select(`
          *,
          profiles!author_id (
            id,
            full_name,
            avatar_url
          ),
          reactions!content_id (
            user_id,
            type
          )
        `)
        .eq('workspace_id', workspaceRef.current)
        .eq('type', 'music')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include favorite status
      const transformedTracks = (data || []).map((track) => {
        const isFavorite = track.reactions?.some(
          (reaction) =>
            reaction.type === 'favorite' &&
            reaction.user_id === userRef.current?.id
        );
        return {
          ...track,
          isFavorite,
        };
      });

      setTracks(transformedTracks);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlaylistUrl = useCallback(async () => {
    if (!supabaseRef.current || !workspaceRef.current) return;

    try {
      const { data, error } = await supabaseRef.current
        .from('workspaces')
        .select('data')
        .eq('id', workspaceRef.current)
        .single();

      if (error) throw error;

      setPlaylistUrl(data?.data?.spotify_playlist_url || null);
    } catch (err) {
      console.error('Failed to load playlist URL:', err);
    }
  }, []);

  const loadTurnInfo = useCallback(async () => {
    if (!supabaseRef.current || !workspaceRef.current || !userRef.current) return;

    try {
      const { data, error } = await supabaseRef.current
        .from('workspaces')
        .select('data')
        .eq('id', workspaceRef.current)
        .single();

      if (error) throw error;

      const turnUserId = data?.data?.current_music_turn_user_id;
      setCurrentTurnUserId(turnUserId);

      // If no turn is set, it's the first person's turn (whoever adds first)
      if (!turnUserId) {
        setIsMyTurn(true);
      } else {
        setIsMyTurn(turnUserId === userRef.current.id);
      }
    } catch (err) {
      console.error('Failed to load turn info:', err);
    }
  }, []);

  const loadPartnerName = useCallback(async () => {
    if (!supabaseRef.current || !workspaceRef.current || !userRef.current) return;

    try {
      // Get all members of the workspace
      const { data: members, error: membersError } = await supabaseRef.current
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspaceRef.current);

      if (membersError) throw membersError;

      // Find the partner (the other user)
      const partnerId = members?.find(m => m.user_id !== userRef.current.id)?.user_id;

      if (partnerId) {
        // Get partner's profile
        const { data: profile, error: profileError } = await supabaseRef.current
          .from('profiles')
          .select('full_name, nickname')
          .eq('id', partnerId)
          .single();

        if (profileError) throw profileError;

        setPartnerName(profile?.nickname || profile?.full_name || 'Seu parceiro');
      }
    } catch (err) {
      console.error('Failed to load partner name:', err);
    }
  }, []);

  const setupWorkspaceSubscription = (supabase, workspaceId) => {
    const channel = supabase
      .channel(`workspace-${workspaceId}-data`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspaces',
          filter: `id=eq.${workspaceId}`,
        },
        (payload) => {
          // Update turn info when workspace data changes
          const turnUserId = payload.new?.data?.current_music_turn_user_id;
          setCurrentTurnUserId(turnUserId);

          if (!turnUserId) {
            setIsMyTurn(true);
          } else {
            setIsMyTurn(turnUserId === userRef.current?.id);
          }

          // Update playlist URL if changed
          const playlistUrl = payload.new?.data?.spotify_playlist_url;
          if (playlistUrl) {
            setPlaylistUrl(playlistUrl);
          }
        }
      )
      .subscribe();

    // Store channel for cleanup
    workspaceChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const setupRealtimeSubscription = (supabase, workspaceId) => {
    const channel = supabase
      .channel(`workspace-${workspaceId}-music`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.new?.type === 'music' || payload.old?.type === 'music') {
            loadTracks();
          }
        }
      )
      .subscribe();

    // Store channel for cleanup
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addTrack = async (track) => {
    try {
      const response = await fetch('/api/spotify/playlist/add-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add track');
      }

      // Realtime will handle the update
      return data.track;
    } catch (error) {
      throw error;
    }
  };

  const removeTrack = async (trackId) => {
    try {
      const response = await fetch('/api/spotify/playlist/remove-track', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove track');
      }

      // Realtime will handle the update
    } catch (error) {
      throw error;
    }
  };

  const toggleFavorite = async (trackId) => {
    if (!supabaseRef.current || !userRef.current) {
      throw new Error('Not initialized');
    }

    try {
      const track = tracks.find((t) => t.id === trackId);
      const isFavorite = track?.isFavorite;

      if (isFavorite) {
        // Remove favorite
        const { error } = await supabaseRef.current
          .from('reactions')
          .delete()
          .eq('content_id', trackId)
          .eq('user_id', userRef.current.id)
          .eq('type', 'favorite');

        if (error) throw error;
      } else {
        // Add favorite
        const { error } = await supabaseRef.current
          .from('reactions')
          .insert({
            content_id: trackId,
            user_id: userRef.current.id,
            type: 'favorite',
          });

        if (error) throw error;
      }

      // Update local state immediately
      setTracks((prevTracks) =>
        prevTracks.map((t) =>
          t.id === trackId ? { ...t, isFavorite: !isFavorite } : t
        )
      );

      return !isFavorite;
    } catch (error) {
      throw error;
    }
  };

  return {
    tracks,
    loading,
    error,
    playlistUrl,
    isMyTurn,
    currentTurnUserId,
    partnerName,
    addTrack,
    removeTrack,
    toggleFavorite,
    refresh: loadTracks,
  };
}

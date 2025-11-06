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
  const supabaseRef = useRef(null);
  const userRef = useRef(null);
  const workspaceRef = useRef(null);

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
        setupRealtimeSubscription(supabase, members.workspace_id);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initPlaylist();
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
          )
        `)
        .eq('workspace_id', workspaceRef.current)
        .eq('type', 'music')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTracks(data || []);
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

  return {
    tracks,
    loading,
    error,
    playlistUrl,
    addTrack,
    removeTrack,
    refresh: loadTracks,
  };
}

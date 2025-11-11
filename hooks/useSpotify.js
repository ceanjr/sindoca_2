/**
 * Hook for Spotify integration
 */
'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSpotify() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [spotifyProfile, setSpotifyProfile] = useState(null);

  const checkConnection = useCallback(async () => {
    if (!user) {
      setIsConnected(false);
      setIsLoading(false);
      return false;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('spotify_tokens, spotify_user_id, spotify_display_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking Spotify connection:', error);
        setIsConnected(false);
        setSpotifyProfile(null);
        return false;
      }

      const connected = !!(data?.spotify_tokens && data?.spotify_user_id);
      setIsConnected(connected);
      
      if (connected) {
        setSpotifyProfile({
          userId: data.spotify_user_id,
          displayName: data.spotify_display_name,
        });
      } else {
        setSpotifyProfile(null);
      }

      return connected;
    } catch (error) {
      console.error('Error checking Spotify connection:', error);
      setIsConnected(false);
      setSpotifyProfile(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check connection on mount and when user changes
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connectSpotify = useCallback(() => {
    window.location.href = '/api/spotify/auth';
  }, []);

  const disconnectSpotify = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          spotify_tokens: null,
          spotify_user_id: null,
          spotify_display_name: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsConnected(false);
      setSpotifyProfile(null);
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
      throw error;
    }
  }, [user]);

  return {
    isConnected,
    isLoading,
    spotifyProfile,
    connectSpotify,
    disconnectSpotify,
    checkConnection,
  };
}

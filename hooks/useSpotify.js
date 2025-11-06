/**
 * Hook for Spotify integration
 */
'use client';

import { useState, useCallback } from 'react';

export function useSpotify() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const connectSpotify = useCallback(() => {
    window.location.href = '/api/spotify/auth';
  }, []);

  const checkConnection = useCallback(async () => {
    // This will be checked from profile data
    return isConnected;
  }, [isConnected]);

  return {
    isConnected,
    isLoading,
    connectSpotify,
    checkConnection,
  };
}

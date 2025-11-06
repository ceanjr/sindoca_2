/**
 * Spotify API Client
 */

import { SPOTIFY_API_BASE } from './config';
import { isTokenExpired, refreshAccessToken, SpotifyTokens } from './auth';
import { createClient } from '@/lib/supabase/client';

/**
 * Get valid access token for user (auto-refresh if needed)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('spotify_tokens')
    .eq('id', userId)
    .single();

  if (error || !profile?.spotify_tokens) {
    throw new Error('Spotify not connected');
  }

  const tokens = profile.spotify_tokens as SpotifyTokens;

  if (isTokenExpired(tokens.expires_at)) {
    console.log('🔄 Refreshing Spotify token...');
    const newTokens = await refreshAccessToken(tokens.refresh_token);

    await supabase
      .from('profiles')
      .update({ spotify_tokens: newTokens })
      .eq('id', userId);

    return newTokens.access_token;
  }

  return tokens.access_token;
}

/**
 * Search for tracks on Spotify
 */
export async function searchTracks(
  accessToken: string,
  query: string,
  limit: number = 10
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: limit.toString(),
  });

  const response = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Spotify search failed: ${error.error.message}`);
  }

  const data = await response.json();
  return data.tracks.items.map(mapSpotifyTrack);
}

/**
 * Get user's Spotify profile
 */
export async function getSpotifyProfile(accessToken: string): Promise<SpotifyProfile> {
  const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Get profile failed: ${error.error.message}`);
  }

  return response.json();
}

/**
 * Create a new playlist
 */
export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description: string = ''
): Promise<SpotifyPlaylist> {
  const response = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      public: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Create playlist failed: ${error.error.message}`);
  }

  return response.json();
}

/**
 * Add track to playlist
 */
export async function addTrackToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string
): Promise<void> {
  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: [trackUri],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Add track failed: ${error.error.message}`);
  }
}

/**
 * Remove track from playlist
 */
export async function removeTrackFromPlaylist(
  accessToken: string,
  playlistId: string,
  trackUri: string
): Promise<void> {
  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tracks: [{ uri: trackUri }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Remove track failed: ${error.error.message}`);
  }
}

/**
 * Map Spotify API track to our format
 */
function mapSpotifyTrack(track: any): SpotifyTrack {
  return {
    id: track.id,
    name: track.name,
    uri: track.uri,
    artist: track.artists.map((a: any) => a.name).join(', '),
    album: track.album.name,
    albumCover: track.album.images[0]?.url || '',
    duration_ms: track.duration_ms,
    preview_url: track.preview_url,
    spotify_url: track.external_urls.spotify,
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  artist: string;
  album: string;
  albumCover: string;
  duration_ms: number;
  preview_url: string | null;
  spotify_url: string;
}

export interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: { spotify: string };
}

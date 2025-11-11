/**
 * Spotify API Client
 */

import { SPOTIFY_API_BASE } from './config';
import { isTokenExpired, refreshAccessToken, SpotifyTokens } from './auth';
import { createClient as createClientSide } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * Get valid access token for user (auto-refresh if needed)
 * IMPORTANTE: Esta função detecta automaticamente se está rodando no servidor ou cliente
 * e usa o cliente Supabase correto.
 */
export async function getValidAccessToken(userId: string, isServerSide: boolean = false): Promise<string> {
  // Usar o cliente correto baseado no contexto
  const supabase = isServerSide ? await createServerClient() : createClientSide();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('spotify_tokens')
    .eq('id', userId)
    .single();

  if (error || !profile?.spotify_tokens) {
    throw new Error('Spotify not connected');
  }

  const tokens = profile.spotify_tokens as SpotifyTokens;

  // Verificar se o token expirou (com margem de segurança de 5 minutos)
  if (isTokenExpired(tokens.expires_at)) {
    console.log('🔄 Refreshing Spotify token for user:', userId);
    const newTokens = await refreshAccessToken(tokens.refresh_token);

    // Atualizar tokens no banco de dados
    await supabase
      .from('profiles')
      .update({ spotify_tokens: newTokens })
      .eq('id', userId);

    console.log('✅ Token refreshed successfully');
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
 * Create a new collaborative playlist
 * IMPORTANTE: A playlist é criada como COLABORATIVA para permitir que ambos usuários adicionem músicas
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
      public: false, // Privada, mas colaborativa
      collaborative: true, // ✅ CORREÇÃO CRÍTICA: Permite múltiplos usuários adicionarem músicas
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Create playlist failed: ${error.error.message}`);
  }

  return response.json();
}

/**
 * Update playlist details (tornar colaborativa)
 * Útil para atualizar playlists existentes
 */
export async function updatePlaylistToCollaborative(
  accessToken: string,
  playlistId: string
): Promise<void> {
  const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collaborative: true,
      public: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Update playlist failed: ${error.error?.message || 'Unknown error'}`);
  }
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

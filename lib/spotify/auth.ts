/**
 * Spotify OAuth 2.0 Authentication
 */

import { SPOTIFY_CONFIG, SPOTIFY_AUTH_BASE } from './config';

/**
 * Generate Spotify authorization URL
 */
export function getSpotifyAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: SPOTIFY_CONFIG.redirectUri,
    scope: SPOTIFY_CONFIG.scopes.join(' '),
    state,
    // Removido show_dialog: 'true' para melhor UX
    // Se o usuário já autorizou, não precisa mostrar a tela novamente
  });

  return `${SPOTIFY_AUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<SpotifyTokens> {
  const response = await fetch(`${SPOTIFY_AUTH_BASE}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_CONFIG.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Spotify token exchange failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refresh_token: string): Promise<SpotifyTokens> {
  const response = await fetch(`${SPOTIFY_AUTH_BASE}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CONFIG.clientId}:${SPOTIFY_CONFIG.clientSecret}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Spotify token refresh failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refresh_token,
    expires_in: data.expires_in,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expires_at: number): boolean {
  return Date.now() >= expires_at - 5 * 60 * 1000;
}

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
}

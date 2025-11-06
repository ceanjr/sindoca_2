/**
 * Spotify API Configuration
 */

export const SPOTIFY_CONFIG = {
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback',
  scopes: [
    'playlist-modify-public',
    'playlist-modify-private',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-read-email',
    'user-read-private',
  ],
};

export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
export const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com';

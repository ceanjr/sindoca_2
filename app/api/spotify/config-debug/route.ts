/**
 * Debug endpoint to check Spotify configuration
 * GET /api/spotify/config-debug
 */

import { NextResponse } from 'next/server';
import { SPOTIFY_CONFIG } from '@/lib/spotify/config';

export async function GET() {
  return NextResponse.json({
    clientId: SPOTIFY_CONFIG.clientId?.substring(0, 10) + '...',
    redirectUri: SPOTIFY_CONFIG.redirectUri,
    hasClientSecret: !!SPOTIFY_CONFIG.clientSecret,
    scopes: SPOTIFY_CONFIG.scopes,
    env: process.env.NODE_ENV,
  });
}

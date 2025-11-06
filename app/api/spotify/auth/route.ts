/**
 * Spotify OAuth - Initiate authorization
 * GET /api/spotify/auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyAuthUrl } from '@/lib/spotify/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate state to prevent CSRF
    const state = `${user.id}:${Date.now()}:${Math.random().toString(36).substring(7)}`;
    
    // Store state in cookie for verification in callback
    const response = NextResponse.redirect(getSpotifyAuthUrl(state));
    response.cookies.set('spotify_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Spotify authorization' },
      { status: 500 }
    );
  }
}

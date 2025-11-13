/**
 * Spotify - Search tracks
 * GET /api/spotify/search?q=query
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchTracks } from '@/lib/spotify/client';
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/spotify/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    // Get authenticated user
    // Try to get from cookies first (web), then from header (native app)
    const supabase = await createClient();
    let user = null;
    let userError = null;

    // Try cookies first (web)
    const cookieAuth = await supabase.auth.getUser();
    user = cookieAuth.data.user;
    userError = cookieAuth.error;

    // If no user from cookies, try Authorization header (native app)
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const headerAuth = await supabase.auth.getUser(token);
        user = headerAuth.data.user;
        userError = headerAuth.error;
      }
    }

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get valid access token (auto-refreshes if needed)
    // Passando isServerSide=true pois estamos em uma API route
    const accessToken = await getValidAccessToken(user.id, true);

    // Search tracks
    const tracks = await searchTracks(accessToken, query);

    return NextResponse.json({ tracks });
  } catch (error: any) {
    console.error('Spotify search error:', error);
    
    if (error.message === 'Spotify not connected') {
      return NextResponse.json(
        { error: 'Spotify not connected', needsAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}

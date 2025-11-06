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
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(user.id);

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

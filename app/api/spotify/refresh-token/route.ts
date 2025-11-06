/**
 * Spotify - Refresh access token manually
 * POST /api/spotify/refresh-token
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/spotify/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current tokens
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spotify_tokens')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.spotify_tokens) {
      return NextResponse.json(
        { error: 'Spotify not connected' },
        { status: 400 }
      );
    }

    const currentTokens = profile.spotify_tokens as any;

    // Refresh tokens
    const newTokens = await refreshAccessToken(currentTokens.refresh_token);

    // Update in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ spotify_tokens: newTokens })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, tokens: newTokens });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

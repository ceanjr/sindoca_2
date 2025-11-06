/**
 * Spotify OAuth - Callback handler
 * GET /api/spotify/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/spotify/auth';
import { getSpotifyProfile } from '@/lib/spotify/client';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for Spotify errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/musica?error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/musica?error=invalid_callback', request.url)
      );
    }

    // Verify state to prevent CSRF
    const storedState = request.cookies.get('spotify_auth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/musica?error=state_mismatch', request.url)
      );
    }

    // Get user from session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL('/musica?error=unauthorized', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(code);

    // Get Spotify profile to store user's Spotify ID
    const profile = await getSpotifyProfile(tokens.access_token);

    // Save tokens and Spotify profile to database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        spotify_tokens: tokens,
        spotify_user_id: profile.id,
        spotify_display_name: profile.display_name,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to save Spotify tokens:', updateError);
      return NextResponse.redirect(
        new URL('/musica?error=save_failed', request.url)
      );
    }

    // Success! Clear state cookie and redirect
    const response = NextResponse.redirect(
      new URL('/musica?connected=true', request.url)
    );
    response.cookies.delete('spotify_auth_state');

    return response;
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(
      new URL('/musica?error=callback_failed', request.url)
    );
  }
}

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

    console.log('[Spotify Callback] Iniciando callback...');

    // Check for Spotify errors
    if (error) {
      console.error('[Spotify Callback] Erro do Spotify:', error);
      return NextResponse.redirect(
        new URL(`/musica?error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      console.error('[Spotify Callback] Code ou state ausentes');
      return NextResponse.redirect(
        new URL('/musica?error=invalid_callback', request.url)
      );
    }

    // Verify state to prevent CSRF
    const storedState = request.cookies.get('spotify_auth_state')?.value;
    if (!storedState || storedState !== state) {
      console.error('[Spotify Callback] State mismatch - stored:', storedState, 'received:', state);
      return NextResponse.redirect(
        new URL('/musica?error=state_mismatch', request.url)
      );
    }

    // Get user from session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[Spotify Callback] Usuário não autenticado:', userError);
      return NextResponse.redirect(
        new URL('/musica?error=unauthorized', request.url)
      );
    }

    console.log('[Spotify Callback] Usuário autenticado:', user.id);

    // Exchange code for tokens
    console.log('[Spotify Callback] Trocando code por tokens...');
    const tokens = await exchangeCodeForToken(code);
    console.log('[Spotify Callback] Tokens obtidos com sucesso');

    // Get Spotify profile to store user's Spotify ID
    console.log('[Spotify Callback] Buscando perfil do Spotify...');
    const profile = await getSpotifyProfile(tokens.access_token);
    console.log('[Spotify Callback] Perfil obtido:', profile.display_name, 'ID:', profile.id);

    // Save tokens and Spotify profile to database
    console.log('[Spotify Callback] Salvando no banco de dados...');
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        spotify_tokens: tokens,
        spotify_user_id: profile.id,
        spotify_display_name: profile.display_name,
      })
      .eq('id', user.id)
      .select();

    if (updateError) {
      console.error('[Spotify Callback] Erro ao salvar tokens:', updateError);
      return NextResponse.redirect(
        new URL('/musica?error=save_failed', request.url)
      );
    }

    console.log('[Spotify Callback] Dados salvos com sucesso:', updateData);

    // Success! Clear state cookie and redirect
    const response = NextResponse.redirect(
      new URL('/musica?connected=true', request.url)
    );
    response.cookies.delete('spotify_auth_state');

    console.log('[Spotify Callback] Redirecionando para /musica?connected=true');

    return response;
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(
      new URL('/musica?error=callback_failed', request.url)
    );
  }
}

/**
 * Spotify OAuth - Callback handler
 * GET /api/spotify/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/spotify/auth';
import { getSpotifyProfile } from '@/lib/spotify/client';
import { createClient } from '@/lib/supabase/server';
import { remoteLogger } from '@/lib/utils/remoteLogger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('[Spotify Callback] Iniciando callback...');
    await remoteLogger.info('spotify-callback', '🚀 Callback iniciado', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      url: request.url,
    });

    // Check for Spotify errors
    if (error) {
      console.error('[Spotify Callback] Erro do Spotify:', error);
      await remoteLogger.error('spotify-callback', 'Erro retornado pelo Spotify', { error });
      return NextResponse.redirect(
        new URL(`/musica?error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      console.error('[Spotify Callback] Code ou state ausentes');
      await remoteLogger.error('spotify-callback', 'Code ou state ausentes', { hasCode: !!code, hasState: !!state });
      return NextResponse.redirect(
        new URL('/musica?error=invalid_callback', request.url)
      );
    }

    // Verify state to prevent CSRF
    const storedState = request.cookies.get('spotify_auth_state')?.value;
    await remoteLogger.info('spotify-callback', 'Verificando state', {
      hasStoredState: !!storedState,
      stateMatch: storedState === state,
    });

    if (!storedState || storedState !== state) {
      console.error('[Spotify Callback] State mismatch - stored:', storedState, 'received:', state);
      await remoteLogger.error('spotify-callback', 'State mismatch', {
        storedState,
        receivedState: state,
      });
      return NextResponse.redirect(
        new URL('/musica?error=state_mismatch', request.url)
      );
    }

    // Get user from session
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[Spotify Callback] Usuário não autenticado:', userError);
      await remoteLogger.error('spotify-callback', 'Usuário não autenticado', {
        error: userError?.message,
      });
      return NextResponse.redirect(
        new URL('/musica?error=unauthorized', request.url)
      );
    }

    console.log('[Spotify Callback] Usuário autenticado:', user.id);
    await remoteLogger.info('spotify-callback', '✅ Usuário autenticado', {
      userId: user.id,
      userEmail: user.email,
    });

    // Exchange code for tokens
    console.log('[Spotify Callback] Trocando code por tokens...');
    await remoteLogger.info('spotify-callback', 'Trocando code por tokens...');
    const tokens = await exchangeCodeForToken(code);
    console.log('[Spotify Callback] Tokens obtidos com sucesso');
    await remoteLogger.info('spotify-callback', '✅ Tokens obtidos', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Get Spotify profile to store user's Spotify ID
    console.log('[Spotify Callback] Buscando perfil do Spotify...');
    await remoteLogger.info('spotify-callback', 'Buscando perfil do Spotify...');
    const profile = await getSpotifyProfile(tokens.access_token);
    console.log('[Spotify Callback] Perfil obtido:', profile.display_name, 'ID:', profile.id);
    await remoteLogger.info('spotify-callback', '✅ Perfil obtido', {
      displayName: profile.display_name,
      spotifyId: profile.id,
      email: profile.email,
    });

    // Save tokens and Spotify profile to database
    console.log('[Spotify Callback] Salvando no banco de dados...');
    await remoteLogger.info('spotify-callback', 'Salvando no banco de dados...', {
      userId: user.id,
      spotifyUserId: profile.id,
    });
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
      await remoteLogger.error('spotify-callback', '❌ Erro ao salvar tokens', {
        error: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      });
      return NextResponse.redirect(
        new URL('/musica?error=save_failed', request.url)
      );
    }

    console.log('[Spotify Callback] Dados salvos com sucesso:', updateData);
    await remoteLogger.info('spotify-callback', '✅ Dados salvos com sucesso!', {
      updatedRows: updateData?.length,
      hasTokens: !!updateData?.[0]?.spotify_tokens,
      spotifyUserId: updateData?.[0]?.spotify_user_id,
    });

    // Success! Clear state cookie and redirect
    const response = NextResponse.redirect(
      new URL('/musica?connected=true', request.url)
    );
    response.cookies.delete('spotify_auth_state');

    console.log('[Spotify Callback] Redirecionando para /musica?connected=true');
    await remoteLogger.info('spotify-callback', '🎉 Sucesso! Redirecionando para /musica', {
      redirectUrl: '/musica?connected=true',
    });

    return response;
  } catch (error) {
    console.error('Spotify callback error:', error);
    await remoteLogger.error('spotify-callback', '💥 Erro crítico no callback', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.redirect(
      new URL('/musica?error=callback_failed', request.url)
    );
  }
}

/**
 * Spotify OAuth - Initiate authorization
 * GET /api/spotify/auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyAuthUrl } from '@/lib/spotify/auth';
import { createClient } from '@/lib/supabase/server';
import { remoteLogger } from '@/lib/utils/remoteLogger';

export async function GET(request: NextRequest) {
  try {
    await remoteLogger.info('spotify-auth', '🚀 Iniciando autenticação Spotify', {
      url: request.url,
    });

    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      await remoteLogger.error('spotify-auth', '❌ Usuário não autenticado', {
        error: error?.message,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await remoteLogger.info('spotify-auth', '✅ Usuário autenticado', {
      userId: user.id,
      userEmail: user.email,
    });

    // Generate state to prevent CSRF
    const state = `${user.id}:${Date.now()}:${Math.random().toString(36).substring(7)}`;

    await remoteLogger.info('spotify-auth', 'State gerado e salvando em cookie', {
      stateLength: state.length,
    });

    const authUrl = getSpotifyAuthUrl(state);

    await remoteLogger.info('spotify-auth', '🔗 Redirecionando para Spotify', {
      authUrl: authUrl.substring(0, 100) + '...',
    });

    // Store state in cookie for verification in callback
    // ✅ CORREÇÃO: Retornar HTML com meta redirect para garantir que funcione
    const htmlResponse = new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${authUrl}">
  <meta charset="utf-8">
  <title>Redirecionando para Spotify...</title>
</head>
<body>
  <p>Redirecionando para o Spotify...</p>
  <p>Se não for redirecionado automaticamente, <a href="${authUrl}">clique aqui</a>.</p>
  <script>window.location.href="${authUrl}";</script>
</body>
</html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );

    htmlResponse.cookies.set('spotify_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    return htmlResponse;
  } catch (error) {
    console.error('Spotify auth error:', error);
    await remoteLogger.error('spotify-auth', '💥 Erro crítico na autenticação', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to initiate Spotify authorization' },
      { status: 500 }
    );
  }
}

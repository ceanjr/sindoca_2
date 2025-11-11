/**
 * Debug Spotify Connection for Current User
 * GET /api/spotify/debug-user
 *
 * Retorna informações detalhadas sobre o estado da conexão Spotify do usuário atual
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { remoteLogger } from '@/lib/utils/remoteLogger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      step1_authentication: {},
      step2_profile: {},
      step3_workspace: {},
      step4_spotify_config: {},
      recommendations: [],
    };

    // STEP 1: Verificar autenticação Supabase
    if (userError || !user) {
      debugInfo.step1_authentication = {
        status: '❌ FAILED',
        authenticated: false,
        error: userError?.message || 'No user found',
      };
      debugInfo.recommendations.push('Faça login no Sindoca primeiro');
      return NextResponse.json(debugInfo, { status: 401 });
    }

    debugInfo.step1_authentication = {
      status: '✅ SUCCESS',
      authenticated: true,
      userId: user.id,
      userEmail: user.email,
    };

    // STEP 2: Verificar perfil e tokens Spotify
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('spotify_tokens, spotify_user_id, spotify_display_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      debugInfo.step2_profile = {
        status: '❌ FAILED',
        error: profileError.message,
      };
      debugInfo.recommendations.push('Erro ao buscar perfil no banco de dados');
      return NextResponse.json(debugInfo, { status: 500 });
    }

    const hasTokens = !!profile?.spotify_tokens;
    const hasSpotifyUserId = !!profile?.spotify_user_id;

    debugInfo.step2_profile = {
      status: hasTokens && hasSpotifyUserId ? '✅ SUCCESS' : '⚠️ INCOMPLETE',
      hasSpotifyTokens: hasTokens,
      hasSpotifyUserId: hasSpotifyUserId,
      spotifyUserId: profile?.spotify_user_id || null,
      spotifyDisplayName: profile?.spotify_display_name || null,
    };

    if (hasTokens) {
      const tokens = profile.spotify_tokens as any;
      debugInfo.step2_profile.tokenDetails = {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expires_at,
        isExpired: Date.now() >= (tokens.expires_at - 5 * 60 * 1000),
      };
    }

    if (!hasTokens || !hasSpotifyUserId) {
      debugInfo.recommendations.push(
        '🔴 PROBLEMA PRINCIPAL: Você não está conectado ao Spotify',
        'Clique em "Conectar Spotify" na página /musica',
        'Após autorizar no Spotify, verifique se aparece "Spotify conectado com sucesso!"',
      );
    }

    // STEP 3: Verificar workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      debugInfo.step3_workspace = {
        status: '⚠️ NO WORKSPACE',
        error: membershipError?.message || 'No workspace membership found',
      };
      debugInfo.recommendations.push('Você não está em nenhum workspace');
    } else {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, name, data, creator_id, partner_id')
        .eq('id', membership.workspace_id)
        .single();

      if (workspace) {
        debugInfo.step3_workspace = {
          status: '✅ SUCCESS',
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          role: membership.role,
          isCreator: workspace.creator_id === user.id,
          isPartner: workspace.partner_id === user.id,
          hasSpotifyPlaylist: !!workspace.data?.spotify_playlist_id,
          spotifyPlaylistId: workspace.data?.spotify_playlist_id || null,
          spotifyPlaylistUrl: workspace.data?.spotify_playlist_url || null,
          playlistIsCollaborative: workspace.data?.spotify_playlist_is_collaborative === true,
        };

        if (!workspace.data?.spotify_playlist_is_collaborative) {
          debugInfo.recommendations.push(
            '⚠️ Playlist não está marcada como colaborativa no banco',
            'Execute: POST /api/spotify/playlist/make-collaborative',
          );
        }
      }
    }

    // STEP 4: Verificar configurações do Spotify (variáveis de ambiente)
    debugInfo.step4_spotify_config = {
      hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
      hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
      redirectUriIsCorrect: process.env.SPOTIFY_REDIRECT_URI?.includes('sindoca.vercel.app'),
    };

    if (!process.env.SPOTIFY_REDIRECT_URI?.includes('sindoca.vercel.app')) {
      debugInfo.recommendations.push(
        '⚠️ SPOTIFY_REDIRECT_URI pode estar incorreto',
        'Deve ser: https://sindoca.vercel.app/api/spotify/callback',
      );
    }

    // FINAL SUMMARY
    debugInfo.summary = {
      isFullyConnected: hasTokens && hasSpotifyUserId,
      canAddMusic: hasTokens && hasSpotifyUserId && debugInfo.step3_workspace.hasSpotifyPlaylist,
      mainIssue: !hasTokens
        ? 'Usuário não conectou ao Spotify ainda'
        : !hasSpotifyUserId
        ? 'Tokens salvos mas spotify_user_id faltando (erro no callback)'
        : 'Tudo OK!',
    };

    await remoteLogger.info('spotify-debug', 'Debug info gerado', {
      userId: user.id,
      email: user.email,
      isConnected: hasTokens && hasSpotifyUserId,
    });

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate debug info',
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

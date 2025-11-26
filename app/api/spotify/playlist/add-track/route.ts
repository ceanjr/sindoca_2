/**
 * Add track to workspace playlist
 * POST /api/spotify/playlist/add-track
 *
 * CORREÇÕES APLICADAS:
 * - Usa Supabase server-side corretamente
 * - Cria playlist como colaborativa
 * - Torna playlist existente colaborativa se necessário
 * - Valida permissões de ambos usuários
 */

import { NextRequest, NextResponse } from 'next/server';
import { addTrackToPlaylist, createPlaylist, getValidAccessToken, updatePlaylistToCollaborative } from '@/lib/spotify/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { track } = body;

    if (!track || !track.id || !track.uri) {
      return NextResponse.json({ error: 'Invalid track data' }, { status: 400 });
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

    // Get user's workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const workspaceId = membership.workspace_id;

    // Get or create Spotify playlist ID for this workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('data')
      .eq('id', workspaceId)
      .single();

    if (workspaceError) {
      return NextResponse.json({ error: 'Failed to get workspace' }, { status: 500 });
    }

    // Check turn - if a turn is set, verify it's this user's turn
    // Only enforce turns if data field exists and has turn info
    if (workspace.data && typeof workspace.data === 'object' && workspace.data !== null) {
      const currentTurnUserId = workspace.data.current_music_turn_user_id;
      if (currentTurnUserId && currentTurnUserId !== user.id) {
        return NextResponse.json(
          { error: 'Not your turn to add a track' },
          { status: 403 }
        );
      }
    }

    let spotifyPlaylistId = workspace.data?.spotify_playlist_id;
    let isPlaylistCollaborative = workspace.data?.spotify_playlist_is_collaborative === true;

    // ✅ CORREÇÃO: Passar isServerSide=true pois estamos em uma API route
    const accessToken = await getValidAccessToken(user.id, true);

    // Create Spotify playlist if doesn't exist
    if (!spotifyPlaylistId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('spotify_user_id')
        .eq('id', user.id)
        .single();

      if (!profile?.spotify_user_id) {
        return NextResponse.json({ error: 'Spotify user ID not found' }, { status: 400 });
      }

      // ✅ CORREÇÃO: A playlist já é criada como colaborativa (ver lib/spotify/client.ts)
      const playlist = await createPlaylist(
        accessToken,
        profile.spotify_user_id,
        'Nossa Trilha Sonora ❤️',
        'Playlist criada pelo Sindoca - Colaborativa para ambos os parceiros'
      );

      spotifyPlaylistId = playlist.id;
      isPlaylistCollaborative = true;

      // Save playlist ID to workspace
      await supabase
        .from('workspaces')
        .update({
          data: {
            ...workspace.data,
            spotify_playlist_id: spotifyPlaylistId,
            spotify_playlist_url: playlist.external_urls.spotify,
            spotify_playlist_is_collaborative: true,
          },
        })
        .eq('id', workspaceId);

      console.log('✅ Playlist colaborativa criada:', spotifyPlaylistId);
    } else if (!isPlaylistCollaborative) {
      // ✅ CORREÇÃO: Se a playlist existe mas não é colaborativa, torná-la colaborativa
      try {
        console.log('🔄 Tornando playlist existente colaborativa:', spotifyPlaylistId);
        await updatePlaylistToCollaborative(accessToken, spotifyPlaylistId);

        // Atualizar flag no workspace
        await supabase
          .from('workspaces')
          .update({
            data: {
              ...workspace.data,
              spotify_playlist_is_collaborative: true,
            },
          })
          .eq('id', workspaceId);

        console.log('✅ Playlist atualizada para colaborativa');
      } catch (error) {
        console.error('⚠️ Erro ao tornar playlist colaborativa:', error);
        // Continuar mesmo se falhar - pode já ser colaborativa ou usuário não ter permissão
      }
    }

    // Add track to Spotify playlist
    await addTrackToPlaylist(accessToken, spotifyPlaylistId, track.uri);

    // Save track to database
    const { data: savedTrack, error: saveError } = await supabase
      .from('content')
      .insert({
        workspace_id: workspaceId,
        author_id: user.id,
        type: 'music',
        title: track.name,
        description: track.artist,
        data: {
          spotify_track_id: track.id,
          spotify_uri: track.uri,
          spotify_url: track.spotify_url,
          preview_url: track.preview_url,
          album_cover: track.albumCover,
          duration_ms: track.duration_ms,
          artist: track.artist,
          album: track.album,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save track:', saveError);
      return NextResponse.json({ error: 'Failed to save track' }, { status: 500 });
    }

    // Get all members to alternate turn properly (supports multiple users)
    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true }); // Ordem consistente

    // Find next user in rotation (circular)
    let nextUserId: string | undefined;

    if (members && members.length > 0) {
      const currentUserIndex = members.findIndex(m => m.user_id === user.id);

      if (currentUserIndex !== -1) {
        // Get next user in circular fashion
        const nextIndex = (currentUserIndex + 1) % members.length;
        nextUserId = members[nextIndex].user_id;

        console.log(`[Music Turn] Current: ${user.id} (index ${currentUserIndex}), Next: ${nextUserId} (index ${nextIndex})`);
      } else {
        // Fallback: first user that's not current user
        nextUserId = members.find(m => m.user_id !== user.id)?.user_id;
      }
    }

    // Get all partners for notifications (everyone except current user)
    const partnerIds = members?.filter(m => m.user_id !== user.id).map(m => m.user_id) || [];

    // Send push notification to ALL partners
    if (partnerIds.length > 0) {
      // Get current user's profile (author of the music)
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('full_name, nickname')
        .eq('id', user.id)
        .single();

      const authorName = authorProfile?.nickname || authorProfile?.full_name || 'Alguém';

      // Send to all partners in parallel
      const notificationPromises = partnerIds.map(partnerId =>
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
          },
          body: JSON.stringify({
            recipientUserId: partnerId,
            title: `🎵 ${authorName} adicionou uma nova música!`,
            body: `${track.name} - ${track.artist}`,
            icon: track.albumCover || '/icon-192x192.png',
            tag: 'new-music',
            data: { url: '/musica' },
          }),
        }).catch(err => {
          console.error(`Error sending push to ${partnerId}:`, err);
          return null;
        })
      );

      try {
        await Promise.allSettled(notificationPromises);
        console.log(`Push notifications sent to ${partnerIds.length} partner(s)`);
      } catch (error) {
        console.error('Error sending push notifications:', error);
        // Don't fail the request if push fails
      }
    }

    // Update turn to NEXT user in rotation (circular)
    if (nextUserId) {
      await supabase
        .from('workspaces')
        .update({
          data: {
            ...workspace.data,
            current_music_turn_user_id: nextUserId,
          },
        })
        .eq('id', workspaceId);

      console.log(`[Music Turn] Updated to: ${nextUserId}`);
    }

    return NextResponse.json({ success: true, track: savedTrack });
  } catch (error: any) {
    console.error('Add track error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add track' },
      { status: 500 }
    );
  }
}

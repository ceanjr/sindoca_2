/**
 * Add track to workspace playlist
 * POST /api/spotify/playlist/add-track
 */

import { NextRequest, NextResponse } from 'next/server';
import { addTrackToPlaylist, createPlaylist, getValidAccessToken } from '@/lib/spotify/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { track } = body;

    if (!track || !track.id || !track.uri) {
      return NextResponse.json({ error: 'Invalid track data' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

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
    const accessToken = await getValidAccessToken(user.id);

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

      const playlist = await createPlaylist(
        accessToken,
        profile.spotify_user_id,
        'Nossa Trilha Sonora ❤️',
        'Playlist criada pelo Sindoca'
      );

      spotifyPlaylistId = playlist.id;

      // Save playlist ID to workspace
      await supabase
        .from('workspaces')
        .update({
          data: {
            ...workspace.data,
            spotify_playlist_id: spotifyPlaylistId,
            spotify_playlist_url: playlist.external_urls.spotify,
          },
        })
        .eq('id', workspaceId);
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
        description: `${track.artist} • ${track.album}`,
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

    // Get partner ID to alternate turn
    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId);

    const partnerId = members?.find(m => m.user_id !== user.id)?.user_id;

    // Send push notification to partner
    if (partnerId) {
      try {
        const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
          },
          body: JSON.stringify({
            recipientUserId: partnerId,
            title: '🎵 Nova música adicionada!',
            body: `${track.name} - ${track.artist}`,
            icon: track.albumCover || '/icon-192x192.png',
            tag: 'new-music',
            data: { url: '/musica' },
          }),
        });

        if (!pushResponse.ok) {
          const errorData = await pushResponse.json();
          console.error('Push notification failed:', errorData);
        } else {
          const result = await pushResponse.json();
          console.log('Push notification sent:', result);
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
        // Don't fail the request if push fails
      }

      // Update turn to partner (alternate turn)
      await supabase
        .from('workspaces')
        .update({
          data: {
            ...workspace.data,
            current_music_turn_user_id: partnerId,
          },
        })
        .eq('id', workspaceId);
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

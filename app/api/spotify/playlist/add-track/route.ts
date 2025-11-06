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

    return NextResponse.json({ success: true, track: savedTrack });
  } catch (error: any) {
    console.error('Add track error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add track' },
      { status: 500 }
    );
  }
}

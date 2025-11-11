/**
 * Remove track from workspace playlist
 * DELETE /api/spotify/playlist/remove-track
 */

import { NextRequest, NextResponse } from 'next/server';
import { removeTrackFromPlaylist, getValidAccessToken } from '@/lib/spotify/client';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackId } = body;

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get track from database
    const { data: track, error: trackError } = await supabase
      .from('content')
      .select('*, workspace_id, data, author_id, created_at')
      .eq('id', trackId)
      .eq('type', 'music')
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Verify user is the author of the track
    if (track.author_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own tracks' },
        { status: 403 }
      );
    }

    // Get workspace Spotify playlist ID
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('data')
      .eq('id', track.workspace_id)
      .single();

    if (workspaceError || !workspace.data?.spotify_playlist_id) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Remove from Spotify
    try {
      // ✅ CORREÇÃO: Passar isServerSide=true pois estamos em uma API route
      const accessToken = await getValidAccessToken(user.id, true);
      await removeTrackFromPlaylist(
        accessToken,
        workspace.data.spotify_playlist_id,
        track.data.spotify_uri
      );
    } catch (error) {
      console.warn('Failed to remove from Spotify, continuing with DB removal:', error);
    }

    // Check if this is the user's most recent track
    const { data: userTracks, error: userTracksError } = await supabase
      .from('content')
      .select('id, created_at')
      .eq('workspace_id', track.workspace_id)
      .eq('type', 'music')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const isLastTrack = userTracks && userTracks.length > 0 && userTracks[0].id === trackId;

    // Remove from database
    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .eq('id', trackId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 });
    }

    // If this was the user's most recent track, revert the turn back to them
    if (isLastTrack && workspace.data && typeof workspace.data === 'object') {
      const currentTurnUserId = workspace.data.current_music_turn_user_id;

      // Only revert turn if it was the partner's turn (meaning this user had just added)
      if (currentTurnUserId && currentTurnUserId !== user.id) {
        await supabase
          .from('workspaces')
          .update({
            data: {
              ...workspace.data,
              current_music_turn_user_id: user.id,
            },
          })
          .eq('id', track.workspace_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove track error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove track' },
      { status: 500 }
    );
  }
}

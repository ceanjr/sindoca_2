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
      .select('*, workspace_id, data')
      .eq('id', trackId)
      .eq('type', 'music')
      .single();

    if (trackError || !track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
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
      const accessToken = await getValidAccessToken(user.id);
      await removeTrackFromPlaylist(
        accessToken,
        workspace.data.spotify_playlist_id,
        track.data.spotify_uri
      );
    } catch (error) {
      console.warn('Failed to remove from Spotify, continuing with DB removal:', error);
    }

    // Remove from database
    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .eq('id', trackId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 });
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

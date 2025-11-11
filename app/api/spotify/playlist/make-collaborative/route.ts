/**
 * Make existing playlist collaborative
 * POST /api/spotify/playlist/make-collaborative
 *
 * Esta rota foi criada para corrigir playlists existentes que não foram criadas como colaborativas.
 * Use esta rota UMA VEZ para tornar a playlist atual colaborativa.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updatePlaylistToCollaborative, getValidAccessToken } from '@/lib/spotify/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
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

    // Get workspace and playlist ID
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('data')
      .eq('id', membership.workspace_id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const spotifyPlaylistId = workspace.data?.spotify_playlist_id;
    if (!spotifyPlaylistId) {
      return NextResponse.json({ error: 'No playlist found' }, { status: 404 });
    }

    // Get access token
    const accessToken = await getValidAccessToken(user.id, true);

    // Make playlist collaborative
    console.log('🔄 Making playlist collaborative:', spotifyPlaylistId);
    await updatePlaylistToCollaborative(accessToken, spotifyPlaylistId);

    // Update workspace to mark playlist as collaborative
    await supabase
      .from('workspaces')
      .update({
        data: {
          ...workspace.data,
          spotify_playlist_is_collaborative: true,
        },
      })
      .eq('id', membership.workspace_id);

    console.log('✅ Playlist is now collaborative!');

    return NextResponse.json({
      success: true,
      message: 'Playlist is now collaborative. Both users can now add songs!',
      playlistId: spotifyPlaylistId,
    });
  } catch (error: any) {
    console.error('Make collaborative error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to make playlist collaborative',
        details: 'Make sure you are the owner of the playlist or have proper permissions.',
      },
      { status: 500 }
    );
  }
}

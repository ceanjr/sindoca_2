import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendToPartnerWithPreferences } from '@/lib/push/sendToPartnerWithPreferences';

export async function POST(request: Request) {
  try {
    const { contentId, emoji, contentInfo } = await request.json();

    if (!contentId || !emoji || !contentInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile for notification
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, nickname')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.nickname || userProfile?.full_name || 'Alguém';

    // Map content types to friendly names
    const contentTypeNames: Record<string, string> = {
      music: 'música',
      photo: 'foto',
      love_reason: 'razão',
      message: 'mensagem',
      story: 'história',
      achievement: 'conquista',
      voice: 'áudio',
    };

    const contentTypeName = contentTypeNames[contentInfo.type] || 'conteúdo';
    const contentTitle = contentInfo.title ? ` "${contentInfo.title}"` : '';

    // Get content author (recipient of notification)
    const { data: content } = await supabase
      .from('content')
      .select('author_id')
      .eq('id', contentId)
      .single();

    if (!content || !content.author_id) {
      return NextResponse.json(
        { error: 'Content not found or has no author' },
        { status: 404 }
      );
    }

    // Don't send notification if user reacted to their own content
    if (content.author_id === user.id) {
      return NextResponse.json({
        success: true,
        notificationSent: false,
        reason: 'Self-reaction',
      });
    }

    // Send push notification to content author with preference check
    const result = await sendToPartnerWithPreferences({
      recipientUserId: content.author_id,
      title: `${emoji} Nova reação!`,
      body: `${userName} reagiu com ${emoji} à sua ${contentTypeName}${contentTitle}`,
      icon: '/icon-192x192.png',
      tag: `reaction-${contentId}`,
      data: {
        type: 'reaction',
        contentId,
        emoji,
        url: contentInfo.url || '/',
      },
      preferenceKey: 'notify_new_reactions',
    });

    return NextResponse.json({
      success: true,
      notificationSent: result.success,
    });
  } catch (error: any) {
    console.error('Error sending reaction notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

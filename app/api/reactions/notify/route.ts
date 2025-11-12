import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToPartner } from '@/lib/push/sendToPartner';

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

    // Send push notification to content author
    const result = await sendPushToPartner(user.id, {
      title: `${emoji} Nova reação!`,
      body: `${userName} reagiu com ${emoji} à sua ${contentTypeName}${contentTitle}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `reaction-${contentId}`,
      data: {
        type: 'reaction',
        contentId,
        emoji,
        url: contentInfo.url || '/',
      },
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

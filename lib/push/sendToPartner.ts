/**
 * Helper function to send push notifications to user's partner
 */
import { createClient } from '@/lib/supabase/server';

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Send push notification to the partner of the current user
 * @param userId - Current user's ID
 * @param notification - Notification data
 * @returns Success status and details
 */
export async function sendPushToPartner(
  userId: string,
  notification: PushNotificationData
) {
  try {
    const supabase = await createClient();

    // Get user's workspace
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership) {
      console.error('Error fetching workspace:', membershipError);
      return { success: false, error: 'Workspace not found' };
    }

    // Get all workspace members
    const { data: members, error: membersError } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', membership.workspace_id);

    if (membersError || !members) {
      console.error('Error fetching members:', membersError);
      return { success: false, error: 'Members not found' };
    }

    // Find all partners (all users except current user)
    const partners = members.filter(m => m.user_id !== userId);

    if (partners.length === 0) {
      return { success: false, error: 'No partners found' };
    }

    console.log(`[Push] Sending to ${partners.length} partner(s)`);

    // Send push notification to ALL partners via internal API
    const results = await Promise.allSettled(
      partners.map(async (partner) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
          },
          body: JSON.stringify({
            recipientUserId: partner.user_id,
            ...notification,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error sending push to', partner.user_id, ':', errorData);
          return { success: false, userId: partner.user_id, error: errorData.error };
        }

        const result = await response.json();
        return { success: true, userId: partner.user_id, ...result };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return {
      success: true,
      sent: successful,
      failed,
      total: partners.length,
      details: results
    };

  } catch (error: any) {
    console.error('Error in sendPushToPartner:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to specific user
 * @param recipientUserId - Recipient user's ID
 * @param notification - Notification data
 * @returns Success status and details
 */
export async function sendPushToUser(
  recipientUserId: string,
  notification: PushNotificationData
) {
  try {
    // Send push notification via internal API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        recipientUserId,
        ...notification,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error sending push:', errorData);
      return { success: false, error: errorData.error };
    }

    const result = await response.json();
    return { success: true, ...result };

  } catch (error: any) {
    console.error('Error in sendPushToUser:', error);
    return { success: false, error: error.message };
  }
}

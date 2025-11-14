/**
 * API endpoint to send push notifications to specific users
 * This is an internal API, should only be called from server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:celiojunior0110@gmail.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check for internal API secret (for server-to-server calls)
    const internalSecret = request.headers.get('x-internal-secret');
    const isInternalCall = internalSecret === process.env.INTERNAL_API_SECRET;

    let senderId: string | undefined;

    if (!isInternalCall) {
      // For external calls, require user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('[Push] Auth error:', authError?.message || 'No user');
        return NextResponse.json(
          { error: 'Unauthorized', details: authError?.message },
          { status: 401 }
        );
      }

      senderId = user.id;
      console.log('[Push] Authenticated user:', senderId);
    } else {
      console.log('[Push] Internal API call (authenticated via secret)');
    }

    // Get notification data
    const {
      recipientUserId,
      title,
      body,
      icon,
      badge,
      tag,
      url,
      notificationType,
      data: notificationData,
    } = await request.json();

    console.log('[Push] Sending notification:', {
      from: senderId || 'internal',
      to: recipientUserId,
      title,
    });

    if (!recipientUserId || !title) {
      return NextResponse.json(
        { error: 'recipientUserId and title are required' },
        { status: 400 }
      );
    }

    // Get all push subscriptions for the recipient
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', recipientUserId);

    if (subsError) {
      console.error('[Push] Error fetching subscriptions:', subsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: subsError.message },
        { status: 500 }
      );
    }

    console.log('[Push] Found subscriptions:', subscriptions?.length || 0);

    if (!subscriptions || subscriptions.length === 0) {
      console.warn('[Push] No subscriptions found for recipient:', recipientUserId);
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found for user',
        sent: 0,
        warning: 'Recipient has no active push subscriptions',
      });
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192x192.png',
      // badge removed to prevent "from Sindoca" text on Android notifications
      tag: tag || 'notification',
      data: {
        url: url || '/',
        ...notificationData,
      },
    });

    // Get workspace_id for analytics
    let workspaceId: string | null = null;
    if (recipientUserId) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', recipientUserId)
        .single();
      workspaceId = membership?.workspace_id || null;
    }

    // Send push notification to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.keys,
          };

          await webpush.sendNotification(pushSubscription, payload);

          // Update last_verified and reset verification_failures
          await supabase
            .from('push_subscriptions')
            .update({
              last_verified: new Date().toISOString(),
              verification_failures: 0,
            })
            .eq('id', sub.id);

          return { success: true, endpoint: sub.endpoint, subscriptionId: sub.id };
        } catch (error: any) {
          console.error('Error sending push to:', sub.endpoint, error);

          // Increment verification_failures
          await supabase
            .from('push_subscriptions')
            .update({
              verification_failures: (sub.verification_failures || 0) + 1,
            })
            .eq('id', sub.id);

          // If subscription is invalid/expired, delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }

          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log('[Push] Results:', { successful, failed, total: subscriptions.length });

    // Log failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)) {
        console.error('[Push] Failed to send to subscription', index, result);
      }
    });

    // Record analytics
    if (workspaceId) {
      const analyticsRecord = {
        workspace_id: workspaceId,
        sender_id: senderId || null,
        recipient_id: recipientUserId,
        notification_type: notificationType || 'unknown',
        title,
        body: body || '',
        delivery_status: successful > 0 ? 'sent' : 'failed',
        error_message: failed > 0 ? 'Some deliveries failed' : null,
        metadata: {
          sent_count: successful,
          failed_count: failed,
          total_subscriptions: subscriptions.length,
          url,
        },
      };

      await supabase
        .from('push_notification_analytics')
        .insert(analyticsRecord)
        .catch((error) => {
          console.error('[Push] Failed to record analytics:', error);
          // Don't fail the request if analytics fails
        });
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    });

  } catch (error: any) {
    console.error('Error in push send:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

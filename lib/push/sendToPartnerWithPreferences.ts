/**
 * Função helper para enviar notificações respeitando preferências do usuário
 */
import { createClient } from '@/lib/supabase/server';

interface SendNotificationOptions {
  recipientUserId: string;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  preferenceKey?: 'notify_new_music' | 'notify_new_photos' | 'notify_new_reasons' | 'notify_new_reactions';
}

export async function sendToPartnerWithPreferences({
  recipientUserId,
  title,
  body,
  icon,
  tag,
  data,
  preferenceKey,
}: SendNotificationOptions) {
  const supabase = await createClient();

  // 1. Verificar se o usuário tem push habilitado
  const { data: prefs, error: prefsError } = await supabase
    .from('notification_preferences')
    .select('push_enabled, notify_new_music, notify_new_photos, notify_new_reasons, notify_new_reactions')
    .eq('user_id', recipientUserId)
    .single();

  if (prefsError) {
    console.error('[Push] Error fetching preferences:', prefsError);
    return {
      success: false,
      error: 'Failed to fetch user preferences',
    };
  }

  // 2. Verificar se push está habilitado
  if (!prefs?.push_enabled) {
    console.log('[Push] User has push notifications disabled:', recipientUserId);
    return {
      success: false,
      skipped: true,
      reason: 'Push notifications disabled',
    };
  }

  // 3. Verificar preferência específica (se fornecida)
  if (preferenceKey && !prefs[preferenceKey]) {
    console.log(`[Push] User has ${preferenceKey} disabled:`, recipientUserId);
    return {
      success: false,
      skipped: true,
      reason: `${preferenceKey} disabled`,
    };
  }

  // 4. Enviar notificação via API interna
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({
        recipientUserId,
        title,
        body,
        icon,
        tag,
        data,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send notification');
    }

    return {
      success: true,
      ...result,
    };
  } catch (error: any) {
    console.error('[Push] Error sending notification:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

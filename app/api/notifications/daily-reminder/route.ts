/**
 * Daily Reminder API Route
 * Envia lembretes diários para usuários que ativaram a opção
 *
 * Deve ser chamado por um cron job às 20h (horário de Brasília)
 *
 * Exemplo de configuração no Vercel (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/notifications/daily-reminder",
 *     "schedule": "0 23 * * *"  // 20h BRT = 23h UTC
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via secret (para cron jobs)
    const authHeader = request.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Buscar todos os usuários com lembrete diário ativado
    const { data: users, error: usersError } = await supabase
      .from('notification_preferences')
      .select('user_id, push_enabled')
      .eq('daily_reminder_enabled', true)
      .eq('push_enabled', true); // Só enviar para quem tem push ativado

    if (usersError) {
      console.error('Error fetching users with daily reminder:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log('[Daily Reminder] No users with daily reminder enabled');
      return NextResponse.json({
        success: true,
        message: 'No users to notify',
        sent: 0,
      });
    }

    console.log(`[Daily Reminder] Sending to ${users.length} user(s)`);

    // Enviar notificação para cada usuário
    const results = await Promise.allSettled(
      users.map(async (user) => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
              },
              body: JSON.stringify({
                recipientUserId: user.user_id,
                title: '💑 Check-in do casal',
                body: 'Dê um alô pro seu mozão e deixe o dia mais leve! ✨',
                icon: '/icon-192x192.png',
                tag: 'daily-reminder',
                notificationType: 'message',
                data: {
                  url: '/',
                },
              }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to send notification');
          }

          return { success: true, userId: user.user_id };
        } catch (error: any) {
          console.error(`Failed to send reminder to ${user.user_id}:`, error);
          return { success: false, userId: user.user_id, error: error.message };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - successful;

    console.log(`[Daily Reminder] Results: ${successful} sent, ${failed} failed`);

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: users.length,
    });
  } catch (error: any) {
    console.error('[Daily Reminder] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET também suportado para testes manuais (com secret na query)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Redirecionar para POST
  return POST(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Mensagens de notificação variadas para cada tipo de evento
 */
const NOTIFICATION_MESSAGES = {
  new_message: [
    "Seu parceiro contra-argumentou em '{title}' 🔥",
    "Nova resposta na discussão sobre '{title}'",
    "Hora de revidar na burocracia '{title}'",
    "{sender} tem algo a dizer sobre '{title}'",
    "A discussão sobre '{title}' está esquentando!",
    "Sua presença é requisitada em '{title}' ⚖️",
    "Novo desenvolvimento na treta sobre '{title}'",
  ],
  multiple_messages: [
    "{sender} enviou {count} mensagens em '{title}'",
    "{count} novas mensagens de {sender} em '{title}'",
    "{sender} está ativo em '{title}' ({count} mensagens) 🔥",
  ],
  thread_reply: [
    "Nova resposta na thread sobre '{context}'",
    "{sender} respondeu sua thread em '{title}'",
    "Thread sobre '{context}' tem novidades",
  ],
  status_change: [
    "{sender} marcou '{title}' como {status}",
    "Status de '{title}' mudou para {status}",
    "{sender} atualizou '{title}' para {status}",
  ],
  pinned_argument: [
    "{sender} fixou um argumento importante em '{title}' 📌",
    "Novo argumento fixado em '{title}'",
  ],
  reaction: [
    "{sender} reagiu {emoji} à sua mensagem",
    "{sender} amou sua resposta em '{title}' ❤️",
  ],
};

/**
 * Tempo de agrupamento de notificações (2 minutos)
 */
const GROUPING_WINDOW_MS = 2 * 60 * 1000;

/**
 * POST /api/burocracias/notify
 * Envia notificações inteligentes sobre eventos de burocracias
 *
 * Body:
 * - discussionId: ID da discussão
 * - recipientId: ID do destinatário
 * - senderId: ID do remetente
 * - type: Tipo de notificação
 * - metadata: Dados adicionais (título, emoji, etc)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Autenticar
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const {
      discussionId,
      recipientId,
      senderId,
      type,
      metadata = {},
    } = body;

    // Validar
    if (!discussionId || !recipientId || !senderId || !type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Não enviar notificação para si mesmo
    if (recipientId === senderId) {
      return NextResponse.json({ success: true, sent: false });
    }

    // Buscar última notificação pendente para agrupamento
    const { data: existingNotif } = await supabase
      .from('discussion_notification_queue')
      .select('*')
      .eq('discussion_id', discussionId)
      .eq('recipient_id', recipientId)
      .eq('is_sent', false)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    const now = new Date();
    const shouldGroup = existingNotif &&
      (now.getTime() - new Date(existingNotif.sent_at).getTime()) < GROUPING_WINDOW_MS;

    if (shouldGroup && type === 'new_message') {
      // Agrupar mensagens
      const newCount = (existingNotif.message_count || 0) + 1;

      await supabase
        .from('discussion_notification_queue')
        .update({
          message_count: newCount,
          last_message_content: metadata.messageContent || '',
          notification_type: newCount >= 2 ? 'multiple_messages' : 'new_message',
        })
        .eq('id', existingNotif.id);

      return NextResponse.json({ success: true, grouped: true, count: newCount });
    }

    // Criar nova notificação
    const { error: insertError } = await supabase
      .from('discussion_notification_queue')
      .insert({
        discussion_id: discussionId,
        recipient_id: recipientId,
        sender_id: senderId,
        message_count: 1,
        last_message_content: metadata.messageContent || '',
        notification_type: type,
        thread_context: metadata.threadContext || null,
        is_sent: false,
        sent_at: now.toISOString(),
      });

    if (insertError) throw insertError;

    // Enviar push notification
    await sendPushNotification(
      supabase,
      recipientId,
      discussionId,
      type,
      1,
      metadata
    );

    return NextResponse.json({ success: true, sent: true });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Envia push notification
 */
async function sendPushNotification(
  supabase: any,
  recipientId: string,
  discussionId: string,
  type: string,
  count: number,
  metadata: any
) {
  try {
    // Buscar discussão para obter título
    const { data: discussion } = await supabase
      .from('discussions')
      .select('title')
      .eq('id', discussionId)
      .single();

    // Buscar perfil do remetente
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name, nickname')
      .eq('id', metadata.senderId)
      .single();

    // Escolher mensagem aleatória
    const messages = count >= 2
      ? NOTIFICATION_MESSAGES.multiple_messages
      : NOTIFICATION_MESSAGES[type as keyof typeof NOTIFICATION_MESSAGES] || NOTIFICATION_MESSAGES.new_message;

    const template = messages[Math.floor(Math.random() * messages.length)];

    // Substituir placeholders
    let message = template
      .replace('{title}', discussion?.title || 'uma discussão')
      .replace('{sender}', sender?.nickname || sender?.full_name || 'Seu parceiro')
      .replace('{count}', count.toString())
      .replace('{emoji}', metadata.emoji || '')
      .replace('{status}', metadata.status || '')
      .replace('{context}', metadata.threadContext || '');

    // Enviar via API de push
    await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientUserId: recipientId,
        title: 'Burocracias a Dois',
        body: message,
        url: `/burocracias/${discussionId}`,
      }),
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

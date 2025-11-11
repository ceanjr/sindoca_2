'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { fetchJSON, FetchTimeoutError, FetchNetworkError } from '@/lib/utils/fetchWithTimeout';

interface ThinkingOfYouWidgetProps {
  workspaceId: string;
  partnerId: string;
  partnerName?: string;
  compact?: boolean;
}

// Progressive messages that get more intense with each click
const PROGRESSIVE_MESSAGES = [
  '{partnerName} pensou em você. De novo. Claro.',
  '{partnerName} ainda não superou o pensamento anterior.',
  '{partnerName} tá basicamente com você alugando um triplex na mente.',
  'Mais uma hora, mais um looping mental de {partnerName}.',
  '{partnerName} jura que é coincidência pensar tanto assim.',
  'Aparentemente, você é o único assunto de {partnerName} hoje.',
  '{partnerName} começou a falar de você com o espelho. Só avisando.',
  "{partnerName} já tá pesquisando o significado de 'pensar demais'.",
  'Isso já ultrapassou o limite do saudável, {partnerName}.',
  '{partnerName} tá um passo de fundar o fã-clube oficial. Cuidado.',
];

// Short titles for each message level
const PROGRESSIVE_TITLES = [
  '💭 De novo por aqui',
  '💕 Ainda por aí',
  '🏠 Morando na mente',
  '🔄 Loop ativado',
  '🤷 Só coincidência...',
  '📢 Assunto principal',
  '🪞 Conversa solo',
  '🔍 Pesquisando ajuda',
  '⚠️ Nível crítico',
  '🎪 Fã-clube incoming',
];

const MAX_CLICKS_PER_DAY = 10;
const COOLDOWN_HOURS = 2;

export default function ThinkingOfYouWidget({
  workspaceId,
  partnerId,
  partnerName = '',
  compact = false,
}: ThinkingOfYouWidgetProps) {
  const { user, profile } = useAuth();
  const { showLocalNotification, isGranted, requestPermission } =
    usePushNotifications();
  const [isSending, setIsSending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const [todayClickCount, setTodayClickCount] = useState(0);
  const [partnerThoughts, setPartnerThoughts] = useState<{
    count: number;
    lastMessage?: string;
  }>({ count: 0 });

  // Check partner's thoughts for today
  useEffect(() => {
    if (!user || !partnerId) return;

    const checkPartnerThoughts = async () => {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get ALL messages from partner today
      const { data, error } = await supabase
        .from('content')
        .select('description, created_at, author_id, data')
        .eq('workspace_id', workspaceId)
        .eq('author_id', partnerId)
        .eq('type', 'message')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setPartnerThoughts({
          count: data.length,
          lastMessage: data[0].description, // Most recent message
        });
      } else {
        setPartnerThoughts({ count: 0 });
      }
    };

    checkPartnerThoughts();

    // Subscribe to new messages
    const supabase = createClient();
    const channel = supabase
      .channel(`thinking-${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: any) => {
          if (
            payload.new?.type === 'message' &&
            payload.new?.author_id === partnerId
          ) {
            // Update count and message using functional update
            setPartnerThoughts((prev) => {
              const newCount = prev.count + 1;
              const messageIndex = Math.min(
                newCount - 1,
                MAX_CLICKS_PER_DAY - 1
              );
              const notificationTitle = PROGRESSIVE_TITLES[
                messageIndex
              ].replace('{partnerName}', partnerName);

              // Show notification when partner thinks of you
              if (isGranted) {
                showLocalNotification(notificationTitle, {
                  body: payload.new.description,
                  icon: '/icon-192x192.png',
                  tag: 'partner-thinking',
                });
              }

              toast.success(notificationTitle, {
                description: payload.new.description,
                duration: 5000,
              });

              return {
                count: newCount,
                lastMessage: payload.new.description,
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, workspaceId, partnerName]);

  // Load user's clicks today
  useEffect(() => {
    if (!user) return;

    const loadTodayClicks = async () => {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('content')
        .select('created_at')
        .eq('workspace_id', workspaceId)
        .eq('author_id', user.id)
        .eq('type', 'message')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setTodayClickCount(data.length);
        // Set last sent time to most recent
        setLastSentTime(new Date(data[0].created_at));
      }
    };

    loadTodayClicks();
  }, [user, workspaceId]);

  const canSend = () => {
    // Check if reached max clicks for today
    if (todayClickCount >= MAX_CLICKS_PER_DAY) {
      return false;
    }

    // Check cooldown
    if (!lastSentTime) return true;
    const timeSinceLastSend = Date.now() - lastSentTime.getTime();
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    return timeSinceLastSend > cooldownMs;
  };

  const getRemainingCooldown = () => {
    if (!lastSentTime) return 0;
    const timeSinceLastSend = Date.now() - lastSentTime.getTime();
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    const remaining = cooldownMs - timeSinceLastSend;
    const remainingMinutes = Math.ceil(remaining / 1000 / 60);

    // Convert to hours if >= 60 minutes
    if (remainingMinutes >= 60) {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }

    return `${remainingMinutes} min`;
  };

  const sendNotification = async () => {
    if (!user) return;

    if (todayClickCount >= MAX_CLICKS_PER_DAY) {
      toast.error('Limite diário atingido', {
        description: `Você já pensou ${MAX_CLICKS_PER_DAY}x hoje. Descanse um pouco! 😅`,
      });
      return;
    }

    if (!canSend()) {
      toast.error('Aguarde um pouco', {
        description: `Você pode enviar novamente em ${getRemainingCooldown()}`,
      });
      return;
    }

    setIsSending(true);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }

    try {
      // Get the message based on current click count (progressive)
      const messageIndex = Math.min(todayClickCount, MAX_CLICKS_PER_DAY - 1);
      const messageTemplate = PROGRESSIVE_MESSAGES[messageIndex];

      // Use the sender's name (current user), not the partner's name
      const senderName =
        profile?.nickname || profile?.full_name || 'Alguém especial';
      const message = messageTemplate.replace(/{partnerName}/g, senderName);
      const title = PROGRESSIVE_TITLES[messageIndex];

      // Save to database as a notification/message
      const supabase = createClient();
      const { error: insertError } = await supabase.from('content').insert({
        workspace_id: workspaceId,
        author_id: user.id,
        type: 'message',
        title: 'Pensando em Você',
        description: message,
        data: {
          type: 'thinking_of_you',
          sent_at: new Date().toISOString(),
          message_index: messageIndex,
        },
      });

      if (insertError) {
        throw new Error(`Erro ao salvar: ${insertError.message}`);
      }

      setLastSentTime(new Date());
      setTodayClickCount((prev) => prev + 1);

      // Send server-side push notification to partner
      try {
        const result = await fetchJSON('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // Important: include cookies for auth
          timeout: 10000, // 10 seconds timeout
          body: JSON.stringify({
            recipientUserId: partnerId,
            title: title,
            body: message,
            icon: '/icon-192x192.png',
            tag: 'thinking-of-you',
            data: { url: '/' },
          }),
        });

        console.log('Push notification sent:', result);
      } catch (error) {
        if (error instanceof FetchTimeoutError) {
          console.error('Push notification timed out:', error);
        } else if (error instanceof FetchNetworkError) {
          console.error('Network error sending push:', error);
        } else {
          console.error('Error sending push notification:', error);
        }
        // Don't show error to user, notification was saved to DB anyway
      }

      // Show success toast (no local notification for sender)
      const confirmationMessage = partnerName
        ? `${partnerName} foi notificado(a) que você está pensando nele(a)!`
        : 'Mensagem enviada com sucesso!';

      toast.success('Mensagem enviada! 💕', {
        description: confirmationMessage,
        duration: 4000,
      });
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error('Erro ao enviar', {
        description: error.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (compact) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={sendNotification}
        disabled={isSending || !canSend()}
        className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-soft-md fixed bottom-24 right-6 z-40 disabled:opacity-50 disabled:cursor-not-allowed lg:bottom-6"
      >
        <motion.div
          animate={
            isSending
              ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }
              : {}
          }
          transition={{
            duration: 0.5,
            repeat: isSending ? Infinity : 0,
          }}
        >
          <Heart size={24} fill="white" />
        </motion.div>
      </motion.button>
    );
  }

  // Get button text based on partner
  const getButtonText = () => {
    if (!profile) return ['Pensando...', ''];

    // Check if user is Célio Júnior or Sindy
    const isCelio =
      profile.email === 'celiojunior0110@gmail.com' ||
      profile.full_name?.toLowerCase().includes('celio');

    // Show remaining clicks if close to limit
    const remainingClicks = MAX_CLICKS_PER_DAY - todayClickCount;
    const clickText =
      remainingClicks <= 3 && remainingClicks > 0
        ? ` (${remainingClicks} restantes)`
        : '';

    return isCelio
      ? ['Dependência Emocional', `Diga que está pensando nela${clickText}`]
      : ['Dependência Emocional', `Diga que está pensando nele${clickText}`];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row gap-4 items-stretch"
    >
      {/* Button Section - 1/3 on desktop, full width on mobile */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={sendNotification}
        disabled={isSending || !canSend()}
        className="w-full md:flex-[0_0_calc(33.333%-0.5rem)] bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-6 text-white shadow-soft-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-3 min-h-[120px]"
      >
        <motion.div
          animate={
            isSending
              ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }
              : {
                  scale: [1, 1.1, 1],
                }
          }
          transition={{
            duration: isSending ? 0.5 : 2,
            repeat: Infinity,
          }}
        >
          <Heart size={36} fill="white" />
        </motion.div>

        <div className="text-center">
          {isSending ? (
            <>
              <div className="flex items-center gap-2 justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={18} />
                </motion.div>
                <span className="font-semibold">Enviando...</span>
              </div>
            </>
          ) : !canSend() && todayClickCount < MAX_CLICKS_PER_DAY ? (
            <>
              <p className="font-semibold text-sm">Aguarde</p>
              <p className="text-xs text-white/80">{getRemainingCooldown()}</p>
            </>
          ) : todayClickCount >= MAX_CLICKS_PER_DAY ? (
            <>
              <p className="font-semibold text-sm">Limite atingido!</p>
              <p className="text-xs text-white/80">
                {todayClickCount}/{MAX_CLICKS_PER_DAY} hoje
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">{getButtonText()[0]}</p>
              <p className="text-xs text-white/80">{getButtonText()[1]}</p>
            </>
          )}
        </div>
      </motion.button>

      {/* Status Section - 2/3 on desktop, full width on mobile */}
      <motion.div className="w-full md:flex-[0_0_calc(66.666%-0.5rem)] bg-white rounded-3xl p-6 shadow-soft-md border border-gray-100 min-h-[120px]">
        {partnerThoughts.count > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart
                  size={20}
                  className="text-pink-500"
                  fill="currentColor"
                />
                <h3 className="font-bold text-textPrimary">
                  {partnerName} pensou em você hoje!
                </h3>
              </div>
              <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-bold">
                {partnerThoughts.count}x
              </div>
            </div>
            <p className="text-textSecondary text-sm leading-relaxed italic">
              "{partnerThoughts.lastMessage}"
            </p>
            {partnerThoughts.count > 1 && (
              <p className="text-textTertiary text-xs mt-2">
                Última de {partnerThoughts.count} mensagens hoje
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Heart size={32} className="text-gray-300 mb-3" />
            </motion.div>
            <p className="text-textSecondary text-sm">
              {partnerName} ainda não pensou em você hoje...
            </p>
            <p className="text-textTertiary text-xs mt-2">
              Acho que você deveria começar uma briga
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

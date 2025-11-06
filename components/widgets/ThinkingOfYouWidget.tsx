'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface ThinkingOfYouWidgetProps {
  workspaceId: string;
  partnerId: string;
  partnerName?: string;
  compact?: boolean;
}

export default function ThinkingOfYouWidget({
  workspaceId,
  partnerId,
  partnerName,
  compact = false,
}: ThinkingOfYouWidgetProps) {
  const { user, profile } = useAuth();
  const { showLocalNotification, isGranted, requestPermission } =
    usePushNotifications();
  const [isSending, setIsSending] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const [partnerThoughtToday, setPartnerThoughtToday] = useState<{
    thought: boolean;
    message?: string;
  }>({ thought: false });

  const messages = [
    '💭 Estou pensando em você, pensando em nunca mais...',
    '💕 Saudades de você bb',
    '🌟 Você é especial... literalmente',
    '✨ Você ilumina meu dia como ninguém bronzeado faria',
    '🎵 Pensando em nós naquela cama de jornal',
    '☁️ Você está na minha mente o tempo todo (Help!!!)',
    '🌙 Sonhando com você acordado(a)',
    '🌸 Você é minha flor de tangerina',
  ];

  // Check if partner thought of you today
  useEffect(() => {
    if (!user || !partnerId) return;

    const checkPartnerThought = async () => {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('content')
        .select('description, created_at')
        .eq('workspace_id', workspaceId)
        .eq('author_id', partnerId)
        .eq('type', 'message')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setPartnerThoughtToday({
          thought: true,
          message: data[0].description,
        });
      } else {
        setPartnerThoughtToday({ thought: false });
      }
    };

    checkPartnerThought();

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
            setPartnerThoughtToday({
              thought: true,
              message: payload.new.description,
            });

            // Show notification when partner thinks of you
            if (isGranted) {
              showLocalNotification('💕 Alguém pensou em você!', {
                body: payload.new.description,
                icon: '/icon-192x192.png',
                tag: 'partner-thinking',
              });
            }

            toast.success('💕 Seu amor pensou em você!', {
              description: payload.new.description,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, workspaceId, isGranted, showLocalNotification]);

  const canSend = () => {
    if (!lastSentTime) return true;
    const timeSinceLastSend = Date.now() - lastSentTime.getTime();
    const cooldownMs = 5 * 60 * 1000; // 5 minutes
    return timeSinceLastSend > cooldownMs;
  };

  const getRemainingCooldown = () => {
    if (!lastSentTime) return 0;
    const timeSinceLastSend = Date.now() - lastSentTime.getTime();
    const cooldownMs = 5 * 60 * 1000;
    const remaining = cooldownMs - timeSinceLastSend;
    return Math.max(0, Math.ceil(remaining / 1000 / 60));
  };

  const sendNotification = async () => {
    if (!user || !canSend()) {
      toast.error('Aguarde alguns minutos', {
        description: `Você pode enviar novamente em ${getRemainingCooldown()} minutos`,
      });
      return;
    }

    setIsSending(true);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }

    try {
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];

      // Save to database as a notification/message
      const supabase = createClient();
      await supabase.from('content').insert({
        workspace_id: workspaceId,
        author_id: user.id,
        type: 'message',
        title: 'Pensando em Você',
        description: randomMessage,
        data: {
          type: 'thinking_of_you',
          sent_at: new Date().toISOString(),
        },
      });

      setLastSentTime(new Date());

      // Show local notification
      if (isGranted) {
        await showLocalNotification('Pensando em Você 💕', {
          body: randomMessage,
          icon: '/icon-192x192.png',
          tag: 'thinking-of-you',
        });
      } else {
        // Request permission if not granted
        const granted = await requestPermission();
        if (granted) {
          await showLocalNotification('Pensando em Você 💕', {
            body: randomMessage,
            icon: '/icon-192x192.png',
            tag: 'thinking-of-you',
          });
        }
      }

      toast.success('Mensagem enviada! 💕', {
        description: randomMessage,
        duration: 5000,
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
    if (!profile) return 'Pensando...';
    // Check if user is Célio Júnior or Sindy
    const isCelio =
      profile.email === 'celiojunior0110@gmail.com' ||
      profile.full_name?.toLowerCase().includes('celio');
    return isCelio
      ? ['Dependência Emocional', 'Diga que está pensando nele']
      : ['Dependência Emocional', 'Diga que está pensando nela'];
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
          ) : !canSend() ? (
            <>
              <p className="font-semibold text-sm">⏰ Aguarde</p>
              <p className="text-xs text-white/80">
                {getRemainingCooldown()} min
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
        {partnerThoughtToday.thought ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={20} className="text-pink-500" fill="currentColor" />
              <h3 className="font-bold text-textPrimary">
                {partnerName || 'ele(a)'} pensou em você hoje! 💕
              </h3>
            </div>
            <p className="text-textSecondary text-sm leading-relaxed">
              {partnerThoughtToday.message}
            </p>
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
              {partnerName || 'Ele(a)'} ainda não pensou em você hoje...
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

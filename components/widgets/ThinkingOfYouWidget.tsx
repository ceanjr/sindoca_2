'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface ThinkingOfYouWidgetProps {
  workspaceId: string
  partnerId: string
  compact?: boolean
}

export default function ThinkingOfYouWidget({
  workspaceId,
  partnerId,
  compact = false,
}: ThinkingOfYouWidgetProps) {
  const { user } = useAuth()
  const [isSending, setIsSending] = useState(false)
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null)

  const messages = [
    '💭 Estou pensando em você',
    '💕 Saudades de você',
    '🌟 Você é especial',
    '✨ Você ilumina meu dia',
    '🎵 Pensando em nós',
    '☁️ Você está na minha mente',
    '🌙 Sonhando com você',
    '🌸 Você é minha flor',
  ]

  const canSend = () => {
    if (!lastSentTime) return true
    const timeSinceLastSend = Date.now() - lastSentTime.getTime()
    const cooldownMs = 5 * 60 * 1000 // 5 minutes
    return timeSinceLastSend > cooldownMs
  }

  const getRemainingCooldown = () => {
    if (!lastSentTime) return 0
    const timeSinceLastSend = Date.now() - lastSentTime.getTime()
    const cooldownMs = 5 * 60 * 1000
    const remaining = cooldownMs - timeSinceLastSend
    return Math.max(0, Math.ceil(remaining / 1000 / 60))
  }

  const sendNotification = async () => {
    if (!user || !canSend()) {
      toast.error('Aguarde alguns minutos', {
        description: `Você pode enviar novamente em ${getRemainingCooldown()} minutos`,
      })
      return
    }

    setIsSending(true)

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50])
    }

    try {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]

      // TODO: Send actual notification via Supabase Realtime or Push Notification
      // For now, just show success toast

      // Save to database as a notification/message
      const supabase = createClient()
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
      })

      setLastSentTime(new Date())

      toast.success('Mensagem enviada! 💕', {
        description: randomMessage,
        duration: 5000,
      })
    } catch (error: any) {
      console.error('Error sending notification:', error)
      toast.error('Erro ao enviar', {
        description: error.message,
      })
    } finally {
      setIsSending(false)
    }
  }

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
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-pink-500 rounded-3xl p-6 text-white shadow-soft-md"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <Heart size={32} fill="white" />
        </motion.div>
        <div>
          <h3 className="text-xl font-bold">Pensando em Você</h3>
          <p className="text-white/80 text-sm">Envie uma mensagem especial</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-white/90 mb-6">
        Envie uma notificação carinhosa para deixar seu amor saber que você está pensando nele(a) ✨
      </p>

      {/* Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={sendNotification}
        disabled={isSending || !canSend()}
        className="w-full py-4 bg-white/20 backdrop-blur-sm rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={20} />
            </motion.div>
            Enviando...
          </>
        ) : !canSend() ? (
          <>
            ⏰ Aguarde {getRemainingCooldown()}min
          </>
        ) : (
          <>
            <Send size={20} />
            Enviar Mensagem
          </>
        )}
      </motion.button>

      {/* Last Sent Info */}
      {lastSentTime && (
        <p className="text-center text-white/60 text-xs mt-4">
          Última vez: {lastSentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </motion.div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useRouter } from 'next/navigation'
import { MessageCircle, Quote, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getUserWorkspaces } from '@/lib/api/workspace'

export default function MessagesSection({ id }) {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (user) {
      loadMessages()
    }
  }, [user])

  const loadMessages = async () => {
    try {
      const supabase = createClient()

      // Get user's workspace
      const workspacesData = await getUserWorkspaces(user.id)
      if (workspacesData.length === 0) {
        setLoading(false)
        return
      }

      const workspaceId = workspacesData[0].workspace_id

      // Load messages from content table
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'message')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedMessages = data.map(item => ({
        id: item.id,
        title: item.data?.title || 'Mensagem',
        content: item.data?.content || '',
        author: item.data?.author || 'Anônimo',
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id={id} className="min-h-screen px-4 py-20" ref={ref}>
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <MessageCircle className="text-primary" size={32} />
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-primary">
              Mensagens Especiais
            </h2>
            <MessageCircle className="text-accent" size={32} />
          </div>
          <p className="text-lg md:text-xl opacity-80">
            Palavras que saem do coração
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
            />
            <p className="text-textSecondary mt-4">Carregando...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && messages.length === 0 && (
          <div className="text-center py-20">
            <MessageCircle className="mx-auto text-textTertiary mb-6" size={64} />
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Nenhuma mensagem ainda
            </h3>
            <p className="text-textSecondary mb-8 max-w-md mx-auto">
              Escreva mensagens especiais que vêm do coração
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/home')}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Escrever Primeira Mensagem
            </motion.button>
          </div>
        )}

        {/* Messages */}
        {!loading && messages.length > 0 && (
          <div className="space-y-8">
            {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-glow hover:shadow-glow-strong transition-all duration-300"
            >
              {/* Quote Icon */}
              <motion.div
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-6 right-6 opacity-10"
              >
                <Quote size={64} />
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-serif font-bold mb-6 text-primary">
                {message.title}
              </h3>

              {/* Content */}
              <div className="relative">
                <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-primary to-accent rounded-full" />
                <p className="font-serif text-xl md:text-2xl leading-relaxed whitespace-pre-line italic pl-4">
                  {message.content}
                </p>
              </div>

              {/* Author */}
              <div className="mt-6 text-right">
                <span className="font-script text-lg opacity-70">
                  — {message.author}
                </span>
              </div>

              {/* Decorative Elements */}
              <div className="absolute bottom-6 left-6 opacity-20">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-4xl"
                >
                  ♪
                </motion.div>
              </div>
            </motion.div>
          ))}
          </div>
        )}

        {/* Final Message */}
        {!loading && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 glass rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-6xl md:text-8xl mb-6"
          >
            💝
          </motion.div>

          <p className="font-serif text-3xl md:text-4xl font-bold text-primary leading-relaxed">
            Você faz meus dias serem mais coloridos e cheios de significado
          </p>
        </motion.div>
        )}
      </div>
    </section>
  )
}

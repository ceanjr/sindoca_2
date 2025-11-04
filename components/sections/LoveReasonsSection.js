'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useRouter } from 'next/navigation'
import {
  Smile,
  Music,
  Sparkles,
  MessageCircle,
  Star,
  Heart,
  Coffee,
  Book,
  Sun,
  Moon,
  Zap,
  Award,
  Target,
  Users,
  Laugh,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getUserWorkspaces } from '@/lib/api/workspace'

const iconMap = {
  Smile,
  Music,
  Sparkles,
  MessageCircle,
  Star,
  Heart,
  Coffee,
  Book,
  Sun,
  Moon,
  Zap,
  Award,
  Target,
  Users,
  Laugh,
}

export default function LoveReasonsSection({ id }) {
  const router = useRouter()
  const { user } = useAuth()
  const [reasons, setReasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealedSecrets, setRevealedSecrets] = useState(new Set())
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (user) {
      loadReasons()
    }
  }, [user])

  const loadReasons = async () => {
    try {
      const supabase = createClient()

      // Get user's workspace
      const workspacesData = await getUserWorkspaces(user.id)
      if (workspacesData.length === 0) {
        setLoading(false)
        return
      }

      const workspaceId = workspacesData[0].workspace_id

      // Load love reasons from content table
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'love_reason')
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedReasons = data.map(item => ({
        id: item.id,
        icon: item.data?.icon || 'Heart',
        text: item.data?.text || '',
        secret: item.data?.secret || '',
        category: item.data?.category || 'Geral',
      }))

      setReasons(formattedReasons)
    } catch (error) {
      console.error('Error loading love reasons:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSecret = (index) => {
    setRevealedSecrets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <section id={id} className="min-h-screen px-4 py-20" ref={ref}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <Heart className="text-primary" size={48} />
          </motion.div>
          <h2 className="font-heading text-4xl md:text-6xl font-bold text-textPrimary mb-4">
            O Que Eu <span className="text-primary">Amo</span> em Você
          </h2>
          <p className="text-lg text-textSecondary max-w-2xl mx-auto">
            Apenas algumas das infinitas razões que fazem você ser tão especial
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
        {!loading && reasons.length === 0 && (
          <div className="text-center py-20">
            <Heart className="mx-auto text-textTertiary mb-6" size={64} />
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Nenhuma razão ainda
            </h3>
            <p className="text-textSecondary mb-8 max-w-md mx-auto">
              Comece a adicionar as razões pelas quais você ama alguém especial
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/home')}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Adicionar Primeira Razão
            </motion.button>
          </div>
        )}

        {/* Lista Minimalista */}
        {!loading && reasons.length > 0 && (
          <div className="space-y-4">
            {reasons.map((reason, index) => {
              const Icon = iconMap[reason.icon] || Heart
              const isRevealed = revealedSecrets.has(index)

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group"
              >
                <motion.div
                  whileHover={{ x: 8 }}
                  onClick={() => toggleSecret(index)}
                  className="bg-surface rounded-2xl p-6 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 cursor-pointer border-l-4 border-primary"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary bg-opacity-10 flex items-center justify-center text-primary"
                    >
                      <Icon size={24} />
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Main text */}
                      <p className="text-textPrimary text-lg font-medium mb-1">
                        {reason.text}
                      </p>

                      {/* Category badge */}
                      <span className="inline-block text-xs text-textTertiary font-semibold uppercase tracking-wider">
                        {reason.category}
                      </span>

                      {/* Secret message */}
                      <AnimatePresence>
                        {isRevealed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-gradient-to-r bg-primary/10 rounded-xl p-4 border-l-2 border-primary">
                              <p className="text-textSecondary italic text-sm">
                                {reason.secret}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Indicator */}
                    <motion.div
                      animate={{ rotate: isRevealed ? 90 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0 text-textTertiary group-hover:text-primary transition-colors"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.5 5L12.5 10L7.5 15"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
          </div>
        )}

        {/* Footer Message */}
        {!loading && reasons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-surface rounded-3xl p-8 shadow-soft-md">
            <Sparkles className="inline-block text-secondary mb-3" size={32} />
            <p className="font-body text-xl text-textPrimary leading-relaxed">
              E existem <span className="text-primary font-bold">infinitas</span> outras
              razões que fazem você ser única e especial para mim
            </p>
          </div>
        </motion.div>
        )}

        {/* Hint */}
        {!loading && reasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-textTertiary text-sm">
              💡 Clique em cada item para revelar uma mensagem secreta
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}

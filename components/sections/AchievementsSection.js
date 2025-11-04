'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useRouter } from 'next/navigation'
import { Trophy, Eye, MessageCircle, Plane, Heart, Sparkles, Plus, Award, Star, Target } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getUserWorkspaces } from '@/lib/api/workspace'

const iconMap = {
  Eye,
  MessageCircle,
  Plane,
  Heart,
  Sparkles,
  Trophy,
  Award,
  Star,
  Target,
}

export default function AchievementsSection({ id }) {
  const router = useRouter()
  const { user } = useAuth()
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealedSecrets, setRevealedSecrets] = useState([])
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (user) {
      loadAchievements()
    }
  }, [user])

  const loadAchievements = async () => {
    try {
      const supabase = createClient()

      // Get user's workspace
      const workspacesData = await getUserWorkspaces(user.id)
      if (workspacesData.length === 0) {
        setLoading(false)
        return
      }

      const workspaceId = workspacesData[0].workspace_id

      // Load achievements from content table
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'achievement')
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedAchievements = data.map(item => ({
        id: item.id,
        icon: item.data?.icon || 'Trophy',
        emoji: item.data?.emoji || '🏆',
        title: item.data?.title || 'Conquista',
        date: item.data?.date || '',
        description: item.data?.description || '',
        secret: item.data?.secret || '',
      }))

      setAchievements(formattedAchievements)
    } catch (error) {
      console.error('Error loading achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSecret = (index) => {
    setRevealedSecrets((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(15)
    }
  }

  return (
    <section id={id} className="min-h-screen px-4 py-20" ref={ref}>
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="text-primary" size={32} />
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-primary">
              Conquistas Juntos
            </h2>
            <Trophy className="text-accent" size={32} />
          </div>
          <p className="text-lg md:text-xl opacity-80">
            Momentos especiais da nossa jornada
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
        {!loading && achievements.length === 0 && (
          <div className="text-center py-20">
            <Trophy className="mx-auto text-textTertiary mb-6" size={64} />
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Nenhuma conquista ainda
            </h3>
            <p className="text-textSecondary mb-8 max-w-md mx-auto">
              Registre os momentos especiais e marcos importantes da jornada
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/home')}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Adicionar Primeira Conquista
            </motion.button>
          </div>
        )}

        {/* Timeline */}
        {!loading && achievements.length > 0 && (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary opacity-30" />

            {/* Timeline Items */}
            <div className="space-y-12">
              {achievements.map((achievement, index) => {
                const Icon = iconMap[achievement.icon] || Trophy
              const isRevealed = revealedSecrets.includes(index)
              const isLeft = index % 2 === 0

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className={`relative flex items-center ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`flex-1 ml-20 md:ml-0 ${
                      isLeft ? 'md:pr-12' : 'md:pl-12'
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      onClick={() => toggleSecret(index)}
                      className="glass rounded-3xl p-6 md:p-8 cursor-pointer shadow-glow hover:shadow-glow-strong transition-all duration-300"
                    >
                      {/* Date */}
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={20} className="text-primary" />
                        <span className="font-script text-xl text-accent font-bold">
                          {achievement.date}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4 flex items-center gap-3">
                        <span className="text-4xl">{achievement.emoji}</span>
                        <span>{achievement.title}</span>
                      </h3>

                      {/* Description */}
                      <p className="text-lg leading-relaxed opacity-90 mb-4">
                        {achievement.description}
                      </p>

                      {/* Secret Hint */}
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="text-sm opacity-60 cursor-pointer hover:opacity-100 transition-opacity"
                      >
                        {isRevealed
                          ? '✨ Mensagem revelada!'
                          : '💭 Clique para revelar uma mensagem secreta...'}
                      </motion.div>

                      {/* Secret Message */}
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: isRevealed ? 'auto' : 0,
                          opacity: isRevealed ? 1 : 0,
                        }}
                        transition={{ duration: 0.5 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 glass-strong rounded-2xl p-4 border-l-4 border-primary">
                          <p className="italic opacity-90">{achievement.secret}</p>
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Timeline Dot */}
                  <motion.div
                    whileHover={{ scale: 1.5 }}
                    className="absolute left-8 md:left-1/2 transform -translate-x-1/2 z-10"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary shadow-glow flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
            </div>
          </div>
        )}

        {/* Bucket List */}
        {!loading && achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-16 glass rounded-3xl p-8"
        >
          <h3 className="text-3xl font-serif font-bold text-center text-primary mb-8">
            Próximas Aventuras 🎯
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Criar mais memórias inesquecíveis',
              'Explorar novos lugares juntos',
              'Continuar construindo nossa história',
              'Fazer você sorrir todos os dias',
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 1.4 + index * 0.1 }}
                className="flex items-center gap-3 glass-strong rounded-2xl p-4 hover:bg-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} />
                </div>
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        )}
      </div>
    </section>
  )
}

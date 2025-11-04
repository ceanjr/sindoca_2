'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, TrendingUp, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface StreakCounterProps {
  workspaceId: string
  compact?: boolean
}

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
  totalDays: number
}

export default function StreakCounter({ workspaceId, compact = false }: StreakCounterProps) {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: '',
    totalDays: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStreak()
  }, [workspaceId])

  const loadStreak = async () => {
    try {
      const supabase = createClient()

      // Get all content ordered by date
      const { data: content } = await supabase
        .from('content')
        .select('created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (!content || content.length === 0) {
        setLoading(false)
        return
      }

      // Calculate streak
      const dates = content.map((c) => new Date(c.created_at).toDateString())
      const uniqueDates = [...new Set(dates)]

      let currentStreak = 0
      let longestStreak = 0
      let tempStreak = 0
      let lastDate = new Date()

      uniqueDates.forEach((dateStr, index) => {
        const date = new Date(dateStr)
        const diffDays = Math.floor(
          (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (index === 0) {
          // First date (most recent)
          if (diffDays <= 1) {
            currentStreak = 1
            tempStreak = 1
          }
        } else {
          const prevDate = new Date(uniqueDates[index - 1])
          const dayDiff = Math.floor(
            (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
          )

          if (dayDiff === 1) {
            // Consecutive day
            tempStreak++
            if (index === 1 && diffDays <= 1) {
              currentStreak = tempStreak
            }
            longestStreak = Math.max(longestStreak, tempStreak)
          } else {
            // Streak broken
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        }

        lastDate = date
      })

      longestStreak = Math.max(longestStreak, currentStreak)

      setStreak({
        currentStreak,
        longestStreak,
        lastActivityDate: uniqueDates[0],
        totalDays: uniqueDates.length,
      })
    } catch (error) {
      console.error('Error loading streak:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-surfaceAlt rounded-2xl p-4 h-32"></div>
    )
  }

  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full shadow-soft-lg"
      >
        <Flame size={20} className={streak.currentStreak > 0 ? 'animate-pulse' : ''} />
        <span className="font-bold text-lg">{streak.currentStreak}</span>
        <span className="text-sm opacity-90">dias</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-orange-500 rounded-3xl p-6 text-white shadow-soft-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={
              streak.currentStreak > 0
                ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Flame size={32} />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold">Sequência</h3>
            <p className="text-white/80 text-sm">Dias consecutivos</p>
          </div>
        </div>

        {streak.currentStreak >= 7 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-4xl"
          >
            🔥
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Current Streak */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
          <motion.p
            key={streak.currentStreak}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold mb-1"
          >
            {streak.currentStreak}
          </motion.p>
          <p className="text-sm opacity-80">Atual</p>
        </div>

        {/* Longest Streak */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={16} />
            <p className="text-4xl font-bold">{streak.longestStreak}</p>
          </div>
          <p className="text-sm opacity-80">Recorde</p>
        </div>

        {/* Total Days */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar size={16} />
            <p className="text-4xl font-bold">{streak.totalDays}</p>
          </div>
          <p className="text-sm opacity-80">Total</p>
        </div>
      </div>

      {/* Motivation Message */}
      <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
        <p className="text-center font-medium">
          {streak.currentStreak === 0 && '🌟 Crie algo hoje para começar sua sequência!'}
          {streak.currentStreak === 1 && '💪 Ótimo começo! Continue amanhã!'}
          {streak.currentStreak >= 2 && streak.currentStreak < 7 && '🚀 Você está no caminho certo!'}
          {streak.currentStreak >= 7 && streak.currentStreak < 30 && '🔥 Uma semana! Incrível!'}
          {streak.currentStreak >= 30 && '👑 Você é um(a) campeão(ã)!'}
        </p>
      </div>

      {/* Last Activity */}
      {streak.lastActivityDate && (
        <p className="text-center text-sm opacity-70 mt-4">
          Última atividade: {new Date(streak.lastActivityDate).toLocaleDateString('pt-BR')}
        </p>
      )}
    </motion.div>
  )
}

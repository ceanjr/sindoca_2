'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const { user, profile } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="mb-6"
          >
            <Heart size={64} className="text-primary mx-auto" fill="currentColor" />
          </motion.div>
          <h1 className="text-4xl font-bold text-textPrimary mb-4">
            Olá, {profile?.nickname || profile?.full_name || 'você'}! 👋
          </h1>
          <p className="text-textSecondary mb-8">
            Bem-vindo ao dashboard do nosso espaço especial 💕
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}

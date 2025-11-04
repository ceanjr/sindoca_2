'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AuthCardProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export default function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background dark:bg-darkBg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Card - Always white/light background */}
        <div className="bg-white rounded-3xl shadow-soft-xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block mb-4"
            >
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-soft-md">
                <span className="text-3xl">💕</span>
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 text-sm">{subtitle}</p>
            )}
          </div>

          {/* Content */}
          {children}
        </div>
      </motion.div>
    </div>
  )
}

'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Image, Heart, Music, Trophy, MessageCircle, Gift, Archive } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { id: 'inicio', path: '/', label: 'Início', icon: Home },
  { id: 'galeria', path: '/galeria', label: 'Galeria', icon: Image },
  { id: 'amor', path: '/amor', label: 'Amor', icon: Heart },
  { id: 'musica', path: '/musica', label: 'Música', icon: Music },
  { id: 'conquistas', path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { id: 'mensagens', path: '/mensagens', label: 'Mensagens', icon: MessageCircle },
  { id: 'surpresas', path: '/surpresas', label: 'Surpresas', icon: Gift },
  { id: 'legado', path: '/legado', label: 'Legado', icon: Archive },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleTabClick = (path) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    router.push(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Glassmorphism Background */}
      <div className="bg-surface/95 backdrop-blur-xl border-t border-textPrimary/10 shadow-soft-xl">
        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex items-center justify-start min-w-max px-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname === tab.path

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path)}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex flex-col items-center justify-center px-4 py-2 min-w-[80px] rounded-xl transition-all duration-300 touch-manipulation ${
                    isActive
                      ? 'text-primary'
                      : 'text-textSecondary'
                  }`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <Icon
                    size={24}
                    className={`relative z-10 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`}
                  />

                  {/* Label */}
                  <span
                    className={`relative z-10 text-xs font-medium ${
                      isActive ? 'font-semibold' : ''
                    }`}
                  >
                    {tab.label}
                  </span>

                  {/* Glow Effect for Active Tab */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-xl blur-sm -z-10"
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Safe Area Spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-surface/95 backdrop-blur-xl" />
    </nav>
  )
}

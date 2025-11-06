'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Image, Heart, Music, Trophy, MessageCircle, Gift, Archive, MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'
import BottomSheet from '@/components/ui/BottomSheet'

const mainTabs = [
  { id: 'inicio', path: '/', label: 'Início', icon: Home },
  { id: 'galeria', path: '/galeria', label: 'Galeria', icon: Image },
  { id: 'amor', path: '/amor', label: 'Amor', icon: Heart },
]

const moreTabs = [
  { id: 'musica', path: '/musica', label: 'Música', icon: Music },
  { id: 'conquistas', path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { id: 'mensagens', path: '/mensagens', label: 'Mensagens', icon: MessageCircle },
  { id: 'surpresas', path: '/surpresas', label: 'Surpresas', icon: Gift },
  { id: 'legado', path: '/legado', label: 'Legado', icon: Archive },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleTabClick = (path) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    setIsMenuOpen(false)
    router.push(path)
  }

  const handleMenuClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    setIsMenuOpen(true)
  }

  // Check if current path is in moreTabs
  const isMoreTabActive = moreTabs.some(tab => tab.path === pathname)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Glassmorphism Background */}
        <div className="bg-surface/95 backdrop-blur-xl border-t border-textPrimary/10 shadow-soft-xl">
          <div className="flex items-center justify-around px-2 py-2">
            {mainTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = pathname === tab.path

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path)}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 touch-manipulation ${
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

            {/* Menu Button */}
            <motion.button
              onClick={handleMenuClick}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 touch-manipulation ${
                isMoreTabActive
                  ? 'text-primary'
                  : 'text-textSecondary'
              }`}
            >
              {/* Active Indicator */}
              {isMoreTabActive && (
                <motion.div
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon */}
              <MoreHorizontal
                size={24}
                className={`relative z-10 mb-1 ${isMoreTabActive ? 'stroke-[2.5]' : 'stroke-[2]'}`}
              />

              {/* Label */}
              <span
                className={`relative z-10 text-xs font-medium ${
                  isMoreTabActive ? 'font-semibold' : ''
                }`}
              >
                Menu
              </span>

              {/* Glow Effect */}
              {isMoreTabActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-xl blur-sm -z-10"
                />
              )}
            </motion.button>
          </div>
        </div>

        {/* Safe Area Spacer for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-surface/95 backdrop-blur-xl" />
      </nav>

      {/* Bottom Sheet Menu */}
      <BottomSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="Menu"
      >
        <div className="space-y-2">
          {moreTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.path

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.path)}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 touch-manipulation ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-textPrimary/5 text-textPrimary'
                }`}
              >
                <Icon
                  size={24}
                  className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'}
                />
                <span className={`text-base font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {tab.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}

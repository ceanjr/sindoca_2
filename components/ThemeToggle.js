'use client'

import { Sun, Moon, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useApp } from './AppProvider'

const themes = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'romantic', label: 'Romantic', icon: Heart },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useApp()

  const handleThemeChange = (newTheme) => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    setTheme(newTheme)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-6 right-6 z-40 glass-strong rounded-full p-2 shadow-glow"
    >
      <div className="flex gap-2">
        {themes.map((t) => {
          const Icon = t.icon
          const isActive = theme === t.id

          return (
            <motion.button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-3 rounded-full transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isActive
                  ? 'bg-primary text-white shadow-glow'
                  : 'hover:bg-white/10'
              }`}
              title={t.label}
              aria-label={`Switch to ${t.label} theme`}
            >
              <Icon size={20} />
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

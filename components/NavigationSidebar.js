'use client'

import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Image,
  Heart,
  Music,
  Trophy,
  MessageCircle,
  Gift,
  Archive,
} from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { id: 'home', path: '/home', label: 'Home', icon: Home },
  { id: 'galeria', path: '/galeria', label: 'Galeria', icon: Image },
  { id: 'amor', path: '/amor', label: 'O Que Amo', icon: Heart },
  { id: 'musica', path: '/musica', label: 'Música', icon: Music },
  { id: 'conquistas', path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { id: 'mensagens', path: '/mensagens', label: 'Mensagens', icon: MessageCircle },
  { id: 'surpresas', path: '/surpresas', label: 'Surpresas', icon: Gift },
  { id: 'legado', path: '/legado', label: 'Legado', icon: Archive },
]

export default function NavigationSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavClick = (path) => {
    router.push(path)
  }

  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 z-40 bg-surface rounded-3xl p-4 shadow-soft-lg"
    >
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary text-white shadow-soft-md'
                  : 'text-textSecondary hover:bg-surfaceAlt hover:text-textPrimary'
              }`}
              title={item.label}
            >
              <Icon size={20} />
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-xl border-2 border-primary/20"
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Image,
  Heart,
  Music,
  Trophy,
  MessageCircle,
  Gift,
  Archive,
} from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { id: 'inicio', path: '/', label: 'Início', icon: Home },
  { id: 'galeria', path: '/galeria', label: 'Galeria', icon: Image },
  { id: 'amor', path: '/amor', label: 'O Que Amo', icon: Heart },
  { id: 'musica', path: '/musica', label: 'Música', icon: Music },
  { id: 'conquistas', path: '/conquistas', label: 'Conquistas', icon: Trophy },
  {
    id: 'mensagens',
    path: '/mensagens',
    label: 'Mensagens',
    icon: MessageCircle,
  },
  { id: 'surpresas', path: '/surpresas', label: 'Surpresas', icon: Gift },
  { id: 'legado', path: '/legado', label: 'Legado', icon: Archive },
];

export default function NavigationSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (path) => {
    router.push(path);
  };

  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:flex fixed left-0 top-0 h-screen w-[72px] bg-white shadow-soft-lg z-40 flex-col py-8"
    >
      <div className="flex flex-col items-center gap-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-primary text-white shadow-soft-md'
                  : 'text-textSecondary hover:bg-surfaceAlt hover:text-textPrimary'
              }`}
              title={item.label}
            >
              <Icon size={24} />

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>

              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-xl border-2 border-primary/30"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

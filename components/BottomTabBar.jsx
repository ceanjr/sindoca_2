'use client';

import { useState } from 'react';
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
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';
import BottomSheet from '@/components/ui/BottomSheet';
import { usePageConfig } from '@/hooks/usePageConfig';
import { createClient } from '@/lib/supabase/client';

const mainTabs = [
  { id: 'inicio', path: '/', label: 'Início', icon: Home },
  { id: 'galeria', path: '/galeria', label: 'Galeria', icon: Image },
  { id: 'razoes', path: '/razoes', label: 'Razões', icon: Heart },
];

const moreTabs = [
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

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isPageActive, isAdmin } = usePageConfig();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push('/auth/login');
  };

  const handleTabClick = (path, pageId) => {
    // Admin can access all pages, even disabled ones
    const canAccess = isAdmin || isPageActive(pageId);

    if (!canAccess) {
      // Haptic feedback for denied access
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]); // Triple vibration for error
      }
      return; // Don't navigate if page is disabled
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setIsMenuOpen(false);
    router.push(path);
  };

  const handleMenuClick = () => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setIsMenuOpen(true);
  };

  // Check if current path is in moreTabs
  const isMoreTabActive = moreTabs.some((tab) => tab.path === pathname);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Glassmorphism Background */}
        <div className="bg-surface/95 backdrop-blur-xl border-t border-textPrimary/10 shadow-soft-xl">
          <div className="flex items-center justify-around px-2 py-2">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.path;
              const pageIsActive = isPageActive(tab.id);
              const canAccess = isAdmin || pageIsActive;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path, tab.id)}
                  whileTap={canAccess ? { scale: 0.95 } : {}}
                  disabled={!canAccess}
                  className={`relative flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 touch-manipulation ${
                    !canAccess
                      ? 'opacity-40 cursor-not-allowed text-gray-400'
                      : isActive
                      ? 'text-primary'
                      : 'text-textSecondary'
                  }`}
                >
                  {/* Active Indicator */}
                  {isActive && canAccess && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Icon */}
                  <Icon
                    size={24}
                    className={`relative z-10 mb-1 ${
                      isActive ? 'stroke-[2.5]' : 'stroke-[2]'
                    }`}
                  />

                  {/* Label */}
                  <span
                    className={`relative z-10 text-xs font-medium ${
                      isActive ? 'font-semibold' : ''
                    }`}
                  >
                    {tab.label}
                    {isAdmin && !pageIsActive && canAccess && (
                      <span className="ml-1 text-yellow-300 text-[10px]">⚠️</span>
                    )}
                  </span>

                  {/* Glow Effect for Active Tab */}
                  {isActive && canAccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-xl blur-sm -z-10"
                    />
                  )}
                </motion.button>
              );
            })}

            {/* Menu Button */}
            <motion.button
              onClick={handleMenuClick}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 touch-manipulation ${
                isMoreTabActive ? 'text-primary' : 'text-textSecondary'
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
                className={`relative z-10 mb-1 ${
                  isMoreTabActive ? 'stroke-[2.5]' : 'stroke-[2]'
                }`}
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
            const Icon = tab.icon;
            const isActive = pathname === tab.path;
            const pageIsActive = isPageActive(tab.id);
            const canAccess = isAdmin || pageIsActive;

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.path, tab.id)}
                whileTap={canAccess ? { scale: 0.98 } : {}}
                disabled={!canAccess}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 touch-manipulation ${
                  !canAccess
                    ? 'opacity-40 cursor-not-allowed text-gray-400'
                    : isActive
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-textPrimary/5 text-textPrimary'
                }`}
              >
                <Icon
                  size={24}
                  className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'}
                />
                <span
                  className={`text-base font-medium ${
                    isActive ? 'font-semibold' : ''
                  }`}
                >
                  {tab.label}
                  {isAdmin && !pageIsActive && canAccess && (
                    <span className="ml-2 text-yellow-300 text-sm">⚠️</span>
                  )}
                </span>
              </motion.button>
            );
          })}

          {/* Divider */}
          <div className="border-t border-textPrimary/10 my-2" />

          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 touch-manipulation bg-red-500/10 hover:bg-red-500/20 text-red-600"
          >
            <LogOut size={24} className="stroke-[2]" />
            <span className="text-base font-medium">Sair</span>
          </motion.button>
        </div>
      </BottomSheet>
    </>
  );
}

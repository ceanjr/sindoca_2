'use client';

import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Home,
  Image,
  Heart,
  Music,
  Trophy,
  MessageCircle,
  Gift,
  Archive,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePageConfig } from '@/hooks/usePageConfig';

const navItems = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'galeria', label: 'Galeria', icon: Image },
  { id: 'razoes', label: 'Razões', icon: Heart },
  { id: 'musica', label: 'Música', icon: Music },
  { id: 'conquistas', label: 'Conquistas', icon: Trophy },
  { id: 'mensagens', label: 'Mensagens', icon: MessageCircle },
  { id: 'surpresas', label: 'Surpresas', icon: Gift },
  { id: 'legado', label: 'Legado', icon: Archive },
];

export default function Navigation({ activeSection, onSectionChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isPageActive, isAdmin } = usePageConfig();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavClick = (id) => {
    // Admin can access all pages, even disabled ones
    const canAccess = isAdmin || isPageActive(id);

    if (!canAccess) {
      return; // Don't scroll if page is disabled
    }

    onSectionChange(id);
    setIsOpen(false);

    // Smooth scroll to section
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Mobile Menu
  if (isMobile) {
    return (
      <>
        {/* Hamburger Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsOpen(!isOpen)}
          className="fixed z-50 bg-surface shadow-soft-lg rounded-2xl p-3 text-textPrimary hover:shadow-soft-xl transition-all duration-300"
          style={{
            top: 'calc(1.5rem + env(safe-area-inset-top))',
            right: 'calc(1.5rem + env(safe-area-inset-right))',
          }}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-textPrimary/20 backdrop-blur-sm z-40"
              />

              {/* Menu */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface shadow-soft-xl z-40 overflow-y-auto"
                style={{
                  paddingTop: 'calc(2rem + env(safe-area-inset-top))',
                  paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
                  paddingLeft: '2rem',
                  paddingRight: 'calc(2rem + env(safe-area-inset-right))',
                }}
              >
                <div className="mt-20 space-y-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    const pageIsActive = isPageActive(item.id);
                    // Admin can access all pages
                    const canAccess = isAdmin || pageIsActive;

                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleNavClick(item.id)}
                        disabled={!canAccess}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 touch-manipulation min-h-[44px] ${
                          !canAccess
                            ? 'opacity-40 cursor-not-allowed text-gray-400'
                            : isActive
                            ? 'bg-primary text-white shadow-soft-md'
                            : 'text-textPrimary hover:bg-surfaceAlt'
                        }`}
                      >
                        <Icon size={24} />
                        <span className="text-lg font-medium">
                          {item.label}
                          {!pageIsActive && !isAdmin && (
                            <span className="text-xs ml-2">(Desativada)</span>
                          )}
                          {!pageIsActive && isAdmin && (
                            <span className="text-xs ml-2 text-yellow-300">
                              ⚠️
                            </span>
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <motion.nav
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-6 top-1/2 -translate-y-1/2 z-40 bg-surface rounded-3xl p-4 shadow-soft-lg"
    >
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const pageIsActive = isPageActive(item.id);
          // Admin can access all pages
          const canAccess = isAdmin || pageIsActive;

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              whileHover={canAccess ? { scale: 1.05 } : {}}
              whileTap={canAccess ? { scale: 0.95 } : {}}
              disabled={!canAccess}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                !canAccess
                  ? 'opacity-40 cursor-not-allowed text-gray-400'
                  : isActive
                  ? 'bg-primary text-white shadow-soft-md'
                  : 'text-textSecondary hover:bg-surfaceAlt hover:text-textPrimary'
              }`}
              title={canAccess ? item.label : `${item.label} (Desativada)`}
            >
              <Icon size={20} />
              {/* Show text on hover if can access */}
              {canAccess && (
                <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  {item.label}
                  {isAdmin && !pageIsActive && (
                    <span className="ml-1 text-yellow-300">⚠️</span>
                  )}
                </span>
              )}

              {isActive && canAccess && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-xl border-2 border-primary/20"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

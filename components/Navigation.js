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

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'galeria', label: 'Galeria', icon: Image },
  { id: 'amor', label: 'O Que Amo', icon: Heart },
  { id: 'musica', label: 'Música', icon: Music },
  { id: 'conquistas', label: 'Conquistas', icon: Trophy },
  { id: 'mensagens', label: 'Mensagens', icon: MessageCircle },
  { id: 'sandbox', label: 'Surpresas', icon: Gift },
  { id: 'legado', label: 'Legado', icon: Archive },
];

export default function Navigation({ activeSection, onSectionChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavClick = (id) => {
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
          className="fixed top-6 right-6 z-50 bg-surface shadow-soft-lg rounded-2xl p-3 text-textPrimary hover:shadow-soft-xl transition-all duration-300"
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
                className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface shadow-soft-xl z-40 p-8 overflow-y-auto"
              >
                <div className="mt-20 space-y-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;

                    return (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 touch-manipulation min-h-[44px] ${
                          isActive
                            ? 'bg-primary text-white shadow-soft-md'
                            : 'text-textPrimary hover:bg-surfaceAlt'
                        }`}
                      >
                        <Icon size={24} />
                        <span className="text-lg font-medium">
                          {item.label}
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

          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
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
          );
        })}
      </div>
    </motion.nav>
  );
}

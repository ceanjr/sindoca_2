'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Image, Heart, Music, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageConfig } from '@/hooks/usePageConfig';
import { createClient } from '@/lib/supabase/client';
import MenuSheet from '@/components/menu/MenuSheet';

/**
 * Detecta o sistema operacional do usuário
 */
function detectOS() {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

// 5 tabs principais visíveis na bottom tab bar
const tabs = [
  { id: 'inicio', path: '/', label: 'Início', icon: Home },
  { id: 'galeria', path: '/galeria', label: 'Galeria', icon: Image },
  { id: 'razoes', path: '/razoes', label: 'Razões', icon: Heart },
  { id: 'musica', path: '/musica', label: 'Música', icon: Music },
  { id: 'menu', path: null, label: 'Menu', icon: MoreHorizontal }, // null = abre sheet
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [os, setOs] = useState('other');
  const { isPageActive, isAdmin } = usePageConfig();

  // Detectar OS no mount
  useEffect(() => {
    setOs(detectOS());
  }, []);

  // Monitor emoji picker state via CSS variable
  useEffect(() => {
    let lastValue = null;

    const checkEmojiPicker = () => {
      const isOpen =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--emoji-picker-open')
          .trim() === '1';

      // Only update if value changed from last check
      if (lastValue !== isOpen) {
        lastValue = isOpen;
        setIsEmojiPickerOpen(isOpen);
      }
    };

    // Initial check
    checkEmojiPicker();

    // Set up a mutation observer to watch for CSS variable changes
    const observer = new MutationObserver(checkEmojiPicker);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.push('/auth/login');
  };

  const handleTabClick = (tab) => {
    // Se for tab de menu, abre o sheet
    if (tab.id === 'menu') {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      setIsMenuOpen(true);
      return;
    }

    // Admin can access all pages, even disabled ones
    const canAccess = isAdmin || isPageActive(tab.id);

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
    router.push(tab.path);
  };

  // Estilos dinâmicos baseados no OS
  const isIOS = os === 'ios';
  const isAndroid = os === 'android';

  return (
    <>
      <motion.nav
        className={`fixed z-[1000] lg:hidden ${
          isIOS ? 'bottom-2' : 'bottom-4'
        }`}
        style={{
          left: '12px',
          right: '12px',
        }}
        animate={{
          y: isEmojiPickerOpen || isMenuOpen ? 120 : 0,
          opacity: isEmojiPickerOpen || isMenuOpen ? 0 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        <div
          style={{
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          {/* Floating Tab Bar Container */}
          <div
            className={`relative overflow-hidden ${
              isIOS
                ? 'rounded-[28px] shadow-[0_10px_40px_rgba(0,0,0,0.12)]'
                : 'rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
            }`}
            style={{
              backdropFilter: isIOS
                ? 'blur(20px) saturate(180%)'
                : 'blur(10px)',
              backgroundColor: isIOS
                ? 'rgba(255, 255, 255, 0.85)'
                : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${
                isIOS ? 'rgba(255, 107, 157, 0.15)' : 'rgba(255, 107, 157, 0.2)'
              }`,
            }}
          >
            {/* Tab Buttons */}
            <div
              className={`flex items-center justify-around ${
                isIOS ? 'px-3 gap-1.5' : 'px-2 gap-1'
              }`}
              style={{
                paddingTop: isIOS ? '8px' : '6px',
                paddingBottom: isIOS
                  ? 'max(8px, env(safe-area-inset-bottom))'
                  : 'max(6px, env(safe-area-inset-bottom))',
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.path ? pathname === tab.path : false;
                const isMenuTab = tab.id === 'menu';
                const pageIsActive = isPageActive(tab.id);
                const canAccess = isMenuTab || isAdmin || pageIsActive;

                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    whileTap={canAccess ? { scale: isIOS ? 0.92 : 0.95 } : {}}
                    disabled={!canAccess && !isMenuTab}
                    className={`relative flex flex-col items-center justify-center flex-1 ${
                      isIOS ? 'py-1 px-1' : 'py-0.5 px-1'
                    } rounded-xl transition-all touch-manipulation ${
                      !canAccess && !isMenuTab
                        ? 'opacity-40 cursor-not-allowed'
                        : ''
                    }`}
                    style={{
                      transitionDuration: isIOS ? '350ms' : '250ms',
                      transitionTimingFunction: isIOS
                        ? 'cubic-bezier(0.4, 0, 0.2, 1)'
                        : 'cubic-bezier(0.4, 0, 0.6, 1)',
                    }}
                  >
                    {/* Android: Top indicator */}
                    {isAndroid && isActive && canAccess && (
                      <div
                        className="absolute top-0 left-3 right-3 h-[3px] bg-primary rounded-b-full"
                        style={{
                          boxShadow: '0 2px 4px rgba(255, 107, 157, 0.4)',
                        }}
                      />
                    )}

                    {/* Icon Container */}
                    <motion.div
                      animate={{
                        y: isIOS && isActive && canAccess ? -4 : 0,
                        scale: isIOS && isActive && canAccess ? 1.15 : 1,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="relative"
                    >
                      <Icon
                        size={24}
                        className={`${
                          isActive && canAccess
                            ? 'text-primary stroke-[2.5]'
                            : !canAccess && !isMenuTab
                            ? 'text-gray-400 stroke-[2]'
                            : 'text-textSecondary stroke-[2]'
                        }`}
                      />

                      {/* iOS: Glow effect on active */}
                      {isIOS && isActive && canAccess && (
                        <div
                          className="absolute inset-0 bg-primary/20 rounded-full blur-md -z-10"
                          style={{ transform: 'scale(1.5)' }}
                        />
                      )}
                    </motion.div>

                    {/* Label */}
                    <motion.span
                      animate={{
                        opacity: isIOS ? (isActive && canAccess ? 1 : 0.7) : 1,
                      }}
                      className={`mt-1 ${
                        isIOS ? 'text-[11px] font-medium' : 'text-[12px]'
                      } ${
                        isActive && canAccess
                          ? isAndroid
                            ? 'text-primary font-bold'
                            : 'text-primary font-semibold'
                          : !canAccess && !isMenuTab
                          ? 'text-gray-400 font-medium'
                          : 'text-textSecondary font-medium'
                      }`}
                    >
                      {tab.label}
                      {isAdmin && !pageIsActive && canAccess && !isMenuTab && (
                        <span className="ml-1 text-yellow-500 text-[10px]">
                          ⚠️
                        </span>
                      )}
                    </motion.span>

                    {/* Android: Ripple effect */}
                    {isAndroid && (
                      <span className="absolute inset-0 overflow-hidden rounded-xl">
                        <span className="ripple" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Menu Sheet */}
      <MenuSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Android Ripple Effect Styles */}
      {isAndroid && (
        <style jsx>{`
          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 0.5;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          .ripple {
            position: absolute;
            inset: 0;
            background: radial-gradient(
              circle,
              rgba(255, 107, 157, 0.3) 0%,
              transparent 70%
            );
            transform: scale(0);
            pointer-events: none;
          }
          button:active .ripple {
            animation: ripple 0.6s ease-out;
          }
        `}</style>
      )}
    </>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Heart, Smile } from 'lucide-react';
import ReactionMenu from './ReactionMenu';
import { useReactions } from '@/hooks/useReactions';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Menu de 3 pontinhos para fotos da galeria
 * Oferece opções de Favoritar e Reagir
 */
export default function PhotoMenu({
  photo,
  onToggleFavorite,
  position = 'bottom-left', // 'bottom-left', 'bottom-right', 'top-left', 'top-right'
  variant = 'mobile', // 'mobile' or 'desktop'
}) {
  const { user } = useAuth();
  const { myReaction } = useReactions(photo.id);
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const dropdownMenuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside button and menu
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target);
      const isOutsideDropdown = !dropdownMenuRef.current || !dropdownMenuRef.current.contains(e.target);

      if (isOutsideButton && isOutsideDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate closure when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Vibration helper
  const triggerVibration = (duration = 50) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(duration);
        console.log('[PhotoMenu] Vibration triggered:', duration, 'ms');
      }
    } catch (err) {
      console.error('[PhotoMenu] Vibration error:', err);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const newState = !isOpen;

    // Calculate menu position when opening
    if (newState && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 60; // Single option menu

      let top = rect.bottom + 8; // 8px gap
      let left = rect.left;

      // Adjust if menu goes off-screen
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8;
      }

      setMenuCoords({ top, left });
      triggerVibration(30);
    }

    setIsOpen(newState);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    e.preventDefault();
    triggerVibration(50);
    onToggleFavorite(photo.id);
    setIsOpen(false);
  };

  const buttonClasses = variant === 'desktop'
    ? 'w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-md transition-colors bg-white/30 text-white hover:bg-white/50'
    : 'w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-md shadow-lg transition-colors bg-white/80 hover:bg-white text-gray-700';

  return (
    <>
      {/* Menu Button - 28x28px */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={buttonClasses}
        title="Opções"
      >
        <MoreVertical size={16} />
      </motion.button>

      {/* Dropdown Menu - Fixed positioning to avoid clipping */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownMenuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden min-w-[160px]"
            style={{
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Favoritar - única opção do menu */}
            <button
              onClick={handleFavorite}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleFavorite(e);
              }}
              className={`w-full px-3 py-2 flex items-center gap-2 transition-colors text-left ${
                photo.favorite
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Heart
                size={16}
                fill={photo.favorite ? 'currentColor' : 'none'}
              />
              <span className="font-medium text-sm">
                {photo.favorite ? 'Desfavoritar' : 'Favoritar'}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

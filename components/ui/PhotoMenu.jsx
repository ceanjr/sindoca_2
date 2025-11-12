'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Heart, Smile } from 'lucide-react';
import ReactionMenu from './ReactionMenu';
import { useReactions } from '@/hooks/useReactions';
import { addReactionWithNotification, removeReactionWithNotification } from '@/lib/api/reactions';
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
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Debug state changes
  useEffect(() => {
    console.log('[PhotoMenu] State changed:', { isOpen, showReactionMenu, photoId: photo.id });
  }, [isOpen, showReactionMenu, photo.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowReactionMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
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
      const menuHeight = 100; // Approximate

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
    setShowReactionMenu(false);
  };

  const handleFavorite = (e) => {
    e.stopPropagation();
    e.preventDefault();
    triggerVibration(50);
    onToggleFavorite(photo.id);
    setIsOpen(false);
  };

  const handleReact = (e) => {
    e.stopPropagation();
    e.preventDefault();

    console.log('[PhotoMenu] handleReact called', { canReact, user: user?.id, author: photo.author_id });

    // Check if user can react
    if (!canReact) {
      console.log('[PhotoMenu] User cannot react to own content');
      setIsOpen(false);
      return;
    }

    console.log('[PhotoMenu] Opening reaction menu');
    triggerVibration(30);

    // Recalculate menu position for reaction menu (may need different position)
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 300; // Reaction menu is wider
      const menuHeight = 60;

      let top = rect.bottom + 8;
      let left = rect.left;

      // Adjust if menu goes off-screen
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8;
      }

      setMenuCoords({ top, left });
    }

    setShowReactionMenu(true);
  };

  const handleReaction = async (emoji) => {
    if (!user || !photo.id) return;

    // User cannot react to their own content
    if (photo.author_id === user.id) {
      return;
    }

    // Vibrate when selecting emoji
    triggerVibration(50);

    if (emoji === null || myReaction === emoji) {
      // Remove reaction
      await removeReactionWithNotification(photo.id, user.id);
    } else {
      // Add or update reaction
      await addReactionWithNotification(photo.id, user.id, emoji, {
        type: 'photo',
        title: photo.caption || 'Foto',
        authorId: photo.author_id,
        url: '/galeria',
      });
    }

    setShowReactionMenu(false);
    setIsOpen(false);
  };

  const canReact = user && photo.author_id && photo.author_id !== user.id;

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
        {isOpen && !showReactionMenu && (
          <motion.div
            ref={menuRef}
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
            {/* Favoritar */}
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

            {/* Reagir - always show, check canReact inside */}
            <button
              onClick={handleReact}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleReact(e);
              }}
              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-gray-700 transition-colors border-t border-gray-100 text-left"
            >
              <Smile size={16} />
              <span className="font-medium text-sm">
                {myReaction ? `Mudar reação ${myReaction}` : 'Reagir'}
              </span>
            </button>
          </motion.div>
        )}

        {/* Reaction Menu */}
        {isOpen && showReactionMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999]"
            style={{
              top: `${menuCoords.top}px`,
              left: `${menuCoords.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ReactionMenu
              contentId={photo.id}
              currentReaction={myReaction}
              onReact={handleReaction}
              position="bottom"
              isOpen={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

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
  const menuRef = useRef(null);

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
    setIsOpen(newState);
    setShowReactionMenu(false);

    // Vibrate when opening menu
    if (newState) {
      triggerVibration(30);
    }
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
    triggerVibration(30);
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

  // Determine menu position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'top-full mt-2 right-0';
      case 'top-left':
        return 'bottom-full mb-2 left-0';
      case 'top-right':
        return 'bottom-full mb-2 right-0';
      case 'bottom-left':
      default:
        return 'top-full mt-2 left-0';
    }
  };

  const buttonClasses = variant === 'desktop'
    ? 'p-2 rounded-full backdrop-blur-md transition-colors bg-white/30 text-white hover:bg-white/50'
    : 'p-2 rounded-full backdrop-blur-md shadow-lg transition-colors bg-white/80 hover:bg-white text-gray-700';

  return (
    <div ref={menuRef} className="relative">
      {/* Menu Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className={buttonClasses}
        title="Opções"
      >
        <MoreVertical size={variant === 'desktop' ? 18 : 20} />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && !showReactionMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${getPositionClasses()} z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[200px]`}
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
              className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                photo.favorite
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Heart
                size={18}
                fill={photo.favorite ? 'currentColor' : 'none'}
              />
              <span className="font-medium text-sm">
                {photo.favorite ? 'Remover favorito' : 'Favoritar'}
              </span>
            </button>

            {/* Reagir - only show if user can react */}
            {canReact && (
              <button
                onClick={handleReact}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleReact(e);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors border-t border-gray-100"
              >
                <Smile size={18} />
                <span className="font-medium text-sm">
                  {myReaction ? `Mudar reação ${myReaction}` : 'Reagir'}
                </span>
              </button>
            )}
          </motion.div>
        )}

        {/* Reaction Menu */}
        {isOpen && showReactionMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${getPositionClasses()} z-50`}
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
    </div>
  );
}

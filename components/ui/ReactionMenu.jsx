'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🤔'];

export default function ReactionMenu({
  contentId,
  currentReaction,
  onReact,
  disabled = false,
  position = 'auto', // 'auto', 'top', 'bottom'
  isOpen = true, // Controlled by parent
}) {
  const [menuPosition, setMenuPosition] = useState('bottom');
  const menuRef = useRef(null);

  // Calculate optimal menu position
  useEffect(() => {
    if (position !== 'auto') {
      setMenuPosition(position);
    }
  }, [position]);

  const handleReaction = (emoji) => {
    if (disabled) return;

    // Haptic feedback on emoji selection
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(40); // Short vibration on emoji tap
        console.log('[ReactionMenu] Vibration triggered: 40ms');
      }
    } catch (err) {
      console.error('[ReactionMenu] Vibration error:', err);
    }

    // If same emoji clicked, remove reaction
    if (currentReaction === emoji) {
      onReact(null);
    } else {
      onReact(emoji);
    }
  };

  const menuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: menuPosition === 'bottom' ? -5 : 5,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: menuPosition === 'bottom' ? -5 : 5,
      transition: {
        duration: 0.15,
      },
    },
  };

  const emojiVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.03, // Mais rápido
        type: 'spring',
        stiffness: 400,
        damping: 20,
        duration: 0.2,
      },
    }),
  };

  if (!isOpen) return null;

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <motion.div
      ref={menuRef}
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="relative"
      style={{ pointerEvents: 'auto' }}
    >
      <div className={`bg-white rounded-2xl shadow-2xl flex items-center border border-gray-200 ${
        isMobile 
          ? 'px-2 py-1.5 gap-0.5' // Mobile: mais compacto
          : 'px-2.5 py-2 gap-1'    // Desktop: um pouco maior
      }`}>
        {AVAILABLE_EMOJIS.map((emoji, index) => (
          <motion.button
            key={emoji}
            custom={index}
            variants={emojiVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleReaction(emoji)}
            className={`flex items-center justify-center rounded-full transition-all duration-200 ${
              isMobile 
                ? 'w-8 h-8 text-xl'   // Mobile: menor
                : 'w-9 h-9 text-2xl'   // Desktop: médio
            } ${
              currentReaction === emoji
                ? 'bg-primary/10 ring-2 ring-primary'
                : 'hover:bg-gray-100'
            }`}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
      
      {/* Arrow pointer */}
      <div
        className={`absolute left-4 w-0 h-0 ${
          menuPosition === 'bottom'
            ? '-top-2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white'
            : '-bottom-2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white'
        }`}
      />
    </motion.div>
  );
}

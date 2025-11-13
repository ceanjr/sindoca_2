'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCustomEmojis, addCustomEmoji, updateEmojiUsage } from '@/lib/api/customEmojis';
import EmojiPicker from './EmojiPicker';

const DEFAULT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🤔'];

export default function ReactionMenu({
  contentId,
  currentReaction,
  onReact,
  onClose,
  disabled = false,
  position = 'auto', // 'auto', 'top', 'bottom'
  isOpen = true, // Controlled by parent
  arrowOffset = 0, // Horizontal offset for arrow positioning
}) {
  const { user } = useAuth();
  const [menuPosition, setMenuPosition] = useState('bottom');
  const [customEmojis, setCustomEmojis] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const menuRef = useRef(null);
  const scrollRef = useRef(null);
  const emojiWasSelected = useRef(false);

  // Load custom emojis
  useEffect(() => {
    if (user?.id && isOpen) {
      loadCustomEmojis();
    }
  }, [user?.id, isOpen]);

  // Track previous showEmojiPicker state to detect when picker closes
  const prevShowEmojiPicker = useRef(showEmojiPicker);
  useEffect(() => {
    // If picker was open and now is closed
    if (prevShowEmojiPicker.current && !showEmojiPicker) {
      console.log('[ReactionMenu] EmojiPicker closed');

      // Check if an emoji was selected
      if (!emojiWasSelected.current) {
        console.log('[ReactionMenu] No emoji selected, will close menu after animation');
        // Give time for picker close animation, then close the reaction menu
        setTimeout(() => {
          console.log('[ReactionMenu] Closing reaction menu via onClose');
          if (onClose) {
            onClose();
          }
        }, 300);
      } else {
        console.log('[ReactionMenu] Emoji was selected, keeping menu open for now');
        // The menu will close via handleReact -> setIsMenuOpen(false) in ReactableContent
      }
    }
    prevShowEmojiPicker.current = showEmojiPicker;
  }, [showEmojiPicker, onClose]);

  const loadCustomEmojis = async () => {
    try {
      const emojis = await getUserCustomEmojis(user.id);
      setCustomEmojis(emojis.map(e => e.emoji));
    } catch (error) {
      console.error('Error loading custom emojis:', error);
    }
  };

  const allEmojis = [...DEFAULT_EMOJIS, ...customEmojis];
  const MAX_VISIBLE_EMOJIS = 5;

  // Calculate optimal menu position
  useEffect(() => {
    if (position !== 'auto') {
      setMenuPosition(position);
    }
  }, [position]);


  const handleReaction = async (emoji) => {
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

    // Update last_used_at if it's a custom emoji
    if (customEmojis.includes(emoji) && user?.id) {
      try {
        await updateEmojiUsage(user.id, emoji);
      } catch (error) {
        console.error('Error updating emoji usage:', error);
      }
    }

    // If same emoji clicked, remove reaction
    if (currentReaction === emoji) {
      onReact(null);
    } else {
      onReact(emoji);
    }
  };

  const handleAddEmoji = async (emoji) => {
    if (!emoji || !user?.id) return;

    console.log('[ReactionMenu] handleAddEmoji called with:', emoji);

    // Mark that an emoji was selected
    emojiWasSelected.current = true;

    try {
      // First close the emoji picker
      setShowEmojiPicker(false);

      // Add the custom emoji
      await addCustomEmoji(user.id, emoji);
      await loadCustomEmojis();

      // Auto-select the new emoji as reaction (this calls onReact from parent)
      await handleReaction(emoji);

      console.log('[ReactionMenu] Emoji added and reaction triggered');
    } catch (error) {
      console.error('Error adding custom emoji:', error);
    } finally {
      // Reset the flag after processing
      setTimeout(() => {
        emojiWasSelected.current = false;
      }, 500);
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
          ? 'py-1.5 pl-2 pr-1' // Mobile: mais compacto
          : 'py-2 pl-2.5 pr-1.5'    // Desktop: um pouco maior
      }`}>
        {/* Scrollable emoji container - limited to MAX_VISIBLE_EMOJIS */}
        <div
          ref={scrollRef}
          className={`flex items-center overflow-x-auto scrollbar-hide ${
            isMobile ? 'gap-1 py-1 px-1' : 'gap-2 py-1.5 px-1.5'
          }`}
          style={{
            maxWidth: isMobile
              ? `${MAX_VISIBLE_EMOJIS * 36}px` // 36px = 32px (w-8) + 4px gap
              : `${MAX_VISIBLE_EMOJIS * 44}px`, // 44px = 36px (w-9) + 8px gap
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Existing and custom emojis */}
          {allEmojis.map((emoji, index) => (
            <motion.button
              key={emoji}
              custom={index}
              variants={emojiVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleReaction(emoji)}
              className={`flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${
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

        {/* Fixed add emoji button - stays on the right */}
        <motion.button
          variants={emojiVariants}
          custom={allEmojis.length}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            console.log('[ReactionMenu] Plus button clicked');
            e.stopPropagation();
            e.preventDefault();
            if (isOpening) return;
            setIsOpening(true);
            console.log('[ReactionMenu] Setting showEmojiPicker to true');
            setShowEmojiPicker(true);
            setTimeout(() => setIsOpening(false), 500);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (isOpening) return;
            setIsOpening(true);
            setShowEmojiPicker(true);
            setTimeout(() => setIsOpening(false), 500);
          }}
          type="button"
          data-ignore-reactable="true"
          className={`flex items-center justify-center rounded-full transition-all duration-200 bg-gray-100 hover:bg-gray-200 flex-shrink-0 ${
            isMobile
              ? 'w-8 h-8 ml-1'
              : 'w-9 h-9 ml-2'
          }`}
          style={{
            touchAction: 'manipulation'
          }}
          title="Adicionar emoji"
        >
          <Plus size={isMobile ? 16 : 18} className="text-gray-600" />
        </motion.button>
      </div>

      {/* Arrow pointer - positioned based on offset */}
      <div
        className={`absolute w-0 h-0 ${
          menuPosition === 'bottom'
            ? '-top-2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white'
            : '-bottom-2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white'
        }`}
        style={{
          left: arrowOffset > 0 ? `${arrowOffset + 16}px` : '16px', // Center on the element
        }}
      />

      {/* Emoji Picker Modal */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleAddEmoji}
      />
    </motion.div>
  );
}

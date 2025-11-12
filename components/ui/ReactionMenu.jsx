'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCustomEmojis, addCustomEmoji, updateEmojiUsage } from '@/lib/api/customEmojis';

const DEFAULT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🤔'];

export default function ReactionMenu({
  contentId,
  currentReaction,
  onReact,
  disabled = false,
  position = 'auto', // 'auto', 'top', 'bottom'
  isOpen = true, // Controlled by parent
  arrowOffset = 0, // Horizontal offset for arrow positioning
}) {
  const { user } = useAuth();
  const [menuPosition, setMenuPosition] = useState('bottom');
  const [customEmojis, setCustomEmojis] = useState([]);
  const [showEmojiInput, setShowEmojiInput] = useState(false);
  const [newEmoji, setNewEmoji] = useState('');
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Load custom emojis
  useEffect(() => {
    if (user?.id && isOpen) {
      loadCustomEmojis();
    }
  }, [user?.id, isOpen]);

  const loadCustomEmojis = async () => {
    try {
      const emojis = await getUserCustomEmojis(user.id);
      setCustomEmojis(emojis.map(e => e.emoji));
    } catch (error) {
      console.error('Error loading custom emojis:', error);
    }
  };

  const allEmojis = [...DEFAULT_EMOJIS, ...customEmojis];

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

  const handleAddEmoji = async (emojiValue) => {
    const emojiToAdd = emojiValue || newEmoji;

    if (!emojiToAdd.trim() || !user?.id) return;

    // Extract first emoji from input (in case user typed multiple)
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu;
    const matches = emojiToAdd.match(emojiRegex);
    const emoji = matches?.[0];

    if (!emoji) {
      console.log('[ReactionMenu] No valid emoji found in:', emojiToAdd);
      return;
    }

    try {
      await addCustomEmoji(user.id, emoji);
      await loadCustomEmojis();
      setNewEmoji('');
      setShowEmojiInput(false);

      // Auto-select the new emoji as reaction
      await handleReaction(emoji);
    } catch (error) {
      console.error('Error adding custom emoji:', error);
    }
  };

  // Handle emoji input change - auto-add on emoji selection
  const handleEmojiInputChange = (e) => {
    const value = e.target.value;
    setNewEmoji(value);

    // Auto-detect emoji and add immediately
    const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\uFE0F]/gu;
    const matches = value.match(emojiRegex);

    if (matches && matches.length > 0) {
      // Emoji detected, add it immediately
      handleAddEmoji(value);
    }
  };

  const handleShowInput = () => {
    setShowEmojiInput(true);
    // Small delay to ensure input is rendered
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Try to open emoji keyboard on mobile
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          // Trigger touch event to simulate user interaction
          const touchEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
          });
          inputRef.current.dispatchEvent(touchEvent);
        }
      }
    }, 50);
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
      } max-w-[90vw] overflow-x-auto scrollbar-hide`}>
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

        {/* Add emoji button or input */}
        {!showEmojiInput ? (
          <motion.button
            variants={emojiVariants}
            custom={allEmojis.length}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShowInput}
            className={`flex items-center justify-center rounded-full transition-all duration-200 bg-gray-100 hover:bg-gray-200 flex-shrink-0 ${
              isMobile
                ? 'w-8 h-8'
                : 'w-9 h-9'
            }`}
            title="Adicionar emoji"
          >
            <Plus size={isMobile ? 16 : 18} className="text-gray-600" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            className="flex items-center gap-1 flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={newEmoji}
              onChange={handleEmojiInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddEmoji();
                } else if (e.key === 'Escape') {
                  setShowEmojiInput(false);
                  setNewEmoji('');
                }
              }}
              placeholder="😀"
              maxLength={2}
              autoFocus
              className={`border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary ${
                isMobile ? 'w-10 h-8 text-xl' : 'w-12 h-9 text-2xl'
              }`}
              style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
              }}
            />
          </motion.div>
        )}
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
    </motion.div>
  );
}

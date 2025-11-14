'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Bottom sheet que mostra quem reagiu ao conteúdo
 * Similar ao WhatsApp
 */
export default function ReactionSheet({ isOpen, onClose, contentId, onRemoveReaction }) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  // Check if component is mounted (for portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load reactions with user details
  useEffect(() => {
    if (isOpen && contentId) {
      loadReactions();
    }
  }, [isOpen, contentId]);

  const loadReactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reactions')
        .select(`
          id,
          emoji,
          created_at,
          user_id,
          profiles:user_id (
            id,
            full_name,
            nickname,
            avatar_url
          )
        `)
        .eq('content_id', contentId)
        .eq('type', 'emoji')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setReactions(data || []);
    } catch (error) {
      console.error('[ReactionSheet] Error loading reactions:', error);
      setReactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
      };
    }
  }, [isOpen]);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const emoji = reaction.emoji;
    if (!acc[emoji]) {
      acc[emoji] = [];
    }
    acc[emoji].push(reaction);
    return acc;
  }, {});

  const handleRemove = async () => {
    if (onRemoveReaction) {
      await onRemoveReaction();
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const sheetContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[999998]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[999999] w-full bg-surfaceAlt rounded-t-3xl shadow-2xl"
            style={{
              maxHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <button
              type="button"
              className="py-3 flex justify-center cursor-pointer w-full flex-shrink-0"
              onClick={onClose}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </button>

            {/* Header */}
            <div className="px-4 pb-3 flex-shrink-0">
              <h3 className="text-textPrimary text-lg font-semibold text-center">
                {reactions.length === 1 ? '1 reação' : `${reactions.length} reações`}
              </h3>
            </div>

            {/* Emoji tabs (if multiple emojis) */}
            {Object.keys(groupedReactions).length > 1 && (
              <div className="px-4 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => (
                    <button
                      key={emoji}
                      className="flex-shrink-0 px-4 py-2 rounded-full bg-white border border-gray-200 flex items-center gap-2"
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className="text-textSecondary text-sm font-medium">
                        {emojiReactions.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reactions list */}
            <div
              className="flex-1 overflow-y-auto px-4 min-h-0"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : reactions.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-textSecondary">Nenhuma reação ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reactions.map((reaction) => {
                    const profile = reaction.profiles;
                    const isCurrentUser = reaction.user_id === user?.id;
                    const displayName = profile?.nickname || profile?.full_name || 'Usuário';

                    return (
                      <div
                        key={reaction.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-primary text-lg font-semibold">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p className="text-textPrimary font-medium">
                              {isCurrentUser ? 'Você' : displayName}
                            </p>
                            {isCurrentUser && (
                              <button
                                onClick={handleRemove}
                                className="text-textSecondary text-sm hover:text-primary transition-colors"
                              >
                                Toque para remover
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Emoji */}
                        <div className="text-2xl flex-shrink-0">
                          {reaction.emoji}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Safe Area Bottom - Fundo para iOS */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-surfaceAlt pointer-events-none"
              style={{
                height: 'env(safe-area-inset-bottom)',
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(sheetContent, document.body) : null;
}

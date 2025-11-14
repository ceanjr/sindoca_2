'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReactions } from '@/hooks/useReactions';
import ReactionSheet from './ReactionSheet';

/**
 * Display component to show reactions on content
 * Shows emoji counts in a compact way
 * Clicking opens a bottom sheet showing who reacted
 */
export default function ReactionDisplay({ contentId, className = '' }) {
  // Force re-render when reactions are updated
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Listen for global reaction updates
  useEffect(() => {
    const handleReactionUpdate = (event) => {
      // Only re-render if the update is for this content
      if (event.detail?.contentId === contentId) {
        setUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('reaction-updated', handleReactionUpdate);
    return () => window.removeEventListener('reaction-updated', handleReactionUpdate);
  }, [contentId]);

  const { reactionCounts, loading, reactions, removeReaction } = useReactions(contentId);

  // Don't return null during loading - instead render empty
  // This ensures React keeps the component mounted and re-renders when data arrives
  const hasReactions = Object.keys(reactionCounts).length > 0;

  if (!hasReactions) {
    return null;
  }

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsSheetOpen(true);
        }}
        className={`flex items-center gap-1 flex-wrap ${className}`}
      >
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <motion.div
            key={emoji}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className={`bg-white/95 backdrop-blur-md rounded-full flex items-center border border-primary/30 transition-all hover:scale-105 ${
              isMobile
                ? 'px-1.5 py-1' // Mobile: mais compacto
                : 'px-2 py-1' // Desktop
            }`}
          >
            <span
              className={`leading-none ${
                isMobile
                  ? 'text-sm' // Mobile: tamanho normal para boa visibilidade
                  : 'text-base' // Desktop: um pouco maior
              }`}
            >
              {emoji}
            </span>
          </motion.div>
        ))}
      </button>

      {/* Reaction Sheet */}
      <ReactionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        contentId={contentId}
        onRemoveReaction={removeReaction}
      />
    </>
  );
}

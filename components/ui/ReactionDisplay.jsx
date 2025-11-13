'use client';

import { motion } from 'framer-motion';
import { useReactions } from '@/hooks/useReactions';

/**
 * Display component to show reactions on content
 * Shows emoji counts in a compact way
 */
export default function ReactionDisplay({ contentId, className = '' }) {
  console.log('[ReactionDisplay] Component called with contentId:', contentId);

  const { reactionCounts, loading, reactions } = useReactions(contentId);

  console.log('[ReactionDisplay] Hook returned:', {
    contentId,
    reactionCounts,
    loading,
    reactionsCount: reactions?.length,
    reactionsRaw: reactions
  });

  // Don't return null during loading - instead render empty
  // This ensures React keeps the component mounted and re-renders when data arrives
  const hasReactions = Object.keys(reactionCounts).length > 0;

  if (!hasReactions && !loading) {
    console.log('[ReactionDisplay] No reactions to display, reactionCounts:', reactionCounts);
  }

  if (!hasReactions) {
    return null;
  }

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  console.log('[ReactionDisplay] Rendering reactions:', reactionCounts);

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <motion.div
          key={emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={`bg-white/95 backdrop-blur-md rounded-full flex items-center border border-primary/30 ${
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
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReactions } from '@/hooks/useReactions';

/**
 * Display component to show reactions on content
 * Shows emoji counts in a compact way
 */
export default function ReactionDisplay({ contentId, className = '' }) {
  console.log('[ReactionDisplay] Component called with contentId:', contentId);

  // Force re-render when reactions are updated
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Listen for global reaction updates
  useEffect(() => {
    const handleReactionUpdate = (event) => {
      // Only re-render if the update is for this content
      if (event.detail?.contentId === contentId) {
        console.log('[ReactionDisplay] Received reaction-updated event for contentId:', contentId);
        setUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('reaction-updated', handleReactionUpdate);
    return () => window.removeEventListener('reaction-updated', handleReactionUpdate);
  }, [contentId]);

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

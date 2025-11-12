'use client';

import { motion } from 'framer-motion';
import { useReactions } from '@/hooks/useReactions';

/**
 * Display component to show reactions on content
 * Shows emoji counts in a compact way
 */
export default function ReactionDisplay({ contentId, className = '' }) {
  const { reactionCounts, loading } = useReactions(contentId);

  if (loading || Object.keys(reactionCounts).length === 0) {
    return null;
  }

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <motion.div
          key={emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className={`bg-white/95 backdrop-blur-md rounded-full flex items-center border border-white/50 ${
            isMobile
              ? 'px-1.5 py-1' // Mobile: mais compacto
              : 'px-2 py-1' // Desktop
          } before:content-[''] before:absolute before:inset-0 before:bg-primary/10 before:rounded-full before:pointer-events-none`}
        >
          <span
            className={`leading-none ${
              isMobile
                ? 'text-xs' // Mobile: tamanho normal para boa visibilidade
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

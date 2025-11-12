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
          className={`bg-white/90 backdrop-blur-sm rounded-full flex items-center shadow-sm border border-gray-200 ${
            isMobile
              ? 'px-2 py-1' // Mobile: mais compacto
              : 'px-1.5 py-0.5' // Desktop
          } before:content-[''] before:absolute before:inset-0 before:bg-[#FF6B9D]/10 before:rounded-full before:pointer-events-none`}
        >
          <span
            className={`leading-none opacity-90 ${
              isMobile
                ? 'text-xs' // Mobile: menor
                : 'text-base' // Desktop
            }`}
          >
            {emoji}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

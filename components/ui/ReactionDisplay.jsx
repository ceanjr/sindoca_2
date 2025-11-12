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

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <motion.div
          key={emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center shadow-sm border border-gray-200"
        >
          <span className="text-base leading-none">{emoji}</span>
        </motion.div>
      ))}
    </div>
  );
}

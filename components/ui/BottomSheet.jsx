'use client';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function BottomSheet({ isOpen, onClose, children, title }) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDragEnd = (event, info) => {
    // Close if dragged down more than 150px or velocity is high
    if (info.offset.y > 150 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-soft-2xl max-h-[80vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1 bg-textSecondary/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-textPrimary/10">
              <h2 className="text-lg font-semibold text-textPrimary">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-textPrimary/5 transition-colors touch-manipulation"
              >
                <X size={20} className="text-textSecondary" />
              </button>
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto flex-1 px-6 py-4"
              style={{
                paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
              }}
            >
              {children}
            </div>

            {/* Safe Area for iOS - Fundo sólido */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-surface pointer-events-none"
              style={{
                height: 'env(safe-area-inset-bottom)',
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

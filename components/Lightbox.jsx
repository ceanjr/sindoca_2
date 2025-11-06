'use client'

import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import EditCaptionModal from './ui/EditCaptionModal'

export default function Lightbox({ isOpen, onClose, images, currentIndex, onNavigate, photos = [], onUpdateCaption }) {
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onNavigate(-1)
      if (e.key === 'ArrowRight') onNavigate(1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNavigate])

  // Touch handling for swipe
  useEffect(() => {
    if (!isOpen) return

    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    }

    const handleSwipe = () => {
      const swipeThreshold = 50
      if (touchStartX - touchEndX > swipeThreshold) {
        onNavigate(1) // Swipe left
      }
      if (touchEndX - touchStartX > swipeThreshold) {
        onNavigate(-1) // Swipe right
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isOpen, onNavigate])

  if (!images || images.length === 0) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClose}
            className="absolute top-4 right-4 md:top-8 md:right-8 z-10 glass-strong rounded-full p-3 hover:bg-white/20 transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close lightbox"
          >
            <X size={24} />
          </motion.button>

          {/* Edit Caption Button */}
          {onUpdateCaption && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingCaption(true)
              }}
              className="absolute top-4 right-20 md:top-8 md:right-24 z-10 glass-strong rounded-full p-3 hover:bg-white/20 transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Edit caption"
            >
              <Edit3 size={20} />
            </motion.button>
          )}

          {/* Previous Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(-1)
            }}
            className="absolute left-4 md:left-8 z-10 glass-strong rounded-full p-3 hover:bg-white/20 transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </motion.button>

          {/* Next Button */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={(e) => {
              e.stopPropagation()
              onNavigate(1)
            }}
            className="absolute right-4 md:right-8 z-10 glass-strong rounded-full p-3 hover:bg-white/20 transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </motion.button>

          {/* Image Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-strong rounded-full px-6 py-3"
          >
            <span className="text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          </motion.div>

          {/* Image */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center justify-center gap-4"
          >
            <img
              src={images[currentIndex]}
              alt={photos[currentIndex]?.caption || `Photo ${currentIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl shadow-primary/20"
              style={{ filter: 'saturate(1.2) contrast(1.1)' }}
            />

            {/* Caption */}
            {photos[currentIndex]?.caption && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-2xl px-6 py-4 max-w-2xl"
              >
                <p className="text-white text-center text-sm md:text-base">
                  {photos[currentIndex].caption}
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Edit Caption Modal */}
      <EditCaptionModal
        isOpen={isEditingCaption}
        onClose={() => setIsEditingCaption(false)}
        currentCaption={photos[currentIndex]?.caption || ''}
        onSave={async (newCaption) => {
          if (onUpdateCaption) {
            await onUpdateCaption(photos[currentIndex].id, newCaption)
          }
        }}
      />
    </AnimatePresence>
  )
}

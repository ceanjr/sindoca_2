'use client'

import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'framer-motion'
import { Heart, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import OptimizedImage from '@/components/OptimizedImage'

interface Photo {
  id: string
  url: string
  title?: string
  description?: string
  created_at: string
  is_favorite?: boolean
}

interface VirtualGalleryProps {
  photos: Photo[]
  columns?: number
  onPhotoClick?: (photo: Photo, index: number) => void
  onToggleFavorite?: (photoId: string) => void
}

export default function VirtualGallery({
  photos,
  columns = 3,
  onPhotoClick,
  onToggleFavorite,
}: VirtualGalleryProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Calculate items per row
  const itemsPerRow = columns

  // Create rows from photos
  const rows = []
  for (let i = 0; i < photos.length; i += itemsPerRow) {
    rows.push(photos.slice(i, i + itemsPerRow))
  }

  // Virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimated row height
    overscan: 2, // Number of rows to render outside visible area
  })

  const handleToggleFavorite = (e: React.MouseEvent, photoId: string) => {
    e.stopPropagation()

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }

    onToggleFavorite?.(photoId)
  }

  const handleDownload = async (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation()

    try {
      const response = await fetch(photo.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.title || `photo-${photo.id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Download iniciado! 📥')
    } catch (error) {
      toast.error('Erro ao fazer download')
    }
  }

  const handleShare = async (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation()

    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.title || 'Foto especial',
          text: photo.description || 'Confira esta foto!',
          url: photo.url,
        })
        toast.success('Compartilhado! 🎉')
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(photo.url)
      toast.success('Link copiado! 📋')
    }
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-200px)] overflow-auto"
      style={{
        scrollbarWidth: 'thin',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-2"
            >
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {row.map((photo, colIndex) => {
                  const photoIndex = virtualRow.index * itemsPerRow + colIndex

                  return (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: colIndex * 0.05 }}
                      onMouseEnter={() => setHoveredIndex(photoIndex)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => onPhotoClick?.(photo, photoIndex)}
                      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                    >
                      {/* Image */}
                      <OptimizedImage
                        src={photo.url}
                        alt={photo.title || 'Photo'}
                        width={400}
                        height={400}
                        className="w-full h-full"
                      />

                      {/* Overlay on Hover */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
                          hoveredIndex === photoIndex
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {/* Action Buttons */}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleToggleFavorite(e, photo.id)}
                            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
                              photo.is_favorite
                                ? 'bg-red-500 text-white'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            <Heart
                              size={20}
                              fill={photo.is_favorite ? 'white' : 'none'}
                            />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleShare(e, photo)}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
                          >
                            <Share2 size={18} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleDownload(e, photo)}
                            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
                          >
                            <Download size={18} />
                          </motion.button>
                        </div>

                        {/* Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          {photo.title && (
                            <h4 className="text-white font-semibold text-lg mb-1">
                              {photo.title}
                            </h4>
                          )}
                          {photo.description && (
                            <p className="text-white/80 text-sm line-clamp-2">
                              {photo.description}
                            </p>
                          )}
                          <p className="text-white/60 text-xs mt-2">
                            {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Favorite Badge */}
                      {photo.is_favorite && (
                        <div className="absolute top-4 left-4">
                          <div className="bg-red-500 text-white p-2 rounded-full">
                            <Heart size={16} fill="white" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-6xl mb-4"
          >
            📸
          </motion.div>
          <h3 className="text-2xl font-bold text-textPrimary mb-2">
            Nenhuma foto ainda
          </h3>
          <p className="text-textSecondary">
            Adicione suas primeiras memórias especiais
          </p>
        </div>
      )}
    </div>
  )
}

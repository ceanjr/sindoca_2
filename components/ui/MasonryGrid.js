'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Heart, Maximize2 } from 'lucide-react'

/**
 * Componente Masonry Grid (estilo Pinterest)
 * Organiza as imagens em um layout de colunas dinâmico
 */
export default function MasonryGrid({ photos, onPhotoClick, onToggleFavorite }) {
  const [columns, setColumns] = useState(3)
  const [columnedPhotos, setColumnedPhotos] = useState([])

  // Ajusta número de colunas baseado na largura da tela
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width < 640) setColumns(2)
      else if (width < 768) setColumns(3)
      else if (width < 1024) setColumns(4)
      else if (width < 1280) setColumns(5)
      else setColumns(6)
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  // Distribui fotos nas colunas
  useEffect(() => {
    const distributed = Array.from({ length: columns }, () => [])

    photos.forEach((photo, index) => {
      const columnIndex = index % columns
      distributed[columnIndex].push(photo)
    })

    setColumnedPhotos(distributed)
  }, [photos, columns])

  return (
    <div className="flex gap-4">
      {columnedPhotos.map((columnPhotos, columnIndex) => (
        <div key={columnIndex} className="flex-1 flex flex-col gap-4">
          {columnPhotos.map((photo, photoIndex) => (
            <MasonryItem
              key={photo.id}
              photo={photo}
              onPhotoClick={onPhotoClick}
              onToggleFavorite={onToggleFavorite}
              delay={(columnIndex * columnPhotos.length + photoIndex) * 0.03}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Item individual do Masonry
 */
function MasonryItem({ photo, onPhotoClick, onToggleFavorite, delay }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const imgRef = useRef(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: imageLoaded ? 1 : 0.3, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative rounded-2xl overflow-hidden bg-surfaceAlt shadow-soft-sm hover:shadow-soft-md transition-all duration-300">
        {/* Skeleton loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}

        {/* Image */}
        <img
          ref={imgRef}
          src={photo.url}
          alt={photo.caption || `Foto ${photo.id}`}
          className="w-full h-auto transition-transform duration-500 hover:scale-105"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Hover Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        >
          {/* Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            {/* Favorite Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(photo.id)
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                photo.favorite
                  ? 'bg-primary text-white'
                  : 'bg-white/30 text-white hover:bg-white/50'
              }`}
            >
              <Heart
                size={18}
                fill={photo.favorite ? 'currentColor' : 'none'}
              />
            </motion.button>

            {/* View Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onPhotoClick(photo)}
              className="p-2 rounded-full bg-white/30 text-white hover:bg-white/50 backdrop-blur-md transition-colors"
            >
              <Maximize2 size={18} />
            </motion.button>
          </div>

          {/* Caption & Date */}
          {(photo.caption || photo.date) && (
            <div className="absolute bottom-3 left-3 right-3">
              {photo.caption && (
                <p className="text-white font-semibold text-sm mb-1 line-clamp-2">
                  {photo.caption}
                </p>
              )}
              {photo.date && (
                <p className="text-white/80 text-xs">
                  {new Date(photo.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

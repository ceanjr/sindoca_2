'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Maximize2, Trash2, CheckCircle, ImageIcon } from 'lucide-react';

/**
 * Componente Masonry Grid (estilo Pinterest)
 * Organiza as imagens em um layout de colunas dinâmico
 */
export default function MasonryGrid({
  photos,
  columns = 3,
  onPhotoClick,
  onToggleFavorite,
  onDeletePhoto,
  isDeleteMode = false,
  selectedPhotos = [],
  onToggleSelection,
}) {
  const [photoHeights, setPhotoHeights] = useState({});

  // Gera alturas aleatórias consistentes para cada foto
  useEffect(() => {
    const heights = {};
    photos.forEach((photo) => {
      if (!photoHeights[photo.id]) {
        heights[photo.id] = 250 + Math.random() * 200; // 250-450px
      } else {
        heights[photo.id] = photoHeights[photo.id];
      }
    });
    setPhotoHeights(heights);
  }, [photos]);

  // Distribui fotos nas colunas usando algoritmo masonry (MEMOIZADO)
  const columnedPhotos = useMemo(() => {
    if (Object.keys(photoHeights).length === 0) return [];

    const cols = Array.from({ length: columns }, () => []);
    const colHeights = Array(columns).fill(0);

    photos.forEach((photo) => {
      const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));
      cols[shortestColIndex].push(photo);
      colHeights[shortestColIndex] += photoHeights[photo.id] || 300;
    });

    return cols;
  }, [photos, columns, photoHeights]);

  return (
    <div className="flex gap-2 md:gap-4">
      {columnedPhotos.map((columnPhotos, columnIndex) => (
        <div key={columnIndex} className="flex-1 flex flex-col gap-4">
          {columnPhotos.map((photo, photoIndex) => (
            <MasonryItem
              key={photo.id}
              photo={photo}
              height={photoHeights[photo.id]}
              onPhotoClick={onPhotoClick}
              onToggleFavorite={onToggleFavorite}
              onDeletePhoto={onDeletePhoto}
              isDeleteMode={isDeleteMode}
              isSelected={selectedPhotos.includes(photo.id)}
              onToggleSelection={onToggleSelection}
              delay={photoIndex * 0.05}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Item individual do Masonry com suporte mobile completo
 * - Mobile: tap rápido = expandir, long press = menu excluir
 * - Desktop: hover = botões
 */
function MasonryItem({
  photo,
  height,
  onPhotoClick,
  onToggleFavorite,
  onDeletePhoto,
  isDeleteMode,
  isSelected,
  onToggleSelection,
  delay,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef(null);
  const touchStartTime = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchHandled = useRef(false);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch handlers - distinguish between tap and scroll
  const handleTouchStart = (e) => {
    if (!isMobile) return;

    touchStartTime.current = Date.now();
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    hasMoved.current = false;
    touchHandled.current = false;
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) return;

    const touchDuration = Date.now() - (touchStartTime.current || 0);

    // In delete mode, toggle selection
    if (isDeleteMode && touchDuration < 600 && !hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
      touchHandled.current = true;
      onToggleSelection(photo.id);

      // Reset touchHandled after a delay to allow click event to be prevented
      setTimeout(() => {
        touchHandled.current = false;
      }, 100);
      return;
    }

    // Only open photo if:
    // 1. Quick tap (< 600ms)
    // 2. Didn't move (not scrolling)
    // 3. Not in delete mode
    if (touchDuration < 600 && !hasMoved.current && !isDeleteMode) {
      e.preventDefault();
      e.stopPropagation();
      touchHandled.current = true;
      onPhotoClick(photo);

      // Reset touchHandled after a delay
      setTimeout(() => {
        touchHandled.current = false;
      }, 100);
    }
  };

  const handleTouchMove = (e) => {
    // Detect if user is scrolling
    if (touchStartPos.current.x && touchStartPos.current.y) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);

      // If moved more than 10px, consider it a scroll
      if (deltaX > 10 || deltaY > 10) {
        hasMoved.current = true;
      }
    }
  };

  // Handle click/tap in delete mode
  const handlePhotoInteraction = (e) => {
    // Prevent click if touch was already handled (mobile)
    if (touchHandled.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (isDeleteMode) {
      onToggleSelection(photo.id);
    } else if (!isMobile) {
      onPhotoClick(photo);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: imageLoaded ? 1 : 0.3, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="relative group cursor-pointer"
        onMouseEnter={() => !isMobile && !isDeleteMode && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        onClick={handlePhotoInteraction}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <div
          className={`relative rounded-2xl overflow-hidden bg-surfaceAlt shadow-soft-sm hover:shadow-soft-md transition-all duration-300 ${
            isSelected ? 'ring-4 ring-primary' : ''
          }`}
          style={{ height: height ? `${height}px` : 'auto' }}
        >
          {/* Skeleton loader */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 skeleton animate-pulse bg-gradient-to-r from-surfaceAlt via-surface to-surfaceAlt" />
          )}

          {/* Error state */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center p-4">
                <ImageIcon className="mx-auto mb-2 text-red-400" size={32} />
                <p className="text-xs text-red-600">Erro ao carregar</p>
                <p className="text-xs text-red-400 mt-1 break-all">
                  {photo.url?.substring(0, 50)}...
                </p>
              </div>
            </div>
          )}

          {/* Image */}
          <img
            ref={imgRef}
            src={photo.url}
            alt={photo.caption || `Foto ${photo.id}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onLoad={() => {
              console.log(`✅ Image loaded: ${photo.id}`, photo.url);
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={(e) => {
              console.error(`❌ Image error: ${photo.id}`, {
                url: photo.url,
                photo: photo,
                error: e
              });
              setImageError(true);
              setImageLoaded(false);
            }}
          />

          {/* Hover Overlay or Selection Indicator - Desktop only */}
          {!isMobile && (
            <>
              {isDeleteMode && (
                <div
                  className={`absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-white/80 border-2 border-gray-300'
                  }`}
                >
                  {isSelected && <CheckCircle size={28} fill="currentColor" />}
                </div>
              )}

              {!isDeleteMode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                >
                  <div className="absolute top-3 right-3 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(photo.id);
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

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPhotoClick(photo);
                      }}
                      className="p-2 rounded-full bg-white/30 text-white hover:bg-white/50 backdrop-blur-md transition-colors"
                    >
                      <Maximize2 size={18} />
                    </motion.button>
                  </div>

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
              )}
            </>
          )}

          {/* Selection Indicator or Favorite Button - Mobile */}
          {isMobile && (
            <>
              {isDeleteMode ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-white/80 border-2 border-gray-300'
                  }`}
                >
                  {isSelected && <CheckCircle size={24} fill="currentColor" />}
                </motion.div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(photo.id);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onToggleFavorite(photo.id);
                  }}
                  className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md shadow-lg transition-colors ${
                    photo.favorite
                      ? 'bg-primary text-white'
                      : 'bg-white/80 text-gray-700'
                  }`}
                >
                  <Heart
                    size={20}
                    fill={photo.favorite ? 'currentColor' : 'none'}
                  />
                </motion.button>
              )}
            </>
          )}

          {/* Favorite Badge - desktop only */}
          {!isMobile && photo.favorite && !isHovered && !isDeleteMode && (
            <div className="absolute top-3 left-3">
              <div className="bg-primary text-white p-2 rounded-full shadow-lg">
                <Heart size={16} fill="currentColor" />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

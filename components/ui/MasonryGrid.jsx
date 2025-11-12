'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Maximize2, Trash2, CheckCircle, ImageIcon } from 'lucide-react';
import ReactableContent from './ReactableContent';
import ReactionDisplay from './ReactionDisplay';

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
const MasonryItem = React.memo(function MasonryItem({
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
    
    // Don't stopPropagation - let ReactableContent also receive this event
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) return;

    const touchDuration = Date.now() - (touchStartTime.current || 0);
    console.log('[MasonryItem] Touch end - duration:', touchDuration, 'ms');

    // If it was a long press (>=500ms), don't handle it here
    // Let ReactableContent handle reactions
    if (touchDuration >= 500) {
      console.log('[MasonryItem] Long press detected - letting ReactableContent handle');
      return; // Let reaction menu handle this
    }

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
    // 1. Quick tap (< 600ms but < 500ms to avoid conflict with reactions)
    // 2. Didn't move (not scrolling)
    // 3. Not in delete mode
    if (touchDuration < 500 && !hasMoved.current && !isDeleteMode) {
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

  // Handle click/tap
  const handlePhotoInteraction = (e) => {
    // In delete mode, toggle selection
    if (isDeleteMode) {
      onToggleSelection(photo.id);
      return;
    }

    // Open photo on click (both desktop and mobile)
    // ReactableContent will prevent this if menu was opened via long press
    onPhotoClick(photo);
  };

  return (
    <>
      <ReactableContent
        contentId={photo.id}
        contentType="photo"
        contentTitle={photo.caption}
        authorId={photo.author_id}
        url="/galeria"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: imageLoaded ? 1 : 0.3, y: 0 }}
          transition={{ duration: 0.4, delay }}
          className="relative group cursor-pointer"
          onMouseEnter={() => !isMobile && !isDeleteMode && setIsHovered(true)}
          onMouseLeave={() => !isMobile && setIsHovered(false)}
          onClick={handlePhotoInteraction}
          {...(isDeleteMode ? {
            // Use MasonryItem touch handlers ONLY in delete mode
            // Otherwise, let ReactableContent handle long press for reactions
            onTouchStart: handleTouchStart,
            onTouchEnd: handleTouchEnd,
            onTouchMove: handleTouchMove,
          } : {})}
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
            width="300"
            height={height}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{
              backgroundColor: '#f3f4f6',
              minHeight: height,
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => {
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
            onContextMenu={(e) => {
              // Prevent context menu on long press
              e.preventDefault();
            }}
          />

          {/* Favorite indicators (always visible) - Desktop */}
          {!isMobile && !isDeleteMode && photo.isFavoritedByAnyone && (
            <div className="absolute top-3 left-3 flex gap-1.5 z-10">
              {/* Avatars of who favorited */}
              {photo.favoritedBy?.map((user) => (
                <div
                  key={user.userId}
                  className="w-8 h-8 rounded-full shadow-lg overflow-hidden bg-white border-2 border-white"
                  title={user.name}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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
                <>
                  {/* Favorite button */}
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
                  {/* Avatars of who favorited - Mobile */}
                  {photo.isFavoritedByAnyone && (
                    <div className="absolute top-3 left-3 flex gap-1 z-10">
                      {photo.favoritedBy?.map((user) => (
                        <div
                          key={user.userId}
                          className="w-7 h-7 rounded-full shadow-lg overflow-hidden bg-white border-2 border-white"
                          title={user.name}
                        >
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        
        {/* Reaction Display - Show below image if not in delete mode */}
        {!isDeleteMode && (
          <div className="mt-2 px-1">
            <ReactionDisplay contentId={photo.id} />
          </div>
        )}
        </motion.div>
      </ReactableContent>
    </>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.photo.url === nextProps.photo.url &&
    prevProps.photo.favorite === nextProps.photo.favorite &&
    prevProps.photo.favoritedBy?.length === nextProps.photo.favoritedBy?.length &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDeleteMode === nextProps.isDeleteMode &&
    prevProps.height === nextProps.height
  );
});

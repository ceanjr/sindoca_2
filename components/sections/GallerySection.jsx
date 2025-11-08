'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Image as ImageIcon,
  Heart,
  Calendar,
  Plus,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import Lightbox from '../Lightbox';
import MasonryGrid from '../ui/MasonryGrid';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useSupabasePhotos } from '@/hooks';

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Favoritas', value: 'favorites', icon: Heart },
];

export default function GallerySection({ id }) {
  // Use Supabase hook with realtime sync
  const {
    photos,
    loading: isLoadingPhotos,
    toggleFavorite,
    uploadPhotos,
    removePhoto,
    updatePhotoCaption,
    refresh,
  } = useSupabasePhotos();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [loadError, setLoadError] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const fileInputRef = useRef(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  // Estado para controlar o número de colunas responsivamente
  const [columns, setColumns] = useState(3);

  // Estado de paginação
  const PHOTOS_PER_PAGE = 20;
  const [displayedCount, setDisplayedCount] = useState(PHOTOS_PER_PAGE);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth < 640) {
        setColumns(2); // Mobile: 2 colunas
      } else if (window.innerWidth < 1024) {
        setColumns(3); // Tablet: 3 colunas
      } else {
        setColumns(4); // Desktop: 4 colunas
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Filtra as fotos baseado no filtro ativo
  const allFilteredPhotos = useMemo(() => {
    if (activeFilter === 'all') return photos;
    if (activeFilter === 'favorites') return photos.filter((p) => p.favorite);
    return photos.filter((p) => p.category === activeFilter);
  }, [photos, activeFilter]);

  // Aplica paginação
  const filteredPhotos = useMemo(() => {
    return allFilteredPhotos.slice(0, displayedCount);
  }, [allFilteredPhotos, displayedCount]);

  // Verifica se há mais fotos para carregar
  const hasMore = allFilteredPhotos.length > displayedCount;

  // Função para carregar mais fotos
  const loadMore = () => {
    setDisplayedCount((prev) => prev + PHOTOS_PER_PAGE);
  };

  // Reseta paginação quando filtro muda
  useEffect(() => {
    setDisplayedCount(PHOTOS_PER_PAGE);
  }, [activeFilter]);

  // Deletar foto
  const handleDeletePhoto = async (photoId) => {
    try {
      await removePhoto(photoId);

      // Fechar lightbox se a foto deletada estava aberta
      if (currentPhoto?.id === photoId) {
        setLightboxOpen(false);
        setCurrentPhoto(null);
      }
    } catch (error) {
      // console.error('❌ Erro ao deletar foto:', error);
      setUploadError('Erro ao remover foto. Tente novamente.');
    }
  };

  // Abrir lightbox
  const openLightbox = (photo) => {
    setCurrentPhoto(photo);
    setLightboxOpen(true);
  };

  const handleAddPhotoClick = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  // Ativar modo de deleção
  const handleEnterDeleteMode = () => {
    setIsDeleteMode(true);
    setSelectedPhotos([]);
  };

  // Cancelar modo de deleção
  const handleCancelDeleteMode = () => {
    setIsDeleteMode(false);
    setSelectedPhotos([]);
  };

  // Toggle seleção de foto
  const handleTogglePhotoSelection = (photoId) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  // Deletar fotos selecionadas
  const handleDeleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return;

    for (const photoId of selectedPhotos) {
      try {
        await removePhoto(photoId);
        // console.log(`✅ Foto ${photoId} deletada`);
      } catch (error) {
        // console.error(`❌ Erro ao deletar ${photoId}:`, error);
      }
    }

    // Sai do modo delete
    setIsDeleteMode(false);
    setSelectedPhotos([]);
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const invalidFiles = files.filter(
      (file) => !file.type || !file.type.startsWith('image/')
    );
    if (invalidFiles.length > 0) {
      setUploadError(
        `${
          invalidFiles.length
        } arquivo(s) não são imagens válidas. Tipo detectado: ${
          invalidFiles[0]?.type || 'desconhecido'
        }`
      );
      if (event.target) event.target.value = '';
      return;
    }

    // Validate file size
    const largeFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
    if (largeFiles.length > 0) {
      setUploadError(
        `${largeFiles.length} imagem(ns) muito grande(s) (máx 10MB cada).`
      );
      if (event.target) event.target.value = '';
      return;
    }

    // console.log(`📤 Starting upload of ${files.length} files`);
    files.forEach((f, i) =>
      console.log(
        `  ${i + 1}. ${f.name} (${f.type}, ${(f.size / 1024 / 1024).toFixed(
          2
        )}MB)`
      )
    );

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      const result = await uploadPhotos(files);

      if (!result) {
        throw new Error(
          'Upload retornou undefined. Verifique se está autenticado e o workspace existe.'
        );
      }

      const { results, errors } = result;

      setUploadProgress({ current: results?.length || 0, total: files.length });

      if (results && results.length > 0) {
        // console.log(`🎉 ${results.length} foto(s) adicionada(s) à galeria!`);
      }

      if (errors && errors.length > 0) {
        const errorMsg = errors[0]?.error || errors[0];
        setUploadError(`Erro ao enviar ${errors.length} foto(s): ${errorMsg}`);
        // console.error('Errors:', errors);
      }
    } catch (error) {
      // console.error('❌ Erro no upload:', error);
      const errorMessage =
        error.message || 'Erro ao enviar fotos. Tente novamente.';
      setUploadError(errorMessage);
    }

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    if (event.target) event.target.value = '';
  };

  return (
    <>
      <section id={id} className="min-h-screen px-2 md:px-4 py-20" ref={ref}>
        <div className="max-w-7xl mx-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-12 px-2"
          >
            {/* Title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={inView ? { scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-block mb-4"
              >
                <ImageIcon className="text-primary" size={48} />
              </motion.div>
              <h2 className="font-heading text-3xl md:text-6xl font-bold text-textPrimary mb-4">
                Galeria de <span className="text-primary">Momentos</span>
              </h2>
              <p className="text-md text-textSecondary max-w-2xl mx-auto">
                Fotinhas para registrar nossa passagem por esses tempos
                líquidos.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="primary">{photos.length} fotos</Badge>
              <Badge variant="accent">
                <Heart size={14} className="inline mr-1" />
                {photos.filter((p) => p.favorite).length} favoritas
              </Badge>
              <Badge variant="lavender">
                <Calendar size={14} className="inline mr-1" />
                Desde Mar 2025
              </Badge>
            </div>

            {/* Filters & Actions */}
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <motion.button
                      key={filter.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveFilter(filter.value)}
                      disabled={isDeleteMode}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                        activeFilter === filter.value
                          ? 'bg-primary text-white shadow-soft-md'
                          : 'bg-surface text-textSecondary hover:bg-surfaceAlt'
                      } ${isDeleteMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {Icon && <Icon size={16} />}
                      {filter.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Action Menu */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddPhotoClick}
                  disabled={isUploading || isDeleteMode}
                >
                  {isUploading
                    ? `Enviando ${uploadProgress.current}/${uploadProgress.total}...`
                    : 'Adicionar'}
                </Button>

                {!isDeleteMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Trash2}
                    onClick={handleEnterDeleteMode}
                    disabled={isUploading || photos.length === 0}
                  >
                    Apagar
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-textSecondary">
                      {selectedPhotos.length} selecionada(s)
                    </span>
                  </div>
                )}
              </div>
            </div>
            {isUploading && uploadProgress.total > 1 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-textSecondary mb-2">
                  <span>Enviando fotos...</span>
                  <span>
                    {uploadProgress.current} de {uploadProgress.total}
                  </span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        (uploadProgress.current / uploadProgress.total) * 100
                      }%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
            {uploadError && (
              <p className="text-sm text-red-500 mt-2">{uploadError}</p>
            )}
          </motion.div>

          {/* Masonry Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isLoadingPhotos ? (
              <div className="text-center py-20">
                <p className="text-textSecondary text-lg">
                  Carregando memórias...
                </p>
              </div>
            ) : filteredPhotos.length > 0 ? (
              <>
                <MasonryGrid
                  photos={filteredPhotos}
                  columns={columns}
                  onPhotoClick={openLightbox}
                  onToggleFavorite={toggleFavorite}
                  onDeletePhoto={handleDeletePhoto}
                  isDeleteMode={isDeleteMode}
                  selectedPhotos={selectedPhotos}
                  onToggleSelection={handleTogglePhotoSelection}
                />

                {/* Load More Button */}
                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-12"
                  >
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      className="px-8 py-3"
                    >
                      Carregar mais fotos (
                      {allFilteredPhotos.length - displayedCount} restantes)
                    </Button>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <ImageIcon
                  className="mx-auto text-textTertiary mb-4"
                  size={64}
                />
                <p className="text-textSecondary text-lg">
                  Nenhuma foto encontrada com este filtro
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Delete Mode Action Bar - Fixed above bottom navigation */}
      <AnimatePresence>
        {isDeleteMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 right-0 z-[100] bg-white shadow-2xl border-t border-gray-200"
            style={{ bottom: window.innerWidth < 1024 ? '80px' : '0' }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="md"
                icon={X}
                onClick={handleCancelDeleteMode}
                className="flex-1 md:flex-initial"
              >
                Cancelar
              </Button>

              <Button
                variant="danger"
                size="md"
                icon={Trash2}
                onClick={handleDeleteSelectedPhotos}
                disabled={selectedPhotos.length === 0}
                className="flex-1 md:flex-initial"
              >
                Apagar{' '}
                {selectedPhotos.length > 0 ? `(${selectedPhotos.length})` : ''}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      {currentPhoto && (
        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={filteredPhotos.map((p) => p.url)}
          photos={filteredPhotos}
          currentIndex={filteredPhotos.findIndex(
            (p) => p.id === currentPhoto.id
          )}
          onNavigate={(direction) => {
            const currentIndex = filteredPhotos.findIndex(
              (p) => p.id === currentPhoto.id
            );
            const newIndex = currentIndex + direction;
            if (newIndex >= 0 && newIndex < filteredPhotos.length) {
              setCurrentPhoto(filteredPhotos[newIndex]);
            } else if (newIndex < 0) {
              setCurrentPhoto(filteredPhotos[filteredPhotos.length - 1]);
            } else {
              setCurrentPhoto(filteredPhotos[0]);
            }
          }}
          onUpdateCaption={updatePhotoCaption}
        />
      )}
    </>
  );
}

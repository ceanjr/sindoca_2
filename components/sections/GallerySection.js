'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Image as ImageIcon, Heart, Calendar, Plus } from 'lucide-react';
import Lightbox from '../Lightbox';
import MasonryGrid from '../ui/MasonryGrid';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  listAll,
  getMetadata,
} from 'firebase/storage';
import { storage } from '../../lib/firebase';

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Favoritas', value: 'favorites', icon: Heart },
  { label: 'Encontros', value: 'encontros' },
  { label: 'Viagens', value: 'viagens' },
  { label: 'Momentos', value: 'momentos' },
];

export default function GallerySection({ id }) {
  const [photos, setPhotos] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const fileInputRef = useRef(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    let isSubscribed = true;

    const fetchPhotos = async () => {
      // Sempre mostrar fotos iniciais primeiro

      if (!storage) {
        console.warn('Firebase Storage não configurado');
        setIsLoadingPhotos(false);
        return;
      }

      try {
        const galleryRootRef = storageRef(storage, 'gallery');

        // Timeout de 10 segundos
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );

        const result = await Promise.race([
          listAll(galleryRootRef),
          timeoutPromise,
        ]);

        if (!isSubscribed) return;

        if (result.items.length === 0) {
          console.log(
            '📷 Nenhuma foto no Firebase Storage - usando fotos de exemplo'
          );
          setIsLoadingPhotos(false);
          return;
        }

        console.log(
          `📷 ${result.items.length} fotos encontradas no Firebase Storage`
        );

        const remotePhotos = await Promise.all(
          result.items.map(async (item) => {
            try {
              const [downloadUrl, metadata] = await Promise.all([
                getDownloadURL(item),
                getMetadata(item).catch(() => null),
              ]);

              const createdAt = metadata?.timeCreated
                ? new Date(metadata.timeCreated)
                : null;
              const formattedDate = createdAt
                ? createdAt.toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10);

              return {
                id: item.fullPath,
                storagePath: item.fullPath,
                url: downloadUrl,
                caption:
                  metadata?.customMetadata?.caption ??
                  item.name.replace(/\.[^/.]+$/, ''),
                date: formattedDate,
                favorite: false,
                category: metadata?.customMetadata?.category ?? 'momentos',
              };
            } catch (err) {
              console.warn(`Erro ao carregar foto ${item.name}:`, err);
              return null;
            }
          })
        );

        const validPhotos = remotePhotos.filter((p) => p !== null);
        validPhotos.sort((a, b) => b.date.localeCompare(a.date));

        if (isSubscribed && validPhotos.length > 0) {
          setPhotos(validPhotos);
          console.log('✅ Galeria carregada do Firebase Storage!');
        }
      } catch (error) {
        console.warn('⚠️ Firebase Storage indisponível:', error.message);
        // Continuar com fotos de exemplo
      } finally {
        if (isSubscribed) {
          setIsLoadingPhotos(false);
        }
      }
    };

    fetchPhotos();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Filtra as fotos baseado no filtro ativo
  const filteredPhotos = useMemo(() => {
    if (activeFilter === 'all') return photos;
    if (activeFilter === 'favorites') return photos.filter((p) => p.favorite);
    return photos.filter((p) => p.category === activeFilter);
  }, [photos, activeFilter]);

  // Toggle favorito
  const toggleFavorite = (photoId) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, favorite: !photo.favorite } : photo
      )
    );
  };

  // Abrir lightbox
  const openLightbox = (photo) => {
    setCurrentPhoto(photo);
    setLightboxOpen(true);
  };

  const handleAddPhotoClick = () => {
    if (!storage) {
      setUploadError('Firebase Storage não configurado.');
      return;
    }
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (!storage) {
      setUploadError('Firebase Storage não configurado.');
      if (event.target) event.target.value = '';
      return;
    }

    // Validar todos os arquivos
    const invalidFiles = files.filter(
      (file) => !file.type.startsWith('image/')
    );
    if (invalidFiles.length > 0) {
      setUploadError(
        `${invalidFiles.length} arquivo(s) não são imagens válidas.`
      );
      if (event.target) event.target.value = '';
      return;
    }

    const largeFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (largeFiles.length > 0) {
      setUploadError(
        `${largeFiles.length} imagem(ns) muito grande(s) (máx 5MB cada).`
      );
      if (event.target) event.target.value = '';
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    const uploadedPhotos = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        console.log(`📤 Upload ${i + 1}/${files.length}:`, file.name);
        setUploadProgress({ current: i + 1, total: files.length });

        const uniqueId = `${Date.now()}-${i}-${file.name.replace(
          /[^a-zA-Z0-9.-]/g,
          '_'
        )}`;
        const storagePath = `gallery/${uniqueId}`;
        const fileRef = storageRef(storage, storagePath);

        await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(fileRef);

        const newPhoto = {
          id: storagePath,
          storagePath,
          url: downloadUrl,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          date: new Date().toISOString().slice(0, 10),
          favorite: false,
          category: 'momentos',
        };

        uploadedPhotos.push(newPhoto);
        console.log(`✅ Upload ${i + 1}/${files.length} concluído!`);
      } catch (error) {
        console.error(`❌ Erro no upload de ${file.name}:`, error);
        errors.push(file.name);
      }
    }

    // Adicionar todas as fotos de uma vez
    if (uploadedPhotos.length > 0) {
      setPhotos((prev) => [...uploadedPhotos, ...prev]);
      console.log(
        `🎉 ${uploadedPhotos.length} foto(s) adicionada(s) à galeria!`
      );
    }

    // Mostrar erros se houver
    if (errors.length > 0) {
      setUploadError(
        `Erro ao enviar ${errors.length} foto(s): ${errors
          .slice(0, 3)
          .join(', ')}${errors.length > 3 ? '...' : ''}`
      );
    }

    setIsUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    if (event.target) event.target.value = '';
  };

  return (
    <>
      <section id={id} className="min-h-screen px-4 py-20" ref={ref}>
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
            className="mb-12"
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
              <h2 className="font-heading text-4xl md:text-6xl font-bold text-textPrimary mb-4">
                Galeria de <span className="text-primary">Momentos</span>
              </h2>
              <p className="text-lg text-textSecondary max-w-2xl mx-auto">
                Cada foto conta uma história especial da nossa jornada juntos
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
            <div className="flex flex-wrap items-center justify-between gap-4">
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
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                        activeFilter === filter.value
                          ? 'bg-primary text-white shadow-soft-md'
                          : 'bg-surface text-textSecondary hover:bg-surfaceAlt'
                      }`}
                    >
                      {Icon && <Icon size={16} />}
                      {filter.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Add Button */}
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddPhotoClick}
                disabled={isUploading}
              >
                {isUploading
                  ? `Enviando ${uploadProgress.current}/${uploadProgress.total}...`
                  : 'Adicionar Fotos'}
              </Button>
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
              <MasonryGrid
                photos={filteredPhotos}
                onPhotoClick={openLightbox}
                onToggleFavorite={toggleFavorite}
              />
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

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="inline-block bg-surface rounded-2xl p-6 shadow-soft-md">
              <p className="text-textSecondary">
                Clique em qualquer foto para visualizar em tela cheia
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      {currentPhoto && (
        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={filteredPhotos.map((p) => p.url)}
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
        />
      )}

      {/* Add Photo Modal (simulado) */}
      {/* Modal removido: upload acontece imediatamente após selecionar a foto */}
    </>
  );
}

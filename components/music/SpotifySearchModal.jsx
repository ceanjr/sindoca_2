/**
 * Spotify Search Modal
 * Search and add songs from Spotify
 */
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Play, Pause, Plus, Loader, Music, Check, TrendingUp } from 'lucide-react';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function SpotifySearchModal({ isOpen, onClose, onAddTrack, existingTracks = [] }) {
  const { query, setQuery, results, isSearching, error } = useSpotifySearch();
  const [playingPreview, setPlayingPreview] = useState(null);
  const [addingTrack, setAddingTrack] = useState(null);
  const audioRef = useRef(null);

  // Cleanup de áudio ao fechar o modal
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingPreview(null);
    }
  }, [isOpen]);

  // Criar Set de IDs de músicas já adicionadas para busca rápida
  const existingTrackIds = useMemo(() => {
    return new Set(existingTracks.map(track => track.data?.spotify_track_id).filter(Boolean));
  }, [existingTracks]);

  // Extrair artistas únicos da playlist para sugestões
  const playlistArtists = useMemo(() => {
    const artists = existingTracks
      .map(track => track.description) // description contém o artista
      .filter(Boolean);
    return [...new Set(artists)].slice(0, 5); // Top 5 artistas únicos
  }, [existingTracks]);

  const handlePlayPreview = (track) => {
    if (!track.preview_url) return;

    if (playingPreview === track.id) {
      audioRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = track.preview_url;
        audioRef.current.play();
      }
      setPlayingPreview(track.id);
    }
  };

  const handleAddTrack = async (track) => {
    setAddingTrack(track.id);
    try {
      await onAddTrack(track);
      // Close modal after successful add
      setTimeout(() => {
        handleClose();
      }, 500); // Small delay to show success feedback
    } catch (error) {
      console.error('Failed to add track:', error);
    } finally {
      // Always reset adding state after operation completes
      setTimeout(() => {
        setAddingTrack(null);
      }, 500);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingPreview(null);
    setQuery(''); // Limpar busca ao fechar
    onClose();
  };

  // Função auxiliar para verificar se música já foi adicionada
  const isTrackAdded = (trackId) => {
    return existingTrackIds.has(trackId);
  };

  // Handler para buscar artista (sugestões)
  const handleSearchArtist = (artistName) => {
    setQuery(artistName);
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => setPlayingPreview(null)}
        onError={() => setPlayingPreview(null)}
      />

      <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Música">
        <div className="space-y-4">
          {/* Campo de busca - Sticky no topo */}
          <div className="sticky top-0 bg-surface z-10 pb-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-textTertiary pointer-events-none"
                size={20}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar música, artista ou álbum..."
                className="w-full pl-10 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-textPrimary placeholder-textTertiary transition-all"
                inputMode="search"
                enterKeyHint="search"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textTertiary hover:text-textPrimary transition-colors"
                  aria-label="Limpar busca"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-primary" size={32} />
            </div>
          )}

          {/* Lista de resultados - SEM scroll interno, usa scroll do Modal */}
          {!isSearching && results.length > 0 && (
            <div className="space-y-2">
              {results.map((track, index) => {
                const isAdded = isTrackAdded(track.id);
                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      addingTrack === track.id
                        ? 'bg-green-50 border-2 border-green-300'
                        : isAdded
                        ? 'bg-gray-50 border-2 border-gray-300 opacity-75'
                        : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                  {/* Album Cover */}
                  <div className="flex-shrink-0 w-14 h-14 bg-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {track.albumCover ? (
                      <img
                        src={track.albumCover}
                        alt={track.album}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-textPrimary truncate text-sm">
                      {track.name}
                    </h4>
                    <p className="text-xs text-textSecondary truncate mt-0.5">
                      {track.artist} • {formatDuration(track.duration_ms)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {track.preview_url && (
                      <button
                        onClick={() => handlePlayPreview(track)}
                        className={`p-2.5 rounded-full transition-all ${
                          playingPreview === track.id
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-100 hover:bg-gray-200 text-textSecondary'
                        }`}
                        title="Preview 30s"
                        aria-label={playingPreview === track.id ? 'Pausar preview' : 'Tocar preview'}
                      >
                        {playingPreview === track.id ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                      </button>
                    )}

                    {isAdded ? (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-green-100 text-green-700">
                        <Check size={16} />
                        <span className="text-xs font-medium">Adicionada</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddTrack(track)}
                        disabled={addingTrack === track.id}
                        className="p-2.5 rounded-full bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
                        title="Adicionar à playlist"
                        aria-label="Adicionar música à playlist"
                      >
                        {addingTrack === track.id ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <Plus size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
              })}
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="text-center py-12">
              <Music className="mx-auto mb-3 text-textTertiary" size={48} />
              <p className="text-textSecondary">
                Nenhuma música encontrada para "{query}"
              </p>
            </div>
          )}

          {/* Sugestões baseadas na playlist */}
          {!query && !isSearching && playlistArtists.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-textSecondary">
                <TrendingUp size={20} />
                <h4 className="font-semibold">Sugestões baseadas na sua playlist</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {playlistArtists.map((artist, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSearchArtist(artist)}
                    className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 text-textPrimary rounded-full border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-md active:scale-95"
                  >
                    <span className="text-sm font-medium">{artist}</span>
                  </motion.button>
                ))}
              </div>
              <div className="text-center pt-8">
                <Search className="mx-auto mb-3 text-textTertiary" size={48} />
                <p className="text-textSecondary text-sm">
                  Toque em um artista acima ou busque por músicas, artistas ou álbuns
                </p>
              </div>
            </div>
          )}

          {/* Estado vazio (sem playlist) */}
          {!query && !isSearching && playlistArtists.length === 0 && (
            <div className="text-center py-12">
              <Search className="mx-auto mb-3 text-textTertiary" size={48} />
              <p className="text-textSecondary">
                Busque por músicas, artistas ou álbuns
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

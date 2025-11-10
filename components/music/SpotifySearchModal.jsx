/**
 * Spotify Search Modal
 * Search and add songs from Spotify
 */
'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Play, Pause, Plus, Loader, Music } from 'lucide-react';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function SpotifySearchModal({ isOpen, onClose, onAddTrack }) {
  const { query, setQuery, results, isSearching, error } = useSpotifySearch();
  const [playingPreview, setPlayingPreview] = useState(null);
  const [addingTrack, setAddingTrack] = useState(null);
  const audioRef = useRef(null);

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
    }
    setPlayingPreview(null);
    onClose();
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
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-textTertiary"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar música, artista ou álbum..."
              className="w-full pl-10 pr-10 py-3 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textPrimary placeholder-textTertiary"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textTertiary hover:text-textPrimary"
              >
                <X size={20} />
              </button>
            )}
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

          {!isSearching && results.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((track) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-surface hover:bg-surfaceAlt rounded-xl transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {track.albumCover ? (
                      <img
                        src={track.albumCover}
                        alt={track.album}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={20} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-textPrimary truncate">
                      {track.name}
                    </h4>
                    <p className="text-sm text-textSecondary truncate">
                      {track.artist} • {formatDuration(track.duration_ms)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {track.preview_url && (
                      <button
                        onClick={() => handlePlayPreview(track)}
                        className={`p-2 rounded-full transition-colors ${
                          playingPreview === track.id
                            ? 'bg-primary text-white'
                            : 'bg-surfaceAlt hover:bg-surface text-textSecondary'
                        }`}
                        title="Preview 30s"
                      >
                        {playingPreview === track.id ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => handleAddTrack(track)}
                      disabled={addingTrack === track.id}
                      className="p-2 rounded-full bg-primary hover:bg-primary/90 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title="Adicionar à playlist"
                    >
                      {addingTrack === track.id ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
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

          {!query && !isSearching && (
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

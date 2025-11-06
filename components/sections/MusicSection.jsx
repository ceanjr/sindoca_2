/**
 * Music Section with Spotify Integration
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Music,
  Play,
  Pause,
  Plus,
  ExternalLink,
  Trash2,
  Loader,
  Disc,
  MoreVertical,
  Heart,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SpotifySearchModal from '../music/SpotifySearchModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useRealtimePlaylist } from '@/hooks/useRealtimePlaylist';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useConfirm } from '@/hooks/useConfirm';
import { toast } from 'sonner';

export default function MusicSection({ id }) {
  const { user } = useAuth();
  const {
    tracks,
    loading,
    playlistUrl,
    isMyTurn,
    partnerName,
    addTrack,
    removeTrack,
    toggleFavorite,
  } = useRealtimePlaylist();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [playingPreview, setPlayingPreview] = useState(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [connectingSpotify, setConnectingSpotify] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const audioRef = useRef(null);
  const previousTracksCount = useRef(0);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { isOpen, loading: confirmLoading, config, confirm, handleConfirm, handleCancel } = useConfirm();

  // Check if Spotify is connected
  useEffect(() => {
    const checkSpotifyConnection = async () => {
      if (!user) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('spotify_tokens')
        .eq('id', user.id)
        .single();

      if (!error && data?.spotify_tokens) {
        setSpotifyConnected(true);
      }
    };

    checkSpotifyConnection();
  }, [user]);

  // Check for connection success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      setSpotifyConnected(true);
      window.history.replaceState({}, '', '/musica');
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Notification when partner adds music
  useEffect(() => {
    if (!tracks || tracks.length === 0 || !user) return;

    // Only notify if tracks count increased (new track added)
    if (
      previousTracksCount.current > 0 &&
      previousTracksCount.current < tracks.length
    ) {
      const newTrack = tracks[0]; // Assuming newest is first (order by created_at desc)

      // Only notify if it wasn't added by current user
      if (newTrack.author_id !== user?.id) {
        const authorName = newTrack.profiles?.full_name || 'Seu parceiro';
        toast.success(`🎵 ${authorName} adicionou uma música!`, {
          description: `${newTrack.title} - ${newTrack.description}`,
          duration: 5000,
        });

        // Play notification sound if available
        if ('Audio' in window) {
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (e) {}
        }
      }
    }

    previousTracksCount.current = tracks.length;
  }, [tracks, user]);

  const handleConnectSpotify = () => {
    setConnectingSpotify(true);
    window.location.href = '/api/spotify/auth';
  };

  const handleAddTrack = async (track) => {
    try {
      await addTrack(track);
      toast.success('Música adicionada à playlist');
    } catch (error) {
      console.error('Failed to add track:', error);
      toast.error('Erro ao adicionar música. Tente novamente.');
    }
  };

  const handleRemoveTrack = async (trackId) => {
    const confirmed = await confirm({
      title: 'Remover música?',
      message: 'Tem certeza que deseja remover esta música da playlist?',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await removeTrack(trackId);
      toast.success('Música removida da playlist');
    } catch (error) {
      console.error('Failed to remove track:', error);
      toast.error('Erro ao remover música. Tente novamente.');
    }
  };

  const handleToggleFavorite = async (trackId) => {
    try {
      await toggleFavorite(trackId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Erro ao favoritar música. Tente novamente.');
    }
  };

  const handlePlayPreview = (track) => {
    const previewUrl = track.data?.preview_url;
    if (!previewUrl) return;

    if (playingPreview === track.id) {
      audioRef.current?.pause();
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = previewUrl;
        audioRef.current.play();
      }
      setPlayingPreview(track.id);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Filter tracks
  const filteredTracks = showOnlyFavorites
    ? tracks.filter((track) => track.isFavorite)
    : tracks;

  const favoritesCount = tracks.filter((track) => track.isFavorite).length;

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => setPlayingPreview(null)}
        onError={() => setPlayingPreview(null)}
      />

      <section id={id} className="min-h-screen px-4 py-20" ref={ref}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={inView ? { scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-block mb-4"
            >
              <Disc className="text-primary" size={48} />
            </motion.div>
            <h2 className="font-heading text-4xl md:text-6xl font-bold text-textPrimary mb-4">
              Nossa <span className="text-primary">Trilha Sonora</span>
            </h2>
            <p className="text-lg text-textSecondary max-w-2xl mx-auto">
              A Playlist Definitiva <br />
              <span className="text-sm text-textSecondary/80">
                (Proibido: Jorge Ben Jor, Natanzinho Lima e Projota)
              </span>
            </p>
          </motion.div>

          {/* Spotify Connection */}
          {!spotifyConnected && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md flex flex-col items-center mx-auto mb-12 p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl text-center"
            >
              <Music className="mx-auto mb-4 text-green-600" size={48} />
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Conectar ao Spotify
              </h3>
              <p className="text-green-700 mb-4">
                Conecte sua conta do Spotify para adicionar músicas à playlist
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={handleConnectSpotify}
                disabled={connectingSpotify}
              >
                {connectingSpotify ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  'Conectar Spotify'
                )}
              </Button>
            </motion.div>
          )}

          {/* Stats & Filter Toggle */}
          {!loading && tracks.length > 0 && (
            <div className="flex flex-col items-center gap-4 mb-8">
              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-4">
                <Badge variant="primary">{tracks.length} músicas</Badge>
                {favoritesCount > 0 && (
                  <Badge variant="accent">
                    <Heart
                      size={14}
                      className="inline mr-1"
                      fill="currentColor"
                    />
                    {favoritesCount} favoritas
                  </Badge>
                )}
                {playlistUrl && (
                  <a
                    href={playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                  >
                    <ExternalLink size={16} />
                    Abrir no Spotify
                  </a>
                )}
              </div>

              {/* Favorites Toggle */}
              {favoritesCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm">
                  <span className="text-sm text-textSecondary">
                    {showOnlyFavorites
                      ? 'Mostrando favoritas'
                      : 'Mostrar apenas favoritas'}
                  </span>
                  <button
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showOnlyFavorites ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showOnlyFavorites ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Turn Indicator */}
          {spotifyConnected && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div
                className={`max-w-2xl mx-auto p-4 rounded-2xl border-2 ${
                  isMyTurn
                    ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                    : 'bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isMyTurn ? 'bg-green-500' : 'bg-orange-500'
                    } animate-pulse`}
                  />
                  <p
                    className={`font-semibold ${
                      isMyTurn
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {isMyTurn ? (
                      <>
                        🎵 É a sua vez de adicionar uma música!
                      </>
                    ) : (
                      <>
                        ⏳ É a vez de {partnerName || 'seu parceiro'} adicionar uma música
                      </>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          {spotifyConnected && !loading && (
            <div className="flex justify-center mb-8">
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setSearchModalOpen(true)}
                disabled={!isMyTurn}
                className={!isMyTurn ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Adicionar Música
              </Button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-20">
              <Loader
                className="animate-spin text-primary mx-auto mb-4"
                size={48}
              />
              <p className="text-textSecondary">Carregando playlist...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && tracks.length === 0 && spotifyConnected && (
            <div className="text-center py-20">
              <Music className="mx-auto text-textTertiary mb-6" size={64} />
              <h3 className="text-2xl font-bold text-textPrimary mb-4">
                Playlist vazia
              </h3>
              <p className="text-textSecondary mb-8 max-w-md mx-auto">
                Adicione a primeira música à sua trilha sonora especial
              </p>
            </div>
          )}

          {/* Empty Favorites State */}
          {!loading &&
            tracks.length > 0 &&
            filteredTracks.length === 0 &&
            showOnlyFavorites && (
              <div className="text-center py-20">
                <Heart className="mx-auto text-textTertiary mb-6" size={64} />
                <h3 className="text-2xl font-bold text-textPrimary mb-4">
                  Nenhuma música favoritada
                </h3>
                <p className="text-textSecondary mb-8 max-w-md mx-auto">
                  Favorite algumas músicas para vê-las aqui
                </p>
              </div>
            )}

          {/* Track List */}
          {!loading && filteredTracks.length > 0 && (
            <div className="grid gap-4 max-w-4xl mx-auto">
              {filteredTracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all"
                >
                  {/* Album Cover - Clickable Player */}
                  <button
                    onClick={() =>
                      track.data?.preview_url && handlePlayPreview(track)
                    }
                    disabled={!track.data?.preview_url}
                    className={`relative flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden group ${
                      track.data?.preview_url
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    }`}
                    title={
                      track.data?.preview_url
                        ? 'Tocar preview'
                        : 'Preview não disponível'
                    }
                  >
                    {track.data?.album_cover ? (
                      <>
                        <img
                          src={track.data.album_cover}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                        {track.data?.preview_url && (
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-all ${
                              playingPreview === track.id
                                ? 'bg-black/60'
                                : 'bg-black/40 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {playingPreview === track.id ? (
                              <Pause size={24} className="text-white" />
                            ) : (
                              <Play size={24} className="text-white" />
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={24} className="text-gray-400" />
                      </div>
                    )}
                  </button>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-textPrimary truncate">
                      {track.title}
                    </h4>
                    <p className="text-sm text-textSecondary truncate">
                      {track.description}
                    </p>
                    <p className="text-xs text-textTertiary mt-1">
                      Adicionado por {track.profiles?.full_name || 'Alguém'} •{' '}
                      {formatDate(track.created_at)}
                    </p>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === track.id ? null : track.id
                        );
                      }}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                      title="Mais opções"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {openMenuId === track.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Favorite */}
                          <button
                            onClick={() => {
                              handleToggleFavorite(track.id);
                              setOpenMenuId(null);
                            }}
                            className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                              track.isFavorite
                                ? 'hover:bg-red-50 text-red-600'
                                : 'hover:bg-pink-50 text-pink-600'
                            }`}
                          >
                            <Heart
                              size={16}
                              fill={track.isFavorite ? 'currentColor' : 'none'}
                            />
                            <span className="text-sm font-medium">
                              {track.isFavorite ? 'Desfavoritar' : 'Favoritar'}
                            </span>
                          </button>

                          {/* Open in Spotify */}
                          {track.data?.spotify_url && (
                            <a
                              href={track.data.spotify_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-green-50 text-green-600 transition-colors"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <ExternalLink size={16} />
                              <span className="text-sm font-medium">
                                Ouvir no Spotify
                              </span>
                            </a>
                          )}

                          {/* Remove (only for author) */}
                          {track.author_id === user?.id && (
                            <button
                              onClick={() => {
                                handleRemoveTrack(track.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                              <span className="text-sm font-medium">
                                Remover
                              </span>
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Search Modal */}
      <SpotifySearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onAddTrack={handleAddTrack}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        variant={config.variant}
        loading={confirmLoading}
      />
    </>
  );
}

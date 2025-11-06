/**
 * Music Section with Spotify Integration
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Music, Play, Pause, Heart, Plus, ExternalLink, Trash2, Loader, Disc } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SpotifySearchModal from '../music/SpotifySearchModal';
import { useRealtimePlaylist } from '@/hooks/useRealtimePlaylist';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function MusicSection({ id }) {
  const { user } = useAuth();
  const { tracks, loading, playlistUrl, addTrack, removeTrack } = useRealtimePlaylist();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [playingPreview, setPlayingPreview] = useState(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [connectingSpotify, setConnectingSpotify] = useState(false);
  const audioRef = useRef(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

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

  const handleConnectSpotify = () => {
    setConnectingSpotify(true);
    window.location.href = '/api/spotify/auth';
  };

  const handleAddTrack = async (track) => {
    try {
      await addTrack(track);
    } catch (error) {
      console.error('Failed to add track:', error);
      alert('Erro ao adicionar música. Tente novamente.');
    }
  };

  const handleRemoveTrack = async (trackId) => {
    if (!confirm('Remover esta música da playlist?')) return;

    try {
      await removeTrack(trackId);
    } catch (error) {
      console.error('Failed to remove track:', error);
      alert('Erro ao remover música. Tente novamente.');
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
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
              Playlist colaborativa com as músicas que fazem parte da nossa história
            </p>
          </motion.div>

          {/* Spotify Connection */}
          {!spotifyConnected && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto mb-12 p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl text-center"
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

          {/* Stats */}
          {!loading && tracks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="primary">{tracks.length} músicas</Badge>
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
          )}

          {/* Actions */}
          {spotifyConnected && !loading && (
            <div className="flex justify-center mb-8">
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setSearchModalOpen(true)}
              >
                Adicionar Música
              </Button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-20">
              <Loader className="animate-spin text-primary mx-auto mb-4" size={48} />
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
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setSearchModalOpen(true)}
              >
                Adicionar Primeira Música
              </Button>
            </div>
          )}

          {/* Track List */}
          {!loading && tracks.length > 0 && (
            <div className="grid gap-4 max-w-4xl mx-auto">
              {tracks.map((track, index) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all"
                >
                  {/* Album Cover */}
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                    {track.data?.album_cover ? (
                      <img
                        src={track.data.album_cover}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={24} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-textPrimary truncate">
                      {track.title}
                    </h4>
                    <p className="text-sm text-textSecondary truncate">
                      {track.description}
                    </p>
                    <p className="text-xs text-textTertiary mt-1">
                      Adicionado por {track.profiles?.full_name || 'Alguém'} • {formatDate(track.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Preview */}
                    {track.data?.preview_url && (
                      <button
                        onClick={() => handlePlayPreview(track)}
                        className={`p-2 rounded-full transition-colors ${
                          playingPreview === track.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                        title="Preview"
                      >
                        {playingPreview === track.id ? (
                          <Pause size={18} />
                        ) : (
                          <Play size={18} />
                        )}
                      </button>
                    )}

                    {/* Open in Spotify */}
                    {track.data?.spotify_url && (
                      <a
                        href={track.data.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
                        title="Abrir no Spotify"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}

                    {/* Delete */}
                    {track.author_id === user?.id && (
                      <button
                        onClick={() => handleRemoveTrack(track.id)}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
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
    </>
  );
}

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useRouter } from 'next/navigation'
import { Music, Play, Heart, User, Plus, Disc } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getUserWorkspaces } from '@/lib/api/workspace'

export default function MusicSection({ id }) {
  const router = useRouter()
  const { user } = useAuth()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (user) {
      loadSongs()
    }
  }, [user])

  const loadSongs = async () => {
    try {
      const supabase = createClient()

      // Get user's workspace
      const workspacesData = await getUserWorkspaces(user.id)
      if (workspacesData.length === 0) {
        setLoading(false)
        return
      }

      const workspaceId = workspacesData[0].workspace_id

      // Load songs from content table
      const { data, error } = await supabase
        .from('content')
        .select('*, profiles:author_id(*)')
        .eq('workspace_id', workspaceId)
        .eq('type', 'music')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedSongs = data.map(item => ({
        id: item.id,
        title: item.data?.title || '',
        artist: item.data?.artist || '',
        addedBy: item.profiles?.full_name || 'Alguém',
        addedById: item.author_id,
        date: item.created_at?.slice(0, 10) || '',
        note: item.data?.note || '',
        coverColor: item.data?.coverColor || 'from-blue-400 to-cyan-500',
        isFavorite: item.is_favorite || false,
      }))

      setSongs(formattedSongs)
    } catch (error) {
      // console.error('Error loading songs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtra músicas baseado na tab ativa
  const filteredPlaylist = songs.filter((song) => {
    if (activeTab === 'all') return true
    if (activeTab === 'yours') return song.addedById === user?.id
    if (activeTab === 'hers') return song.addedById !== user?.id
    if (activeTab === 'favorites') return song.isFavorite
    return true
  })

  // Estatísticas
  const stats = {
    total: songs.length,
    yours: songs.filter((s) => s.addedById === user?.id).length,
    hers: songs.filter((s) => s.addedById !== user?.id).length,
    favorites: songs.filter((s) => s.isFavorite).length,
  }

  return (
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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
            />
            <p className="text-textSecondary mt-4">Carregando...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && songs.length === 0 && (
          <div className="text-center py-20">
            <Music className="mx-auto text-textTertiary mb-6" size={64} />
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Nenhuma música ainda
            </h3>
            <p className="text-textSecondary mb-8 max-w-md mx-auto">
              Crie uma playlist colaborativa com as músicas especiais da jornada
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Adicionar Primeira Música
            </motion.button>
          </div>
        )}

        {/* Stats */}
        {!loading && songs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            <Badge variant="primary">
              <Music size={14} className="inline mr-1" />
              {stats.total} músicas
            </Badge>
            <Badge variant="accent">
              <User size={14} className="inline mr-1" />
              {stats.yours} suas escolhas
            </Badge>
            <Badge variant="lavender">
              <User size={14} className="inline mr-1" />
              {stats.hers} escolhas dela
            </Badge>
            <Badge variant="primary">
              <Heart size={14} className="inline mr-1" />
              {stats.favorites} favoritas
            </Badge>
          </motion.div>
        )}

        {!loading && songs.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Playlist */}
            <div className="lg:col-span-2">
              {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {[
                { id: 'all', label: 'Todas', icon: Music },
                { id: 'yours', label: 'Minhas Escolhas', icon: User },
                { id: 'hers', label: 'Escolhas Dela', icon: User },
                { id: 'favorites', label: 'Favoritas', icon: Heart },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-primary text-white shadow-soft-md'
                        : 'bg-surface text-textSecondary hover:bg-surfaceAlt'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </motion.button>
                )
              })}
            </motion.div>

            {/* Song List */}
            <div className="space-y-3">
              {filteredPlaylist.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                >
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="bg-surface rounded-2xl p-4 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Album Cover */}
                      <div
                        className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${song.coverColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Play className="text-white" size={24} />
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-textPrimary font-semibold truncate">
                          {song.title}
                        </h4>
                        <p className="text-textSecondary text-sm truncate">
                          {song.artist}
                        </p>
                        {song.note && (
                          <p className="text-textTertiary text-xs italic mt-1">
                            &quot;{song.note}&quot;
                          </p>
                        )}
                      </div>

                      {/* Added By */}
                      <div className="flex-shrink-0 text-right">
                        <Badge
                          variant={song.addedBy === 'Você' ? 'accent' : 'lavender'}
                        >
                          {song.addedBy}
                        </Badge>
                        {song.isFavorite && (
                          <Heart
                            size={16}
                            className="inline-block ml-2 text-primary"
                            fill="currentColor"
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Add Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-6 text-center"
            >
              <Button variant="outline" icon={Plus}>
                Adicionar Música
              </Button>
            </motion.div>
          </div>

          {/* Spotify Player & Info */}
          <div className="space-y-6">
            {/* Spotify Embed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-surface rounded-3xl p-6 shadow-soft-lg"
            >
              <div className="mb-4">
                <h3 className="text-xl font-heading font-semibold text-textPrimary mb-2">
                  Player Spotify
                </h3>
                <p className="text-sm text-textSecondary">
                  Ouça nossa playlist completa
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden">
                <iframe
                  src="https://open.spotify.com/embed/playlist/1AIzrmUSMbyU8vl1rR63mZ?utm_source=generator&theme=0"
                  width="100%"
                  height="380"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-2xl"
                />
              </div>
            </motion.div>

            {/* Nossa Música */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-gradient-to-br bg-primary/10 rounded-3xl p-6 border-2 border-primary/20"
            >
              <Heart className="text-primary mb-3" size={32} />
              <h3 className="text-xl font-heading font-semibold text-textPrimary mb-2">
                Nossa Música
              </h3>
              <p className="text-lg font-medium text-textPrimary mb-1">
                Perfect - Ed Sheeran
              </p>
              <p className="text-sm text-textSecondary">
                A música que define perfeitamente o que sentimos
              </p>
            </motion.div>

            {/* Music Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-surface rounded-3xl p-6 shadow-soft-md"
            >
              <h3 className="text-lg font-heading font-semibold text-textPrimary mb-4">
                Estatísticas Musicais
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-textSecondary text-sm">Gênero favorito</span>
                  <span className="text-textPrimary font-semibold">Pop/Rock</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-textSecondary text-sm">Horas ouvidas</span>
                  <span className="text-textPrimary font-semibold">120+ hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-textSecondary text-sm">Artista mais ouvido</span>
                  <span className="text-textPrimary font-semibold">Ed Sheeran</span>
                </div>
              </div>
            </motion.div>
          </div>
          </div>
        )}

        {/* Quote */}
        {!loading && songs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-12 text-center bg-surface rounded-3xl p-8 shadow-soft-md"
        >
          <Music className="inline-block text-secondary mb-3" size={32} />
          <p className="font-body text-xl text-textPrimary leading-relaxed">
            &quot;Música é a trilha sonora da nossa{' '}
            <span className="text-primary font-bold">história de amor</span>&quot;
          </p>
        </motion.div>
        )}
      </div>
    </section>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Heart, Users, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StreakCounter from '@/components/streak/StreakCounter'
import ThinkingOfYouWidget from '@/components/widgets/ThinkingOfYouWidget'
import StoriesReel from '@/components/stories/StoriesReel'
import CreateStoryModal from '@/components/stories/CreateStoryModal'
import PullToRefresh from '@/components/ui/PullToRefresh'
import { getUserWorkspaces } from '@/lib/api/workspace'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null)
  const [stories, setStories] = useState<any[]>([])
  const [showCreateStory, setShowCreateStory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    photos: 0,
    messages: 0,
    achievements: 0,
  })

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      if (!user) return

      // Load workspaces
      const workspacesData = await getUserWorkspaces(user.id)
      setWorkspaces(workspacesData)

      // Set active workspace (first one)
      if (workspacesData.length > 0) {
        const firstWorkspace = workspacesData[0]
        setActiveWorkspace(firstWorkspace)
        await loadWorkspaceData(firstWorkspace.workspace_id)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkspaceData = async (workspaceId: string) => {
    try {
      const supabase = createClient()

      // Load stories
      const { data: storiesData } = await supabase
        .from('content')
        .select('*, profiles:author_id(*)')
        .eq('workspace_id', workspaceId)
        .eq('type', 'story')
        .order('created_at', { ascending: false })

      if (storiesData) {
        setStories(
          storiesData.map((s) => ({
            id: s.id,
            author_id: s.author_id,
            author_name: s.profiles?.full_name || 'Usuário',
            author_avatar: s.profiles?.avatar_url,
            content_url: s.storage_path || '',
            content_type: s.data?.type || 'image',
            text_content: s.data?.text_content,
            created_at: s.created_at,
            expires_at: s.data?.expires_at,
            views: s.data?.views || [],
            reactions: s.data?.reactions || [],
          }))
        )
      }

      // Load stats
      const { count: photosCount } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('type', 'photo')

      const { count: messagesCount } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('type', 'message')

      const { count: achievementsCount } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('type', 'achievement')

      setStats({
        photos: photosCount || 0,
        messages: messagesCount || 0,
        achievements: achievementsCount || 0,
      })
    } catch (error) {
      console.error('Error loading workspace data:', error)
    }
  }

  const handleRefresh = async () => {
    if (activeWorkspace) {
      await loadWorkspaceData(activeWorkspace.workspace_id)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
          />
        </div>
      </ProtectedRoute>
    )
  }

  if (!activeWorkspace) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="text-6xl mb-6">💕</div>
            <h2 className="text-3xl font-bold text-textPrimary mb-4">
              Bem-vindo(a)!
            </h2>
            <p className="text-textSecondary mb-8">
              Você ainda não tem nenhum workspace. Crie um para começar sua jornada ou aceite um convite!
            </p>
            <div className="flex gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md"
              >
                Criar Workspace
              </motion.button>
            </div>
          </motion.div>
        </div>
      </ProtectedRoute>
    )
  }

  const workspace = activeWorkspace.workspaces
  const partnerId = workspace.creator_id === user?.id ? workspace.partner_id : workspace.creator_id

  return (
    <ProtectedRoute>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-textPrimary mb-2">
              {workspace.name} 💕
            </h1>
            <p className="text-textSecondary flex items-center gap-2">
              <Users size={16} />
              {workspace.status === 'active' ? 'Workspace Ativo' : 'Aguardando parceiro'}
            </p>
          </div>

          {/* Stories Section */}
          {stories.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-textPrimary">Stories</h2>
                <button
                  onClick={() => setShowCreateStory(true)}
                  className="text-primary font-semibold text-sm flex items-center gap-1"
                >
                  <Plus size={16} />
                  Criar
                </button>
              </div>
              <StoriesReel
                workspaceId={workspace.id}
                stories={stories}
                onRefresh={handleRefresh}
              />
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Photos */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push('/galeria')}
              className="bg-surface rounded-3xl p-6 shadow-soft-lg cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                  <Calendar size={24} className="text-white" />
                </div>
                <span className="text-3xl font-bold text-textPrimary">{stats.photos}</span>
              </div>
              <h3 className="text-lg font-semibold text-textPrimary">Fotos</h3>
              <p className="text-textSecondary text-sm">Memórias capturadas</p>
            </motion.div>

            {/* Messages */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push('/mensagens')}
              className="bg-surface rounded-3xl p-6 shadow-soft-lg cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center">
                  <Heart size={24} className="text-white" />
                </div>
                <span className="text-3xl font-bold text-textPrimary">{stats.messages}</span>
              </div>
              <h3 className="text-lg font-semibold text-textPrimary">Mensagens</h3>
              <p className="text-textSecondary text-sm">Palavras especiais</p>
            </motion.div>

            {/* Achievements */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => router.push('/conquistas')}
              className="bg-surface rounded-3xl p-6 shadow-soft-lg cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center">
                  <Calendar size={24} className="text-white" />
                </div>
                <span className="text-3xl font-bold text-textPrimary">{stats.achievements}</span>
              </div>
              <h3 className="text-lg font-semibold text-textPrimary">Conquistas</h3>
              <p className="text-textSecondary text-sm">Marcos importantes</p>
            </motion.div>
          </div>

          {/* Streak Counter */}
          <div className="mb-8">
            <StreakCounter workspaceId={workspace.id} />
          </div>

          {/* Thinking of You Widget */}
          {partnerId && workspace.status === 'active' && (
            <div className="mb-8">
              <ThinkingOfYouWidget
                workspaceId={workspace.id}
                partnerId={partnerId}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/galeria')}
              className="bg-surface rounded-2xl p-6 shadow-soft-lg flex flex-col items-center gap-3"
            >
              <Calendar size={32} className="text-primary" />
              <span className="text-sm font-semibold text-textPrimary">Galeria</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/amor')}
              className="bg-surface rounded-2xl p-6 shadow-soft-lg flex flex-col items-center gap-3"
            >
              <Heart size={32} className="text-primary" />
              <span className="text-sm font-semibold text-textPrimary">O Que Amo</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/musica')}
              className="bg-surface rounded-2xl p-6 shadow-soft-lg flex flex-col items-center gap-3"
            >
              <Calendar size={32} className="text-primary" />
              <span className="text-sm font-semibold text-textPrimary">Música</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateStory(true)}
              className="bg-primary rounded-2xl p-6 shadow-soft-md flex flex-col items-center gap-3 text-white"
            >
              <Plus size={32} />
              <span className="text-sm font-semibold">Criar Story</span>
            </motion.button>
          </div>

          {/* Empty State */}
          {stats.photos === 0 && stats.messages === 0 && stats.achievements === 0 && (
            <div className="text-center py-16">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block mb-4 text-6xl"
              >
                ✨
              </motion.div>
              <h3 className="text-2xl font-bold text-textPrimary mb-2">
                Comece Sua História
              </h3>
              <p className="text-textSecondary mb-6">
                Adicione fotos, mensagens e conquistas para criar suas memórias especiais
              </p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/galeria')}
                  className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md"
                >
                  Adicionar Primeira Foto
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Create Story Modal */}
        <CreateStoryModal
          isOpen={showCreateStory}
          onClose={() => setShowCreateStory(false)}
          workspaceId={workspace.id}
          onStoryCreated={() => {
            handleRefresh()
            toast.success('Story criada! 🎉')
          }}
        />

        {/* Floating Widget (Compact) */}
        {partnerId && workspace.status === 'active' && (
          <ThinkingOfYouWidget
            workspaceId={workspace.id}
            partnerId={partnerId}
            compact
          />
        )}
      </PullToRefresh>
    </ProtectedRoute>
  )
}

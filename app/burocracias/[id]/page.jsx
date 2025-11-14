'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Flame,
  TrendingUp,
  Loader2,
  CheckCircle2,
  PauseCircle,
  Handshake,
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DiscussionChat from '@/components/burocracias/DiscussionChat';
import PinnedArguments from '@/components/burocracias/PinnedArguments';
import DiscussionStats from '@/components/burocracias/DiscussionStats';
import { useDiscussionMessages } from '@/hooks/useDiscussionMessages';

/**
 * Cores e configurações por categoria
 */
const categoryConfig = {
  financeiro: { icon: '💰', label: 'Financeiro', color: 'text-green-700 dark:text-green-400' },
  casa: { icon: '🏠', label: 'Casa/Tarefas', color: 'text-blue-700 dark:text-blue-400' },
  planejamento: { icon: '📅', label: 'Planejamento', color: 'text-purple-700 dark:text-purple-400' },
  dr: { icon: '💔', label: 'DR', color: 'text-red-700 dark:text-red-400' },
  diversao: { icon: '🎮', label: 'Diversão', color: 'text-yellow-700 dark:text-yellow-400' },
  importante: { icon: '📌', label: 'Importante', color: 'text-orange-700 dark:text-orange-400' },
};

/**
 * Cores e labels por status
 */
const statusConfig = {
  em_andamento: { icon: '🔥', label: 'Em andamento' },
  resolvida: { icon: '✅', label: 'Resolvida' },
  pausada: { icon: '⏸️', label: 'Pausada' },
  acordo_fechado: { icon: '🤝', label: 'Acordo fechado' },
};

/**
 * Níveis de intensidade
 */
const intensityLevels = [
  { threshold: 20, label: 'Paz mundial', color: 'bg-green-500', emoji: '🟢' },
  { threshold: 40, label: 'Conversa civilizada', color: 'bg-lime-500', emoji: '🟡' },
  { threshold: 60, label: 'Esquentando', color: 'bg-yellow-500', emoji: '🟠' },
  { threshold: 80, label: 'DR moderada', color: 'bg-orange-500', emoji: '🔴' },
  { threshold: 100, label: 'Chama o VAR', color: 'bg-red-500', emoji: '🌋' },
];

const getIntensityLevel = (score) => {
  return intensityLevels.find(level => score <= level.threshold) || intensityLevels[intensityLevels.length - 1];
};

/**
 * Página de detalhes da discussão individual
 * Com chat funcional completo (Fase 2)
 */
export default function DiscussionDetailPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const supabase = createClient();

  // Hook para mensagens
  const {
    messages,
    pinnedMessages,
    scrollToMessage,
  } = useDiscussionMessages(params.id);

  // Carregar discussão
  useEffect(() => {
    const loadDiscussion = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('discussions')
          .select(`
            *,
            author:profiles!discussions_author_id_fkey(id, full_name, nickname, avatar_url)
          `)
          .eq('id', params.id)
          .single();

        if (fetchError) throw fetchError;

        setDiscussion(data);
      } catch (err) {
        console.error('Error loading discussion:', err);
        setError(err.message);
        toast.error('Erro ao carregar discussão');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadDiscussion();
    }
  }, [params.id, supabase]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background via-lavender/5 to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-textSecondary dark:text-gray-400">
              Carregando discussão...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !discussion) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-background via-lavender/5 to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-2xl p-8 text-center max-w-md">
            <p className="text-red-700 dark:text-red-400 font-medium mb-4">
              Discussão não encontrada
            </p>
            <motion.button
              onClick={() => router.push('/burocracias')}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium"
            >
              Voltar para lista
            </motion.button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const category = categoryConfig[discussion.category] || categoryConfig.diversao;
  const status = statusConfig[discussion.status] || statusConfig.em_andamento;
  const intensity = getIntensityLevel(discussion.intensity_score || 0);

  const statusOptions = [
    { value: 'em_andamento', ...statusConfig.em_andamento },
    { value: 'resolvida', ...statusConfig.resolvida },
    { value: 'pausada', ...statusConfig.pausada },
    { value: 'acordo_fechado', ...statusConfig.acordo_fechado },
  ];

  const handleChangeStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('discussions')
        .update({ status: newStatus })
        .eq('id', params.id);

      if (error) throw error;

      setDiscussion({ ...discussion, status: newStatus });
      setShowStatusMenu(false);
      toast.success('Status atualizado!');

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Enviar notificação de mudança de status
      try {
        // Buscar workspace e parceiro
        const { data: workspaceMembers } = await supabase
          .from('workspace_members')
          .select('user_id')
          .eq('workspace_id', discussion.workspace_id);

        // Encontrar parceiro (outro membro que não é o usuário atual)
        const partner = workspaceMembers?.find(m => m.user_id !== user.id);

        if (partner) {
          const statusLabel = statusConfig[newStatus]?.label || newStatus;

          await fetch('/api/burocracias/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              discussionId: params.id,
              recipientId: partner.user_id,
              senderId: user.id,
              type: 'status_change',
              metadata: {
                senderId: user.id,
                status: statusLabel,
              },
            }),
          });
        }
      } catch (notifError) {
        console.error('Error sending status notification:', notifError);
        // Não bloqueia a atualização de status se a notificação falhar
      }
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-lavender/5 to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <button
              onClick={() => router.push('/burocracias')}
              className="flex items-center gap-2 text-textSecondary dark:text-gray-400 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Burocracias</span>
            </button>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Editar discussão"
              >
                <Edit className="w-5 h-5 text-textSecondary dark:text-gray-400" />
              </motion.button>
            </div>
          </motion.div>

          {/* Conteúdo Principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-soft-lg overflow-hidden"
          >
            {/* Cabeçalho da Discussão */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${category.color}`}>
                  <span>{category.icon}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>{status.icon}</span>
                  <span className="text-sm font-medium text-textPrimary dark:text-gray-200">
                    {status.label}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-textPrimary dark:text-white mb-3">
                {discussion.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-textSecondary dark:text-gray-400">
                <span>Criado por</span>
                <span className="font-medium text-textPrimary dark:text-gray-200">
                  {discussion.author?.nickname || discussion.author?.full_name || 'Anônimo'}
                </span>
                <span>•</span>
                <span>{new Date(discussion.created_at).toLocaleDateString('pt-BR')}</span>
              </div>

              {discussion.treta_reason && (
                <div className="flex items-start gap-2 mt-4 p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
                  <Flame className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      Motivo da Treta:
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {discussion.treta_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Medidor de Intensidade */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Medidor de Intensidade
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{intensity.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {intensity.label}
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${discussion.intensity_score || 0}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full ${intensity.color}`}
                  />
                </div>
              </div>

              {/* Botão Marcar Como */}
              <div className="mt-4 relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>✅ Marcar como...</span>
                </motion.button>

                {/* Menu de Status */}
                {showStatusMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowStatusMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
                    >
                      {statusOptions.map((statusOption) => {
                        const StatusIcon = statusOption.icon;
                        return (
                          <button
                            key={statusOption.value}
                            onClick={() => handleChangeStatus(statusOption.value)}
                            className={`
                              w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3
                              ${discussion.status === statusOption.value ? 'bg-gray-100 dark:bg-gray-700' : ''}
                            `}
                          >
                            <StatusIcon className="w-5 h-5" />
                            <span className="font-medium">
                              {statusOption.icon} {statusOption.label}
                            </span>
                            {discussion.status === statusOption.value && (
                              <span className="ml-auto text-primary">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </div>
            </div>

            {/* Dissertação */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-textSecondary dark:text-gray-400 mb-2 uppercase tracking-wide">
                Dissertação
              </h3>
              <p className="text-textPrimary dark:text-gray-200 whitespace-pre-wrap">
                {discussion.description}
              </p>

              {discussion.image_url && (
                <div className="mt-4 rounded-xl overflow-hidden">
                  <img
                    src={discussion.image_url}
                    alt="Imagem da discussão"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>

            {/* Argumentos Fixados */}
            <PinnedArguments
              pinnedMessages={pinnedMessages}
              onScrollToMessage={scrollToMessage}
            />

            {/* Área de Chat */}
            <div className="p-6">
              <DiscussionChat
                discussionId={params.id}
                currentUserId={user?.id}
              />
            </div>
          </motion.div>

          {/* Estatísticas (Sidebar em desktop, abaixo em mobile) */}
          <div className="mt-6">
            <DiscussionStats
              discussion={discussion}
              messages={messages}
              pinnedMessages={pinnedMessages}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

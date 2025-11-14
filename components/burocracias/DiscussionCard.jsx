'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Clock,
  Flame,
  CheckCircle2,
  PauseCircle,
  Handshake,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Cores e configurações por categoria
 */
const categoryConfig = {
  financeiro: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-300 dark:border-green-700',
    icon: '💰',
    color: 'text-green-700 dark:text-green-400',
    label: 'Financeiro'
  },
  casa: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    icon: '🏠',
    color: 'text-blue-700 dark:text-blue-400',
    label: 'Casa/Tarefas'
  },
  planejamento: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-300 dark:border-purple-700',
    icon: '📅',
    color: 'text-purple-700 dark:text-purple-400',
    label: 'Planejamento'
  },
  dr: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    icon: '💔',
    color: 'text-red-700 dark:text-red-400',
    label: 'DR'
  },
  diversao: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    icon: '🎮',
    color: 'text-yellow-700 dark:text-yellow-400',
    label: 'Diversão'
  },
  importante: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    icon: '📌',
    color: 'text-orange-700 dark:text-orange-400',
    label: 'Importante'
  }
};

/**
 * Cores e ícones por status
 */
const statusConfig = {
  em_andamento: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    icon: Flame,
    label: 'Em andamento'
  },
  resolvida: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    icon: CheckCircle2,
    label: 'Resolvida'
  },
  pausada: {
    bg: 'bg-gray-100 dark:bg-gray-700/30',
    text: 'text-gray-700 dark:text-gray-400',
    icon: PauseCircle,
    label: 'Pausada'
  },
  acordo_fechado: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: Handshake,
    label: 'Acordo fechado'
  }
};

/**
 * Níveis de intensidade
 */
const intensityLevels = [
  { threshold: 20, label: 'Paz mundial', color: 'bg-green-500', emoji: '🟢' },
  { threshold: 40, label: 'Conversa civilizada', color: 'bg-lime-500', emoji: '🟡' },
  { threshold: 60, label: 'Esquentando', color: 'bg-yellow-500', emoji: '🟠' },
  { threshold: 80, label: 'DR moderada', color: 'bg-orange-500', emoji: '🔴' },
  { threshold: 100, label: 'Chama o VAR', color: 'bg-red-500', emoji: '🌋' }
];

const getIntensityLevel = (score) => {
  return intensityLevels.find(level => score <= level.threshold) || intensityLevels[intensityLevels.length - 1];
};

/**
 * Card de discussão na lista
 */
export default function DiscussionCard({ discussion, onClick }) {
  const router = useRouter();
  const category = categoryConfig[discussion.category] || categoryConfig.diversao;
  const status = statusConfig[discussion.status] || statusConfig.em_andamento;
  const StatusIcon = status.icon;
  const intensity = getIntensityLevel(discussion.intensity_score || 0);

  const handleClick = () => {
    if (onClick) {
      onClick(discussion);
    } else {
      router.push(`/burocracias/${discussion.id}`);
    }
  };

  const handleVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        handleVibration();
        handleClick();
      }}
      className={`
        relative overflow-hidden rounded-2xl
        ${category.bg} ${category.border}
        border-2 cursor-pointer
        transition-all duration-300
        hover:shadow-lg
        p-4
      `}
    >
      {/* Header: Autor e Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {discussion.author?.avatar_url ? (
            <img
              src={discussion.author.avatar_url}
              alt={discussion.author.full_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {discussion.author?.full_name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-textPrimary dark:text-gray-200">
            {discussion.author?.nickname || discussion.author?.full_name || 'Anônimo'}
          </span>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bg}`}>
          <StatusIcon className={`w-4 h-4 ${status.text}`} />
          <span className={`text-xs font-medium ${status.text}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Categoria */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${category.color} mb-3`}>
        <span>{category.icon}</span>
        <span className="text-xs font-medium">{category.label}</span>
      </div>

      {/* Título da Discussão */}
      <h3 className="text-lg font-semibold text-textPrimary dark:text-white mb-2 line-clamp-2">
        {discussion.title}
      </h3>

      {/* Motivo da Treta */}
      {discussion.treta_reason && (
        <div className="flex items-start gap-2 mb-3 p-2 bg-red-50/50 dark:bg-red-900/20 rounded-lg">
          <Flame className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400 line-clamp-2">
            {discussion.treta_reason}
          </p>
        </div>
      )}

      {/* Medidor de Intensidade */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Intensidade</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs">{intensity.emoji}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {intensity.label}
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${discussion.intensity_score || 0}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`h-full ${intensity.color}`}
          />
        </div>
      </div>

      {/* Footer: Mensagens e Última Atividade */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          {/* Contador de Mensagens */}
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>{discussion.total_messages || 0} mensagens</span>
            {discussion.unreadCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
                {discussion.unreadCount} {discussion.unreadCount === 1 ? 'nova' : 'novas'}
              </span>
            )}
          </div>
        </div>

        {/* Última Atividade */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span className="text-xs">
            {formatDistanceToNow(new Date(discussion.last_activity_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </span>
        </div>
      </div>

      {/* Imagem de fundo sutil (se existir) */}
      {discussion.image_url && (
        <div
          className="absolute top-0 right-0 w-24 h-24 opacity-10 dark:opacity-5 bg-cover bg-center rounded-bl-3xl"
          style={{ backgroundImage: `url(${discussion.image_url})` }}
        />
      )}
    </motion.div>
  );
}

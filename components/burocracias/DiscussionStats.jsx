'use client';

import { motion } from 'framer-motion';
import { MessageCircle, Pin, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Componente que exibe estatísticas da discussão
 * - Total de mensagens
 * - Argumentos fixados
 * - Última atividade
 * - Emojis mais usados
 */
export default function DiscussionStats({ discussion, messages, pinnedMessages }) {
  // Calcular emojis mais usados
  const emojiCounts = messages.reduce((acc, msg) => {
    msg.reactions?.forEach((reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    });
    return acc;
  }, {});

  const topEmojis = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const stats = [
    {
      icon: MessageCircle,
      label: 'Mensagens',
      value: messages.length,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Pin,
      label: 'Argumentos fixados',
      value: pinnedMessages?.length || 0,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: TrendingUp,
      label: 'Intensidade',
      value: `${discussion.intensity_score || 0}%`,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-sm font-semibold text-textSecondary dark:text-gray-400 mb-4 uppercase tracking-wide">
        Estatísticas da Discussão
      </h3>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bg} rounded-xl p-4 text-center`}
            >
              <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className="text-2xl font-bold text-textPrimary dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-textSecondary dark:text-gray-400">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Emojis Mais Usados */}
      {topEmojis.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-textSecondary dark:text-gray-400 mb-2">
            Emojis mais usados:
          </p>
          <div className="flex items-center gap-2">
            {topEmojis.map(([emoji, count]) => (
              <div
                key={emoji}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full"
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-medium text-textPrimary dark:text-gray-200">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Última Resposta */}
      <div className="flex items-center gap-2 text-sm text-textSecondary dark:text-gray-400">
        <Clock className="w-4 h-4" />
        <span>
          Última resposta:{' '}
          {formatDistanceToNow(new Date(discussion.last_activity_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      </div>
    </motion.div>
  );
}

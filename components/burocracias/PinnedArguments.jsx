'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Pin, User, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

/**
 * Componente que exibe argumentos fixados (mensagens importantes)
 * Aparece no topo da discussão
 */
export default function PinnedArguments({ pinnedMessages, onScrollToMessage }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  const handleVibration = (duration = 30) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-gray-200 dark:border-gray-700 bg-yellow-50/50 dark:bg-yellow-900/10"
    >
      {/* Header */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          handleVibration();
        }}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pin className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
          <h3 className="font-semibold text-textPrimary dark:text-white">
            Argumentos Fixados
          </h3>
          <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs font-medium rounded-full">
            {pinnedMessages.length}
          </span>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Lista de Argumentos */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 space-y-3">
              {pinnedMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (onScrollToMessage) {
                      onScrollToMessage(message.id);
                      handleVibration();
                    }
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-yellow-300 dark:border-yellow-700 cursor-pointer hover:shadow-md transition-all"
                >
                  {/* Autor */}
                  <div className="flex items-center gap-2 mb-2">
                    {message.author?.avatar_url ? (
                      <img
                        src={message.author.avatar_url}
                        alt={message.author.full_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-textPrimary dark:text-white">
                      {message.author?.nickname || message.author?.full_name || 'Anônimo'}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <p className="text-sm text-textPrimary dark:text-gray-200 line-clamp-3 mb-2">
                    {message.content}
                  </p>

                  {/* Imagem (se houver) */}
                  {message.image_url && (
                    <div className="mt-2 rounded-lg overflow-hidden max-w-xs">
                      <img
                        src={message.image_url}
                        alt="Imagem do argumento"
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {/* Reações */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      {/* Agrupar reações por emoji */}
                      {Object.entries(
                        message.reactions.reduce((acc, r) => {
                          acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([emoji, count]) => (
                        <div
                          key={emoji}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                        >
                          <span>{emoji}</span>
                          <span className="text-textSecondary dark:text-gray-400">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

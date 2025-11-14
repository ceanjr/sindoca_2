'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Pin,
  PinOff,
  Smile,
  MessageCircle,
  Check,
  X as XIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import ThreadView from './ThreadView';

/**
 * Componente de bolha de mensagem
 * Exibe uma mensagem individual com:
 * - Avatar e nome do autor
 * - Conteúdo da mensagem (texto e/ou imagem)
 * - Timestamp
 * - Reações
 * - Menu de ações (editar, deletar, fixar, responder)
 */
export default function MessageBubble({
  message,
  currentUserId,
  onEdit,
  onDelete,
  onTogglePin,
  onReact,
  onRemoveReaction,
  uploadMessageImage,
  sendMessage,
  isInThread = false, // Se true, não mostra botão de responder (evita recursão infinita)
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isOwnMessage = message.author_id === currentUserId;
  const isDeleted = message.is_deleted;

  // Emojis rápidos para reações
  const quickEmojis = ['❤️', '😂', '😮', '😢', '😡', '🔥', '👍', '👎'];

  // Agrupar reações por emoji
  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {}) || {};

  const handleVibration = (duration = 30) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
    handleVibration();
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Mensagem não pode estar vazia');
      return;
    }

    await onEdit(message.id, editContent);
    setIsEditing(false);
    handleVibration(50);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja deletar esta mensagem?')) {
      await onDelete(message.id);
      setShowMenu(false);
      handleVibration([50, 100]);
    }
  };

  const handleTogglePin = async () => {
    await onTogglePin(message.id, !message.is_pinned);
    setShowMenu(false);
    handleVibration(50);
  };

  const handleReaction = async (emoji) => {
    // Verificar se usuário já reagiu com este emoji
    const existingReaction = message.reactions?.find(
      (r) => r.user_id === currentUserId && r.emoji === emoji
    );

    if (existingReaction) {
      // Remover reação
      await onRemoveReaction(message.id, emoji);
    } else {
      // Adicionar reação
      await onReact(message.id, emoji);
    }

    setShowReactionPicker(false);
    handleVibration(30);
  };

  // Se mensagem foi deletada
  if (isDeleted) {
    return (
      <motion.div
        id={`message-${message.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 px-4 py-3 opacity-50"
      >
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            🗑️ Mensagem deletada
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      id={`message-${message.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        message.is_pinned ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {message.author?.avatar_url ? (
          <img
            src={message.author.avatar_url}
            alt={message.author.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {message.author?.full_name?.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {/* Header: Nome e Timestamp */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-semibold text-textPrimary dark:text-white text-sm">
            {message.author?.nickname || message.author?.full_name || 'Anônimo'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
          {message.is_edited && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              (editado)
            </span>
          )}
          {message.is_pinned && (
            <Pin className="w-3 h-3 text-yellow-600 dark:text-yellow-500" />
          )}
        </div>

        {/* Modo de Edição */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 border-primary focus:ring-2 focus:ring-primary/20 resize-none text-sm"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Salvar
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-textPrimary dark:text-gray-200 rounded-lg text-sm font-medium flex items-center gap-1"
              >
                <XIcon className="w-4 h-4" />
                Cancelar
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {/* Conteúdo da Mensagem */}
            <p className="text-textPrimary dark:text-gray-200 text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>

            {/* Imagem (se houver) */}
            {message.image_url && (
              <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
                <img
                  src={message.image_url}
                  alt="Imagem da mensagem"
                  className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.image_url, '_blank')}
                />
              </div>
            )}

            {/* Reações */}
            {Object.keys(groupedReactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(groupedReactions).map(([emoji, reactions]) => {
                  const userReacted = reactions.some(
                    (r) => r.user_id === currentUserId
                  );

                  return (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReaction(emoji)}
                      className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        flex items-center gap-1 transition-colors
                        ${
                          userReacted
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300'
                        }
                      `}
                      title={reactions.map((r) => r.user?.full_name).join(', ')}
                    >
                      <span>{emoji}</span>
                      <span className="text-textPrimary dark:text-gray-200">
                        {reactions.length}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Botões de Ação Rápida */}
            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Adicionar Reação */}
              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowReactionPicker(!showReactionPicker);
                    handleVibration();
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Reagir"
                >
                  <Smile className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </motion.button>

                {/* Picker de Reações */}
                <AnimatePresence>
                  {showReactionPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-1 z-10"
                    >
                      {quickEmojis.map((emoji) => (
                        <motion.button
                          key={emoji}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleReaction(emoji)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botão Responder não é mostrado aqui, a thread aparece abaixo */}
            </div>
          </>
        )}

        {/* Thread View - Só mostra se não estiver dentro de uma thread */}
        {!isInThread && !isDeleted && !isEditing && (
          <ThreadView
            parentMessage={message}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
            onReact={onReact}
            onRemoveReaction={onRemoveReaction}
            uploadMessageImage={uploadMessageImage}
            sendMessage={sendMessage}
          />
        )}
      </div>

      {/* Menu de Ações (3 pontinhos) */}
      {!isEditing && (
        <div className="relative flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowMenu(!showMenu);
              handleVibration();
            }}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <>
                {/* Backdrop para fechar menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20 min-w-[160px]"
                >
                  {isOwnMessage && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm text-textPrimary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleTogglePin}
                    className="w-full px-4 py-2 text-left text-sm text-textPrimary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    {message.is_pinned ? (
                      <>
                        <PinOff className="w-4 h-4" />
                        Desafixar
                      </>
                    ) : (
                      <>
                        <Pin className="w-4 h-4" />
                        Fixar como argumento
                      </>
                    )}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

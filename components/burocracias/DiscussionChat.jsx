'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Camera,
  Smile,
  Loader2,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import MessageBubble from './MessageBubble';
import { useDiscussionMessages } from '@/hooks/useDiscussionMessages';
import { useDiscussionDraft } from '@/hooks/useDiscussionDraft';
import { compressImage } from '@/lib/utils/imageCompression';

/**
 * Componente principal da área de chat
 * - Lista de mensagens
 * - Input de enviar mensagem
 * - Upload de imagem
 * - Scroll automático
 */
export default function DiscussionChat({ discussionId, currentUserId }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const {
    messages,
    loading,
    sending,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePinMessage,
    addReaction,
    removeReaction,
    uploadMessageImage,
    messagesEndRef,
    scrollToBottom,
  } = useDiscussionMessages(discussionId);

  // Hook de rascunhos automáticos
  const {
    draft: messageContent,
    setDraft: setMessageContent,
    isSaving: isSavingDraft,
    lastSaved,
    clearDraft,
  } = useDiscussionDraft(discussionId);

  // Scroll automático ao carregar mensagens
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, [loading, scrollToBottom]);

  const handleVibration = (duration = 30) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Comprimir imagem
      const compressed = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
      });

      setImageFile(compressed);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast.error('Erro ao processar imagem');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageContent.trim() && !imageFile) {
      toast.error('Digite uma mensagem ou adicione uma imagem');
      return;
    }

    let imageUrl = null;

    try {
      // Upload de imagem se houver
      if (imageFile) {
        const { url, error: uploadError } = await uploadMessageImage(imageFile);
        if (uploadError) {
          toast.error('Erro ao fazer upload da imagem');
          return;
        }
        imageUrl = url;
      }

      // Enviar mensagem
      const { error } = await sendMessage(messageContent, imageUrl);

      if (error) {
        toast.error('Erro ao enviar mensagem');
        return;
      }

      // Limpar inputs e rascunho
      setMessageContent('');
      await clearDraft();
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Vibração de sucesso
      handleVibration(50);

      // Scroll para o final
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleEdit = async (messageId, newContent) => {
    const { error } = await editMessage(messageId, newContent);
    if (error) {
      toast.error('Erro ao editar mensagem');
    } else {
      toast.success('Mensagem editada!');
    }
  };

  const handleDelete = async (messageId) => {
    const { error } = await deleteMessage(messageId);
    if (error) {
      toast.error('Erro ao deletar mensagem');
    } else {
      toast.success('Mensagem deletada!');
    }
  };

  const handleTogglePin = async (messageId, isPinned) => {
    const { error } = await togglePinMessage(messageId, isPinned);
    if (error) {
      toast.error('Erro ao fixar mensagem');
    } else {
      toast.success(isPinned ? 'Argumento fixado!' : 'Argumento desafixado!');
    }
  };

  const handleReaction = async (messageId, emoji) => {
    const { error } = await addReaction(messageId, emoji);
    if (error) {
      // Pode ser erro de duplicata, ignorar silenciosamente
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId, emoji) => {
    const { error } = await removeReaction(messageId, emoji);
    if (error) {
      console.error('Error removing reaction:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-textSecondary dark:text-gray-400">
          Carregando conversa...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Lista de Mensagens */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 400px)', minHeight: '400px' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-textPrimary dark:text-white mb-2">
              Nenhuma mensagem ainda
            </h3>
            <p className="text-textSecondary dark:text-gray-400 text-center max-w-md">
              Seja o primeiro a contribuir nesta discussão!
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                  onReact={handleReaction}
                  onRemoveReaction={handleRemoveReaction}
                  uploadMessageImage={uploadMessageImage}
                  sendMessage={sendMessage}
                />
              ))}
            </AnimatePresence>

            {/* Elemento invisível para scroll */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input de Mensagem */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="space-y-3">
          {/* Preview da Imagem */}
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative inline-block"
            >
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-32 rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  handleVibration();
                  handleRemoveImage();
                }}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Input e Botões */}
          <div className="flex items-end gap-2">
            {/* Botão de Upload de Imagem */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleVibration();
                fileInputRef.current?.click();
              }}
              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              disabled={sending}
            >
              <Camera className="w-5 h-5 text-textSecondary dark:text-gray-400" />
            </motion.button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Textarea de Mensagem */}
            <div className="flex-1 relative">
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyDown={(e) => {
                  // Enviar com Enter (sem Shift)
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-textPrimary dark:text-gray-200 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                rows={1}
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
                disabled={sending}
              />
            </div>

            {/* Botão Enviar */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={sending || (!messageContent.trim() && !imageFile)}
              className={`
                p-3 rounded-xl transition-all
                ${
                  sending || (!messageContent.trim() && !imageFile)
                    ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg'
                }
              `}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </motion.button>
          </div>

          {/* Dica de Atalho e Status do Rascunho */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <p>Pressione Enter para enviar • Shift + Enter para nova linha</p>
            {isSavingDraft && <p className="text-primary">Salvando rascunho...</p>}
            {!isSavingDraft && lastSaved && messageContent && (
              <p>Rascunho salvo ✓</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

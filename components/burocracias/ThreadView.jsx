'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Send,
  Loader2,
  X,
  Camera,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MessageBubble from './MessageBubble';
import { toast } from 'sonner';
import { compressImage } from '@/lib/utils/imageCompression';

/**
 * Componente de Thread (conversa aninhada)
 * Permite conversas dentro de mensagens específicas
 */
export default function ThreadView({
  parentMessage,
  currentUserId,
  onEdit,
  onDelete,
  onTogglePin,
  onReact,
  onRemoveReaction,
  uploadMessageImage,
  sendMessage,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [threadMessages, setThreadMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const supabase = createClient();
  const fileInputRef = useRef(null);

  const threadCount = parentMessage.thread_message_count || 0;

  // Carregar mensagens da thread
  const loadThreadMessages = async () => {
    if (!parentMessage.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discussion_messages')
        .select(`
          *,
          author:profiles!discussion_messages_author_id_fkey(
            id,
            full_name,
            nickname,
            avatar_url
          ),
          reactions:discussion_reactions(
            id,
            emoji,
            user_id,
            user:profiles!discussion_reactions_user_id_fkey(
              id,
              full_name,
              nickname
            )
          )
        `)
        .eq('parent_message_id', parentMessage.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setThreadMessages(data || []);
    } catch (err) {
      console.error('Error loading thread messages:', err);
      toast.error('Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar thread quando expandir
  useEffect(() => {
    if (isExpanded && threadMessages.length === 0) {
      loadThreadMessages();
    }
  }, [isExpanded]);

  // Subscrição Realtime para novas mensagens na thread
  useEffect(() => {
    if (!isExpanded || !parentMessage.id) return;

    const channel = supabase
      .channel(`thread-${parentMessage.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_messages',
          filter: `parent_message_id=eq.${parentMessage.id}`,
        },
        async (payload) => {
          // Carregar mensagem completa com autor
          const { data: newMessage } = await supabase
            .from('discussion_messages')
            .select(`
              *,
              author:profiles!discussion_messages_author_id_fkey(
                id,
                full_name,
                nickname,
                avatar_url
              ),
              reactions:discussion_reactions(
                id,
                emoji,
                user_id,
                user:profiles!discussion_reactions_user_id_fkey(
                  id,
                  full_name,
                  nickname
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setThreadMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isExpanded, parentMessage.id, supabase]);

  const handleVibration = (duration = 30) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    handleVibration();
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
      });

      setImageFile(compressed);

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

  const handleSendReply = async (e) => {
    e.preventDefault();

    if (!replyContent.trim() && !imageFile) {
      toast.error('Digite uma resposta ou adicione uma imagem');
      return;
    }

    setSending(true);

    try {
      let imageUrl = null;

      // Upload de imagem se houver
      if (imageFile && uploadMessageImage) {
        const { url, error: uploadError } = await uploadMessageImage(imageFile);
        if (uploadError) {
          toast.error('Erro ao fazer upload da imagem');
          setSending(false);
          return;
        }
        imageUrl = url;
      }

      // Enviar mensagem na thread
      const { error } = await sendMessage(
        replyContent,
        imageUrl,
        parentMessage.id // parent_message_id
      );

      if (error) {
        toast.error('Erro ao enviar resposta');
        return;
      }

      // Limpar inputs
      setReplyContent('');
      setImageFile(null);
      setImagePreview(null);
      setShowReplyInput(false);

      handleVibration(50);
      toast.success('Resposta enviada!');

      // Recarregar thread
      await loadThreadMessages();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setSending(false);
    }
  };

  if (threadCount === 0 && !isExpanded) {
    return null; // Não mostra nada se não tem respostas e não está expandido
  }

  return (
    <div className="ml-8 mt-2 border-l-2 border-primary/30 pl-4">
      {/* Header da Thread */}
      <button
        onClick={toggleExpand}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-2"
      >
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        <MessageCircle className="w-4 h-4" />
        <span className="font-medium">
          {threadCount === 0
            ? 'Nenhuma resposta ainda'
            : threadCount === 1
            ? '1 resposta'
            : `${threadCount} respostas`}
        </span>
      </button>

      {/* Conteúdo da Thread */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}

            {/* Mensagens da Thread */}
            {!loading && threadMessages.length > 0 && (
              <div className="space-y-0 mb-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg overflow-hidden">
                {threadMessages.map((message) => (
                  <div key={message.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <MessageBubble
                      message={message}
                      currentUserId={currentUserId}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onTogglePin={onTogglePin}
                      onReact={onReact}
                      onRemoveReaction={onRemoveReaction}
                      isInThread={true}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && threadMessages.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                Nenhuma resposta ainda. Seja o primeiro!
              </div>
            )}

            {/* Botão Responder */}
            {!showReplyInput && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowReplyInput(true);
                  handleVibration();
                }}
                className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium"
              >
                💬 Responder nesta thread
              </motion.button>
            )}

            {/* Input de Resposta */}
            <AnimatePresence>
              {showReplyInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <form onSubmit={handleSendReply} className="space-y-2">
                    {/* Preview da Imagem */}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-24 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      {/* Botão de Imagem */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        disabled={sending}
                      >
                        <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />

                      {/* Textarea */}
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Responder..."
                        className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        rows={2}
                        disabled={sending}
                      />

                      {/* Botão Enviar */}
                      <button
                        type="submit"
                        disabled={sending || (!replyContent.trim() && !imageFile)}
                        className={`
                          p-2 rounded-lg transition-all
                          ${
                            sending || (!replyContent.trim() && !imageFile)
                              ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                              : 'bg-primary hover:bg-primary/90'
                          }
                        `}
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Botão Cancelar */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyInput(false);
                        setReplyContent('');
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      disabled={sending}
                    >
                      Cancelar
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

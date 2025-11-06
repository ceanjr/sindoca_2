'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Smile,
  Music,
  Sparkles,
  MessageCircle,
  Star,
  Heart,
  Coffee,
  Book,
  Sun,
  Moon,
  Zap,
  Award,
  Target,
  Users,
  Laugh,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getUserWorkspaces } from '@/lib/api/workspace';
import AddReasonModal from '@/components/ui/AddReasonModal';

const iconMap = {
  Smile,
  Music,
  Sparkles,
  MessageCircle,
  Star,
  Heart,
  Coffee,
  Book,
  Sun,
  Moon,
  Zap,
  Award,
  Target,
  Users,
  Laugh,
};

export default function LoveReasonsSection({ id }) {
  const router = useRouter();
  const { user } = useAuth();
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealedSecrets, setRevealedSecrets] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const ADMIN_EMAIL = 'celiojunior0110@gmail.com';
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (user) {
      loadReasons();
    }
  }, [user]);

  const loadReasons = async () => {
    try {
      const supabase = createClient();

      // Get user's workspace
      const workspacesData = await getUserWorkspaces(user.id);
      if (workspacesData.length === 0) {
        setLoading(false);
        return;
      }

      const wId = workspacesData[0].workspace_id;
      setWorkspaceId(wId);

      // Load love reasons from content table
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('workspace_id', wId)
        .eq('type', 'love_reason')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReasons = data.map((item) => ({
        id: item.id,
        author_id: item.author_id,
        subject: item.data?.subject || 'sindy',
        reason: item.data?.reason || item.data?.text || '',
        description: item.data?.description || item.data?.secret || '',
        icon: item.data?.icon || 'Heart',
        category: item.data?.category || 'Geral',
      }));

      setReasons(formattedReasons);
    } catch (error) {
      console.error('Error loading love reasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSecret = (index) => {
    setRevealedSecrets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleAddReason = async (newReason) => {
    try {
      const supabase = createClient();

      if (editingReason) {
        // Update existing reason
        const { error } = await supabase
          .from('content')
          .update({
            data: {
              subject: newReason.subject,
              reason: newReason.reason,
              description: newReason.description,
              icon: 'Heart',
              category: 'Geral',
            },
          })
          .eq('id', editingReason.id);

        if (error) throw error;
        setEditingReason(null);
      } else {
        // Insert new reason
        const { error } = await supabase
          .from('content')
          .insert([
            {
              workspace_id: workspaceId,
              author_id: user.id,
              type: 'love_reason',
              data: {
                subject: newReason.subject,
                reason: newReason.reason,
                description: newReason.description,
                icon: 'Heart',
                category: 'Geral',
              },
            },
          ])
          .select();

        if (error) throw error;
      }

      // Reload reasons to get the new one
      await loadReasons();
    } catch (error) {
      console.error('Error adding/updating reason:', error);
      throw error;
    }
  };

  const handleEditReason = (reason) => {
    setEditingReason(reason);
    setIsModalOpen(true);
  };

  const handleDeleteReason = async (reasonId) => {
    if (!confirm('Tem certeza que deseja apagar esta razão?')) {
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', reasonId);

      if (error) throw error;

      // Reload reasons
      await loadReasons();
    } catch (error) {
      console.error('Error deleting reason:', error);
      alert('Erro ao apagar razão. Tente novamente.');
    }
  };

  const canEditOrDelete = (reason) => {
    return isAdmin || reason.author_id === user?.id;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReason(null);
  };

  return (
    <section id={id} className="min-h-screen px-4 py-20" ref={ref}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <Heart className="text-primary" size={48} />
          </motion.div>
          <h2 className="font-heading text-4xl md:text-6xl font-bold text-textPrimary mb-4">
            O Que Eu <span className="text-primary">Amo</span> em Você
          </h2>
          <p className="text-lg text-textSecondary">
            Entre razões e emoções sem saídas, como você, como você{' '}
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
        {!loading && reasons.length === 0 && (
          <div className="text-center py-20">
            <Heart className="mx-auto text-textTertiary mb-6" size={64} />
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Nenhuma razão ainda
            </h3>
            <p className="text-textSecondary mb-8 max-w-md mx-auto">
              Comece a adicionar as razões pelas quais você ama alguém especial
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Adicionar Primeira Razão
            </motion.button>
          </div>
        )}

        {/* Lista Minimalista */}
        {!loading && reasons.length > 0 && (
          <>
            {/* Add Button */}
            <div className="mb-8 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Adicionar Razão
              </motion.button>
            </div>

            <div className="space-y-4">
              {reasons.map((item, index) => {
                const Icon = iconMap[item.icon] || Heart;
                const isRevealed = revealedSecrets.has(index);
                const subjectImage =
                  item.subject === 'junior'
                    ? '/images/eu.png'
                    : '/images/sindy.png';
                const subjectName =
                  item.subject === 'junior' ? 'Júnior' : 'Sindy';

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group"
                  >
                    <motion.div
                      whileHover={{ x: 8 }}
                      onClick={() => toggleSecret(index)}
                      className="bg-surface rounded-2xl p-6 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 cursor-pointer border-l-4 border-primary"
                    >
                      <div className="flex items-start gap-4 relative">
                        <div className="flex flex-col gap-4">
                          {/* Subject Avatar */}
                          <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                            <Image
                              src={subjectImage}
                              alt={subjectName}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                          {isRevealed && canEditOrDelete(item) && (
                            <div
                              className={`flex flex-col gap-2 items-center `}
                            >
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditReason(item);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 transition-colors"
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteReason(item.id);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 transition-colors"
                                title="Apagar"
                              >
                                <Trash2 size={16} />
                              </motion.button>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Main text */}
                          <p className="text-textPrimary text-lg font-medium mb-1">
                            {item.reason}
                          </p>

                          {/* Subject name badge */}
                          <span className="inline-block text-xs text-textTertiary font-semibold uppercase tracking-wider">
                            {subjectName}
                          </span>

                          {/* Description message or actions for cards without description */}
                          <AnimatePresence>
                            {isRevealed && (
                              <motion.div
                                initial={{
                                  opacity: 0,
                                  height: 0,
                                  marginTop: 0,
                                }}
                                animate={{
                                  opacity: 1,
                                  height: 'auto',
                                  marginTop: 12,
                                }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-gradient-to-r bg-primary/10 rounded-xl p-4 border-l-2 border-primary">
                                  {item.description && (
                                    <p className="text-textSecondary italic text-sm mb-3">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Indicator */}
                        <motion.div
                          animate={{ rotate: isRevealed ? 90 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex-shrink-0 text-textTertiary group-hover:text-primary transition-colors"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M7.5 5L12.5 10L7.5 15"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Hint */}
        {!loading && reasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-textTertiary text-sm">
              💡 Clique em cada item com descrição para revelar mais detalhes
            </p>
          </motion.div>
        )}

        {/* Add Reason Modal */}
        <AddReasonModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAdd={handleAddReason}
          editingReason={editingReason}
        />
      </div>
    </section>
  );
}

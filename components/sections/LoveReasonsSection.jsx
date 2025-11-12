'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import { Heart, Plus, Pencil, Trash2, Shuffle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getUserWorkspaces } from '@/lib/api/workspace';
import { useConfirm } from '@/hooks/useConfirm';
import ConfirmDialog from '../ui/ConfirmDialog';
import ReactableContent from '../ui/ReactableContent';
import ReactionDisplay from '../ui/ReactionDisplay';
import { toast } from 'sonner';
import AddReasonModal from '@/components/ui/AddReasonModal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { fetchJSON } from '@/lib/utils/fetchWithTimeout';

const REASONS_PER_PAGE = 9;
const MIN_REASONS_FOR_RANDOM = 7;

export default function LoveReasonsSection({ id }) {
  const { user } = useAuth();
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealedSecrets, setRevealedSecrets] = useState(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReason, setEditingReason] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  // New state for tabs and pagination
  const [activeTab, setActiveTab] = useState('all');
  const [visibleCount, setVisibleCount] = useState(REASONS_PER_PAGE);
  const [randomReason, setRandomReason] = useState(null);
  const [showRandomModal, setShowRandomModal] = useState(false);

  const {
    isOpen,
    loading: confirmLoading,
    config,
    confirm,
    handleConfirm,
    handleCancel,
  } = useConfirm();
  const { showLocalNotification, isGranted } = usePushNotifications();

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
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

      // Get partner ID
      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', wId);

      const partner = members?.find((m) => m.user_id !== user.id);
      if (partner) {
        setPartnerId(partner.user_id);

        // Get partner profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, nickname')
          .eq('id', partner.user_id)
          .single();

        setPartnerProfile(profile);
      }

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

  // Filter reasons by active tab
  const filteredReasons = useMemo(() => {
    if (activeTab === 'all') return reasons;
    return reasons.filter((r) => r.subject === activeTab);
  }, [reasons, activeTab]);

  // Visible reasons with pagination
  const visibleReasons = useMemo(() => {
    return filteredReasons.slice(0, visibleCount);
  }, [filteredReasons, visibleCount]);

  // Count reasons per subject
  const reasonCounts = useMemo(() => {
    return {
      all: reasons.length,
      sindy: reasons.filter((r) => r.subject === 'sindy').length,
      junior: reasons.filter((r) => r.subject === 'junior').length,
    };
  }, [reasons]);

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
        toast.success('Razão atualizada!');
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
        toast.success('Nova razão adicionada!');

        // Send push notification to partner
        if (partnerId && partnerProfile) {
          try {
            const result = await fetchJSON('/api/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              timeout: 10000, // 10 seconds timeout
              body: JSON.stringify({
                recipientUserId: partnerId,
                title: `${partnerProfile.full_name} adicionou uma nova razão para te aguentar!`,
                body: `Corre antes que ${
                  partnerProfile.full_name === 'Sindy' ? 'ela' : 'ele'
                } mude de ideia!`,
                icon: '/icon-192x192.png',
                tag: 'new-reason',
                data: { url: '/razoes' },
              }),
            });

            console.log('Push notification sent:', result);
          } catch (error) {
            console.error('Error sending push notification:', error);
            // Don't throw - notification sending is non-critical
          }
        }
      }

      // Reload reasons
      await loadReasons();
    } catch (error) {
      console.error('Error adding/updating reason:', error);
      toast.error('Erro ao salvar razão. Tente novamente.');
      throw error;
    }
  };

  const handleEditReason = (reason) => {
    setEditingReason(reason);
    setIsModalOpen(true);
  };

  const handleDeleteReason = async (reasonId) => {
    const confirmed = await confirm({
      title: 'Apagar razão?',
      message:
        'Tem certeza que deseja apagar esta razão? Esta ação não pode ser desfeita.',
      confirmText: 'Apagar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', reasonId);

      if (error) throw error;

      await loadReasons();
      toast.success('Razão apagada com sucesso');
    } catch (error) {
      console.error('Error deleting reason:', error);
      toast.error('Erro ao apagar razão. Tente novamente.');
    }
  };

  const canEditOrDelete = (reason) => {
    return isAdmin || reason.author_id === user?.id;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReason(null);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + REASONS_PER_PAGE);
  };

  const handleRandomReason = () => {
    if (filteredReasons.length === 0) return;

    const random =
      filteredReasons[Math.floor(Math.random() * filteredReasons.length)];
    setRandomReason(random);
    setShowRandomModal(true);
  };

  const hasMoreReasons = visibleCount < filteredReasons.length;
  const showRandomButton = filteredReasons.length >= MIN_REASONS_FOR_RANDOM;

  return (
    <section id={id} className="min-h-screen px-4 py-20" ref={ref}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <Heart className="text-primary" size={48} fill="currentColor" />
          </motion.div>
          <h2 className="font-heading text-4xl md:text-6xl font-bold text-textPrimary mb-4">
            O Que Eu <span className="text-primary">Amo</span> em Você
          </h2>
          <p className="text-lg text-textSecondary">
            Entre razões e emoções sem saídas, como você, como você
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
            <p className="text-textSecondary mt-4">Carregando razões...</p>
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

        {/* Content */}
        {!loading && reasons.length > 0 && (
          <>
            {/* Action Buttons Row */}
            <div className="mb-8 flex flex-col justify-center items-center gap-4">
              {/* Random Reason Button - Emergency Emotional Support */}
              {showRandomButton && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRandomReason}
                  className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2 relative overflow-hidden group"
                >
                  <span>Botão de Emergência Emocional 🆘</span>
                </motion.button>
              )}
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

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-2 justify-center mb-8 flex-wrap"
            >
              <TabButton
                active={activeTab === 'all'}
                onClick={() => {
                  setActiveTab('all');
                  setVisibleCount(REASONS_PER_PAGE);
                }}
                count={reasonCounts.all}
              >
                Todas
              </TabButton>
              <TabButton
                active={activeTab === 'sindy'}
                onClick={() => {
                  setActiveTab('sindy');
                  setVisibleCount(REASONS_PER_PAGE);
                }}
                count={reasonCounts.sindy}
              >
                Sindy
              </TabButton>
              <TabButton
                active={activeTab === 'junior'}
                onClick={() => {
                  setActiveTab('junior');
                  setVisibleCount(REASONS_PER_PAGE);
                }}
                count={reasonCounts.junior}
              >
                Júnior
              </TabButton>
            </motion.div>

            {/* Reasons List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {visibleReasons.map((item, index) => {
                  const isRevealed = revealedSecrets.has(item.id);
                  const subjectImage =
                    item.subject === 'junior'
                      ? '/images/eu.png'
                      : '/images/sindy.png';
                  const subjectName =
                    item.subject === 'junior' ? 'Júnior' : 'Sindy';

                  return (
                    <ReactableContent
                      key={item.id}
                      contentId={item.id}
                      contentType="love_reason"
                      contentTitle={item.reason}
                      authorId={item.author_id}
                      url="/razoes"
                    >
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="group"
                      >
                        <motion.div
                          whileHover={{ x: 8 }}
                          onClick={() => toggleSecret(item.id)}
                          className="bg-surface rounded-2xl p-6 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 cursor-pointer border-l-4 border-primary"
                        >
                        <div className="flex items-start gap-4 relative">
                          <div className="flex flex-col gap-4">
                            {/* Subject Avatar - Optimized with priority */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                              <Image
                                src={subjectImage}
                                alt={subjectName}
                                width={48}
                                height={48}
                                className="object-cover"
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+"
                              />
                            </div>

                            {/* Edit/Delete buttons */}
                            {isRevealed && canEditOrDelete(item) && (
                              <div className="flex flex-col gap-2 items-center">
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

                            {/* Description */}
                            <AnimatePresence>
                              {isRevealed && item.description && (
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
                                    <p className="text-textSecondary italic text-sm">
                                      {item.description}
                                    </p>
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
                        
                        {/* Reaction Display */}
                        <div className="mt-3 px-1">
                          <ReactionDisplay contentId={item.id} />
                        </div>
                      </motion.div>
                      </motion.div>
                    </ReactableContent>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Load More Button */}
            {hasMoreReasons && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 text-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoadMore}
                  className="px-8 py-4 bg-surface hover:bg-surfaceAlt text-textPrimary font-semibold rounded-xl shadow-soft-md transition-all duration-300 inline-flex items-center gap-2 border-2 border-primary/20"
                >
                  <Heart size={20} className="text-primary" />
                  Ver mais {filteredReasons.length - visibleCount} razões
                </motion.button>
              </motion.div>
            )}

            {/* Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-textTertiary text-sm">
                💡 Clique em cada item com descrição para revelar mais detalhes
              </p>
            </motion.div>
          </>
        )}

        {/* Random Reason Modal */}
        <AnimatePresence>
          {showRandomModal && randomReason && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowRandomModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border-4 border-primary relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-primary rounded-full p-4 shadow-lg"
                  >
                    <Heart
                      size={32}
                      className="text-white"
                      fill="currentColor"
                    />
                  </motion.div>
                </div>

                <div className="text-center mt-8">
                  <h3 className="text-2xl font-bold text-textPrimary mb-4">
                    🆘 Suporte Emocional Ativado
                  </h3>

                  <div className="mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-primary">
                        <Image
                          src={
                            randomReason.subject === 'junior'
                              ? '/images/eu.png'
                              : '/images/sindy.png'
                          }
                          alt={
                            randomReason.subject === 'junior'
                              ? 'Júnior'
                              : 'Sindy'
                          }
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <p className="text-xl font-medium text-textPrimary mb-2">
                      {randomReason.reason}
                    </p>
                    {randomReason.description && (
                      <p className="text-textSecondary italic">
                        "{randomReason.description}"
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRandomReason}
                      className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2"
                    >
                      <Shuffle size={18} />
                      Outra Razão
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowRandomModal(false)}
                      className="px-6 py-3 bg-surface text-textPrimary font-semibold rounded-xl shadow-soft-md"
                    >
                      Fechar
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Reason Modal */}
        <AddReasonModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAdd={handleAddReason}
          editingReason={editingReason}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={isOpen}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          title={config.title}
          message={config.message}
          confirmText={config.confirmText}
          cancelText={config.cancelText}
          variant={config.variant}
          loading={confirmLoading}
        />
      </div>
    </section>
  );
}

// Tab Button Component
function TabButton({ active, onClick, count, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
        active
          ? 'bg-primary text-white shadow-soft-md'
          : 'bg-surface text-textSecondary hover:bg-surfaceAlt hover:text-textPrimary'
      }`}
    >
      {children} <span className="ml-1">({count})</span>
    </motion.button>
  );
}

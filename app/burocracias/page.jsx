'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DiscussionCard from '@/components/burocracias/DiscussionCard';
import DiscussionSheet from '@/components/burocracias/DiscussionSheet';
import { useDiscussions } from '@/hooks/useDiscussions';
import { toast } from 'sonner';

/**
 * Filtros de status disponíveis
 */
const statusFilters = [
  { value: null, label: 'Todas', icon: '🔥' },
  { value: 'em_andamento', label: 'Em andamento', icon: '🔥' },
  { value: 'resolvida', label: 'Resolvidas', icon: '✅' },
  { value: 'pausada', label: 'Pausadas', icon: '⏸️' },
  { value: 'acordo_fechado', label: 'Acordos', icon: '🤝' },
];

/**
 * Página principal de Burocracias a Dois
 */
export default function BurocraciasPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const {
    discussions,
    loading,
    error,
    createDiscussion,
    uploadImage,
    refresh,
  } = useDiscussions(selectedStatus);

  const handleCreateDiscussion = async (data) => {
    const { error: createError } = await createDiscussion(data);

    if (createError) {
      toast.error('Erro ao criar discussão');
      throw new Error(createError);
    }

    // Vibração de sucesso
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  };

  const handleVibration = (duration = 30) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background via-lavender/5 to-primary/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-lavender mb-3">
              🧾 Burocracias a Dois
            </h1>
            <p className="text-textSecondary dark:text-gray-400 max-w-2xl mx-auto">
              Discussões sérias, quase sérias e zero sérias — cuidadosamente
              documentadas
            </p>
          </motion.div>

          {/* Botão Adicionar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-6"
          >
            <motion.button
              onClick={() => {
                handleVibration();
                setIsSheetOpen(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar discussão</span>
            </motion.button>
          </motion.div>

          {/* Filtros de Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-x-auto"
          >
            <div className="flex gap-2 pb-2 min-w-max justify-center">
              {statusFilters.map((filter) => (
                <motion.button
                  key={filter.value || 'all'}
                  onClick={() => {
                    handleVibration();
                    setSelectedStatus(filter.value);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap
                    ${
                      selectedStatus === filter.value
                        ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 text-textPrimary dark:text-gray-200 border-2 border-gray-200 dark:border-gray-700 hover:border-primary'
                    }
                  `}
                >
                  <span className="mr-1">{filter.icon}</span>
                  {filter.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-textSecondary dark:text-gray-400">
                Carregando discussões...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-2xl p-6 text-center"
            >
              <p className="text-red-700 dark:text-red-400 font-medium mb-2">
                Erro ao carregar discussões
              </p>
              <p className="text-sm text-red-600 dark:text-red-500 mb-4">
                {error}
              </p>
              <motion.button
                onClick={() => {
                  handleVibration();
                  refresh();
                }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium"
              >
                Tentar novamente
              </motion.button>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !error && discussions.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center shadow-soft-lg"
            >
              <FileText className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-textPrimary dark:text-white mb-2">
                {selectedStatus
                  ? `Nenhuma discussão ${
                      statusFilters.find((f) => f.value === selectedStatus)
                        ?.label.toLowerCase() || ''
                    }`
                  : 'Nenhuma burocracia cadastrada ainda'}
              </h3>
              <p className="text-textSecondary dark:text-gray-400 mb-6">
                {selectedStatus
                  ? 'Tente selecionar outro filtro'
                  : 'Que tal iniciar a primeira treta diplomática?'}
              </p>
              {!selectedStatus && (
                <motion.button
                  onClick={() => {
                    handleVibration();
                    setIsSheetOpen(true);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full shadow-lg"
                >
                  <Plus className="inline w-5 h-5 mr-2" />
                  Criar primeira discussão
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Lista de Discussões */}
          {!loading && !error && discussions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
                {discussions.map((discussion, index) => (
                  <motion.div
                    key={discussion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
                    }}
                    exit={{ opacity: 0, x: -20 }}
                    layout
                  >
                    <DiscussionCard discussion={discussion} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Modal de Criar Discussão */}
        <DiscussionSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onSubmit={handleCreateDiscussion}
          uploadImage={uploadImage}
        />
      </div>
    </ProtectedRoute>
  );
}

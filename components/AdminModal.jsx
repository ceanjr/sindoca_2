'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Loader2 } from 'lucide-react';
import { usePageConfig } from '@/hooks/usePageConfig';
import { toast } from 'sonner';

/**
 * Admin Modal for managing page visibility
 * Only visible to admin users
 */
export default function AdminModal({ isOpen, onClose }) {
  const { pageConfig, updatePageStatus, loading } = usePageConfig();
  const [updating, setUpdating] = useState({});

  const handleToggle = async (pageId, currentStatus) => {
    setUpdating((prev) => ({ ...prev, [pageId]: true }));

    const success = await updatePageStatus(pageId, !currentStatus);

    if (!success) {
      toast.error('Erro ao atualizar status da página');
    } else {
      toast.success(`Página ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`);
    }

    setUpdating((prev) => ({ ...prev, [pageId]: false }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings size={24} />
                    <h2 className="text-2xl font-bold">
                      Configuração de Páginas
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <p className="text-white/80 text-sm mt-2">
                  Ative ou desative o acesso às páginas do site
                </p>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pageConfig.map((page) => (
                      <div
                        key={page.page_id}
                        className="flex items-center justify-between p-4 bg-surfaceAlt rounded-xl hover:bg-surface transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-textPrimary">
                            {page.label}
                          </h3>
                          <p className="text-sm text-textSecondary">
                            {page.path}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            handleToggle(page.page_id, page.is_active)
                          }
                          disabled={updating[page.page_id]}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            page.is_active
                              ? 'bg-primary'
                              : 'bg-gray-300'
                          } ${updating[page.page_id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="sr-only">
                            Ativar {page.label}
                          </span>
                          {updating[page.page_id] ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2
                                className="animate-spin text-white"
                                size={16}
                              />
                            </div>
                          ) : (
                            <motion.span
                              layout
                              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                                page.is_active
                                  ? 'translate-x-7'
                                  : 'translate-x-1'
                              }`}
                            />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-surfaceAlt">
                <p className="text-xs text-textSecondary text-center">
                  💡 Páginas desativadas aparecerão com ícones disabled na
                  navegação
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

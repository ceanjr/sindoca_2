'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface LeaveWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
  workspaceName: string;
}

export default function LeaveWorkspaceModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
}: LeaveWorkspaceModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);

  // Resetar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setConfirmationText('');
      setIsLeaving(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isLeaving) return;
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClose();
  };

  const handleLeave = async () => {
    if (!workspaceId) return;

    if (confirmationText.trim() !== workspaceName.trim()) {
      toast.error('O nome digitado não corresponde ao nome do espaço');
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
      return;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }

    setIsLeaving(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/leave`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to leave workspace');

      toast.success('Você saiu do espaço');

      // Recarregar página após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error leaving workspace:', error);
      toast.error('Erro ao sair do espaço');
      setIsLeaving(false);
    }
  };

  const isConfirmationValid = confirmationText.trim() === workspaceName.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
              }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={24} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-textPrimary">
                      Sair do Espaço
                    </h3>
                    <p className="text-sm text-textSecondary mt-1">
                      Esta ação não pode ser desfeita
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isLeaving}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <X size={20} className="text-textSecondary" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-900 mb-2">
                    Você perderá acesso a:
                  </h4>
                  <ul className="space-y-1 text-sm text-red-800">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      Todo o conteúdo do espaço
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      Fotos, mensagens e arquivos
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                      Histórico de conversas
                    </li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Para confirmar, digite o nome do espaço:
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="font-mono font-semibold text-textPrimary text-center">
                      {workspaceName}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Digite o nome do espaço"
                    disabled={isLeaving}
                    className="w-full px-4 py-3 bg-white rounded-xl border-2 border-gray-200 focus:border-red-500 focus:bg-white transition-all outline-none text-textPrimary disabled:opacity-50 disabled:cursor-not-allowed"
                    autoFocus
                  />
                  {confirmationText && !isConfirmationValid && (
                    <p className="text-xs text-red-600 mt-2">
                      O nome não corresponde. Verifique maiúsculas e minúsculas.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isLeaving}
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-textPrimary font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLeave}
                  disabled={!isConfirmationValid || isLeaving}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLeaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saindo...</span>
                    </>
                  ) : (
                    'Sair do Espaço'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

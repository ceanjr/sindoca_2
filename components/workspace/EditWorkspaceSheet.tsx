'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { WORKSPACE_ICONS, getIconById } from '@/lib/utils/workspaceIcons';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface EditWorkspaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
}

export default function EditWorkspaceSheet({
  isOpen,
  onClose,
  workspaceId,
}: EditWorkspaceSheetProps) {
  const { availableWorkspaces, refreshWorkspaces } = useWorkspace();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('heart');
  const [saving, setSaving] = useState(false);

  const workspace = availableWorkspaces.find((w) => w.id === workspaceId);

  // Carregar dados do workspace
  useEffect(() => {
    console.log('📝 EditWorkspaceSheet useEffect:', {
      isOpen,
      workspaceId,
      workspace: workspace ? { id: workspace.id, name: workspace.name } : null,
    });

    if (workspace) {
      setName(workspace.name);
      setSelectedIcon(workspace.icon || 'heart');
    }
  }, [workspace, isOpen, workspaceId]);

  const handleClose = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClose();
  };

  const handleSave = async () => {
    console.log('🔄 handleSave called with workspaceId:', workspaceId);

    if (!workspaceId || workspaceId === 'undefined') {
      console.error('❌ Invalid workspaceId:', workspaceId);
      toast.error('Erro: workspace inválido');
      return;
    }

    if (!name.trim()) {
      toast.error('Digite um nome para o espaço');
      return;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setSaving(true);

    try {
      const url = `/api/workspaces/${workspaceId}/update`;
      console.log('📡 Fetching:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon: selectedIcon }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to update workspace:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || 'Failed to update workspace');
      }

      toast.success('Espaço atualizado com sucesso!');
      await refreshWorkspaces();
      handleClose();
    } catch (error: any) {
      console.error('Error updating workspace:', error);
      toast.error(error.message || 'Erro ao atualizar espaço');
    } finally {
      setSaving(false);
    }
  };

  // Bloquear scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 35,
              stiffness: 260,
              mass: 0.8,
            }}
            className="fixed left-0 right-0 z-[60] bg-white overflow-hidden"
            style={{
              top: '80px',
              bottom: 'calc(-1 * env(safe-area-inset-bottom))',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.12)',
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 z-10">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2" />

              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-textSecondary" />
                </button>
                <h2 className="text-lg font-semibold text-textPrimary">Editar Espaço</h2>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors disabled:opacity-40"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={24} className="text-primary" />
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="overflow-y-auto h-full"
              style={{
                overscrollBehavior: 'contain',
                paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div className="px-6 py-6 space-y-8">
                {/* Nome do Espaço */}
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Nome do Espaço
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Meu Espaço"
                    maxLength={50}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-primary focus:bg-white transition-all outline-none text-textPrimary"
                  />
                  <p className="text-xs text-textSecondary mt-1">
                    {name.length}/50 caracteres
                  </p>
                </div>

                {/* Ícone do Espaço */}
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-3">
                    Ícone do Espaço
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {WORKSPACE_ICONS.map((iconItem) => {
                      const Icon = iconItem.icon;
                      const isSelected = selectedIcon === iconItem.id;

                      return (
                        <button
                          key={iconItem.id}
                          onClick={() => {
                            if ('vibrate' in navigator) {
                              navigator.vibrate(5);
                            }
                            setSelectedIcon(iconItem.id);
                          }}
                          className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                            isSelected
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? `${iconItem.color}15`
                              : `${iconItem.color}08`,
                          }}
                        >
                          <Icon size={32} style={{ color: iconItem.color }} />
                          <span className="text-xs text-textSecondary font-medium">
                            {iconItem.label}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                  <p className="text-sm font-medium text-textSecondary mb-4">
                    Pré-visualização
                  </p>
                  <div className="bg-white rounded-2xl p-4 shadow-soft-sm">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${getIconById(selectedIcon).color}15`,
                        }}
                      >
                        {(() => {
                          const Icon = getIconById(selectedIcon).icon;
                          return (
                            <Icon
                              size={28}
                              style={{ color: getIconById(selectedIcon).color }}
                            />
                          );
                        })()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-textPrimary text-lg">
                          {name || 'Meu Espaço'}
                        </h3>
                        <p className="text-sm text-textSecondary">
                          {workspace?.member_count || 1}{' '}
                          {(workspace?.member_count || 1) === 1 ? 'membro' : 'membros'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Safe Area Bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-white pointer-events-none z-10"
              style={{
                height: 'env(safe-area-inset-bottom)',
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

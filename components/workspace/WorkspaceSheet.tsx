'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  Edit,
  Lock,
  Unlock,
  LogOut,
  Plus,
  Users as UsersIcon,
} from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getIconById } from '@/lib/utils/workspaceIcons';
import EditWorkspaceSheet from './EditWorkspaceSheet';
import LeaveWorkspaceModal from './LeaveWorkspaceModal';

interface WorkspaceMember {
  user_id: string;
  workspace_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface WorkspaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkspaceSheet({ isOpen, onClose }: WorkspaceSheetProps) {
  const { currentWorkspace, availableWorkspaces, switchWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string | null>(null);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [workspaceToLeave, setWorkspaceToLeave] = useState<string | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<Record<string, WorkspaceMember[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<Record<string, boolean>>({});

  // Debug: Log do currentWorkspace quando o sheet abre
  useEffect(() => {
    if (isOpen) {
      console.log('🔓 WorkspaceSheet opened:', {
        currentWorkspace: currentWorkspace ? {
          id: currentWorkspace.id,
          name: currentWorkspace.name
        } : null,
        availableWorkspacesCount: availableWorkspaces.length,
      });
    }
  }, [isOpen, currentWorkspace, availableWorkspaces]);

  // Carregar membros de um workspace
  const loadWorkspaceMembers = async (workspaceId: string) => {
    if (loadingMembers[workspaceId] || workspaceMembers[workspaceId]) {
      return;
    }

    setLoadingMembers((prev) => ({ ...prev, [workspaceId]: true }));

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          workspace_id,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('workspace_id', workspaceId)
        .is('left_at', null);

      if (error) throw error;

      setWorkspaceMembers((prev) => ({
        ...prev,
        [workspaceId]: data as any,
      }));
    } catch (error: any) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers((prev) => ({ ...prev, [workspaceId]: false }));
    }
  };

  // Carregar membros de todos os workspaces quando abrir
  useEffect(() => {
    if (isOpen) {
      availableWorkspaces.forEach((workspace) => {
        loadWorkspaceMembers(workspace.id);
      });
    }
  }, [isOpen, availableWorkspaces]);

  const handleClose = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setExpandedWorkspaceId(null);
    onClose();
  };

  const handleCardClick = (workspaceId: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }

    // Se já está expandido, colapsa; senão, expande
    setExpandedWorkspaceId(expandedWorkspaceId === workspaceId ? null : workspaceId);
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) return;

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    await switchWorkspace(workspaceId);
    handleClose();
  };

  const handleEditWorkspace = (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('✏️ handleEditWorkspace called with workspaceId:', workspaceId);

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setSelectedWorkspaceId(workspaceId);
    setShowEditSheet(true);

    console.log('✅ State updated - selectedWorkspaceId:', workspaceId, 'showEditSheet: true');
  };

  const handleToggleStatus = async (workspaceId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const action = newStatus === 'disabled' ? 'desativar' : 'reativar';

    const confirmed = window.confirm(
      `Tem certeza que deseja ${action} este espaço?${
        newStatus === 'disabled'
          ? '\n\nEspaços desativados não podem receber novos conteúdos.'
          : ''
      }`
    );

    if (!confirmed) return;

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    const actionEndpoint = newStatus === 'disabled' ? 'disable' : 'enable';

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/${actionEndpoint}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(
        newStatus === 'disabled'
          ? 'Espaço desativado com sucesso'
          : 'Espaço reativado com sucesso'
      );

      window.location.reload();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Erro ao atualizar status do espaço');
    }
  };

  const handleLeaveWorkspace = (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (availableWorkspaces.length === 1) {
      toast.error('Você precisa criar ou entrar em outro espaço antes de sair deste');
      return;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }

    setWorkspaceToLeave(workspaceId);
    setShowLeaveModal(true);
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
    <>
      <AnimatePresence>
        {isOpen && !showEditSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={handleClose}
            />

            {/* Fullscreen Bottom Sheet */}
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
              className="fixed left-0 right-0 z-50 bg-white overflow-hidden"
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
                  <div className="w-10" />
                  <h2 className="text-lg font-semibold text-textPrimary">Espaços</h2>
                  <button
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={24} className="text-textSecondary" />
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
                <div className="px-6 py-4 space-y-3">
                  {availableWorkspaces.map((workspace) => {
                    const isCurrent = workspace.id === currentWorkspace?.id;
                    const isDisabled = workspace.status === 'disabled';
                    const isExpanded = expandedWorkspaceId === workspace.id;
                    const workspaceIcon = getIconById(workspace.icon || null);
                    const Icon = workspaceIcon.icon;
                    const members = workspaceMembers[workspace.id] || [];

                    // Debug log para verificar isCurrent
                    if (isExpanded) {
                      console.log('🔍 Workspace expanded:', {
                        workspaceId: workspace.id,
                        workspaceName: workspace.name,
                        currentWorkspaceId: currentWorkspace?.id,
                        isCurrent,
                        shouldShowSwitchButton: !isCurrent,
                      });
                    }

                    return (
                      <motion.div
                        key={workspace.id}
                        layout
                        className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                          isCurrent
                            ? 'border-primary/30 shadow-soft-md'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {/* Card Header - Clickable */}
                        <button
                          onClick={() => handleCardClick(workspace.id)}
                          className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {/* Ícone do Workspace */}
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: `${workspaceIcon.color}15`,
                              }}
                            >
                              <Icon size={28} style={{ color: workspaceIcon.color }} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-textPrimary text-lg truncate">
                                  {workspace.name}
                                </h3>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full flex-shrink-0">
                                    Atual
                                  </span>
                                )}
                                {isDisabled && (
                                  <Lock size={14} className="text-orange-600 flex-shrink-0" />
                                )}
                              </div>

                              {/* Membros - Sempre visível */}
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                  {members.slice(0, 3).map((member) => (
                                    <div
                                      key={member.user_id}
                                      className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-100"
                                      title={member.profiles?.full_name || 'Membro'}
                                    >
                                      {member.profiles?.avatar_url ? (
                                        <img
                                          src={member.profiles.avatar_url}
                                          alt={member.profiles?.full_name || 'Membro'}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                          <UsersIcon size={14} className="text-gray-500" />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {members.length > 3 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                                      <span className="text-xs font-medium text-gray-600">
                                        +{members.length - 3}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm text-textSecondary">
                                  {members.length} {members.length === 1 ? 'membro' : 'membros'}
                                </span>
                              </div>
                            </div>

                            {/* Expand Icon */}
                            <ChevronDown
                              size={20}
                              className={`text-textSecondary flex-shrink-0 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {/* Expanded Content - Members List + Actions */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-gray-100"
                            >
                              {/* Lista de Membros */}
                              <div className="px-4 py-3 bg-gray-50/50">
                                <h4 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
                                  Membros
                                </h4>
                                <div className="space-y-2">
                                  {members.map((member) => (
                                    <div
                                      key={member.user_id}
                                      className="flex items-center gap-3 p-2 bg-white rounded-lg"
                                    >
                                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                        {member.profiles?.avatar_url ? (
                                          <img
                                            src={member.profiles.avatar_url}
                                            alt={member.profiles?.full_name || 'Membro'}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                            <UsersIcon size={18} className="text-gray-500" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-textPrimary truncate">
                                          {member.profiles?.full_name || 'Usuário'}
                                        </p>
                                        {member.user_id === user?.id && (
                                          <p className="text-xs text-primary">Você</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="px-4 py-2 space-y-1">
                                {!isCurrent && (
                                  <button
                                    onClick={() => handleSwitchWorkspace(workspace.id)}
                                    disabled={isDisabled}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-left rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                      <ChevronDown
                                        size={20}
                                        className="text-primary rotate-[-90deg]"
                                      />
                                    </div>
                                    <span className="font-medium text-textPrimary">
                                      Trocar para este espaço
                                    </span>
                                  </button>
                                )}

                                <button
                                  onClick={(e) => handleEditWorkspace(workspace.id, e)}
                                  className="w-full px-4 py-3 flex items-center gap-3 text-left rounded-xl hover:bg-gray-50 transition-colors group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                    <Edit size={20} className="text-blue-600" />
                                  </div>
                                  <span className="text-textPrimary">Editar nome e ícone</span>
                                </button>

                                <button
                                  onClick={(e) =>
                                    handleToggleStatus(workspace.id, workspace.status, e)
                                  }
                                  className="w-full px-4 py-3 flex items-center gap-3 text-left rounded-xl hover:bg-gray-50 transition-colors group"
                                >
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                      isDisabled
                                        ? 'bg-green-50 group-hover:bg-green-100'
                                        : 'bg-orange-50 group-hover:bg-orange-100'
                                    }`}
                                  >
                                    {isDisabled ? (
                                      <Unlock size={20} className="text-green-600" />
                                    ) : (
                                      <Lock size={20} className="text-orange-600" />
                                    )}
                                  </div>
                                  <span className="text-textPrimary">
                                    {isDisabled ? 'Reativar espaço' : 'Desativar espaço'}
                                  </span>
                                </button>

                                <button
                                  onClick={(e) => handleLeaveWorkspace(workspace.id, e)}
                                  className="w-full px-4 py-3 flex items-center gap-3 text-left rounded-xl hover:bg-red-50 transition-colors group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                                    <LogOut size={20} className="text-red-600" />
                                  </div>
                                  <span className="text-red-600 font-medium">
                                    Sair deste espaço
                                  </span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* Criar Novo Espaço */}
                  <a
                    href="/espacos"
                    className="block w-full p-4 bg-gradient-to-r from-primary/5 to-lavender/5 border-2 border-dashed border-primary/30 rounded-2xl hover:from-primary/10 hover:to-lavender/10 transition-colors"
                    onClick={handleClose}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Plus size={28} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-textPrimary">Criar novo espaço</h4>
                        <p className="text-sm text-textSecondary">
                          Ou entrar com código de convite
                        </p>
                      </div>
                    </div>
                  </a>
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

      {/* Edit Workspace Sheet */}
      <EditWorkspaceSheet
        isOpen={showEditSheet}
        onClose={() => {
          setShowEditSheet(false);
          setSelectedWorkspaceId(null);
        }}
        workspaceId={selectedWorkspaceId}
      />

      {/* Leave Workspace Modal */}
      <LeaveWorkspaceModal
        isOpen={showLeaveModal}
        onClose={() => {
          setShowLeaveModal(false);
          setWorkspaceToLeave(null);
        }}
        workspaceId={workspaceToLeave}
        workspaceName={
          availableWorkspaces.find((w) => w.id === workspaceToLeave)?.name || ''
        }
      />
    </>
  );
}

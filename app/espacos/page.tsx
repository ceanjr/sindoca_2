'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  Plus,
  Users,
  Lock,
  Unlock,
  Copy,
  LogOut,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function EspacosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace, availableWorkspaces, switchWorkspace, refreshWorkspaces } =
    useWorkspace();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  const handleCreateWorkspace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    if (!name?.trim()) {
      toast.error('Digite um nome para o espaço');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar espaço');
      }

      toast.success('Espaço criado!', {
        description: `Código de convite: ${data.inviteCode}`,
      });

      await refreshWorkspaces();
      setShowCreateModal(false);

      // Switch para novo workspace
      if (data.workspace?.id) {
        await switchWorkspace(data.workspace.id);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inviteCode = formData.get('inviteCode') as string;

    if (!inviteCode?.trim()) {
      toast.error('Digite o código de convite');
      return;
    }

    setJoining(true);

    try {
      const response = await fetch('/api/workspaces/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao entrar no espaço');
      }

      toast.success('Você entrou no espaço!');
      await refreshWorkspaces();
      setShowJoinModal(false);

      // Switch para novo workspace
      if (data.workspace?.id) {
        await switchWorkspace(data.workspace.id);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  };

  const handleToggleStatus = async (workspaceId: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'disable' : 'enable';

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao alterar status');
      }

      toast.success(
        currentStatus === 'active' ? 'Espaço desativado' : 'Espaço reativado'
      );
      await refreshWorkspaces();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLeaveWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (
      !confirm(
        `Tem certeza que deseja sair de "${workspaceName}"? Você perderá acesso a todo o conteúdo.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/leave`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao sair do espaço');
      }

      toast.success('Você saiu do espaço');
      await refreshWorkspaces();

      // Se era o workspace atual, vai redirecionar automaticamente para outro
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-textPrimary">
              Meus Espaços
            </h1>
            <p className="text-textSecondary mt-2">
              Gerencie seus espaços compartilhados
            </p>
          </div>

          {/* Current Workspace */}
          {currentWorkspace && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 mb-6 border-2 border-primary/20 shadow-soft-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm text-primary font-medium mb-1">
                    Espaço Atual
                  </div>
                  <h2 className="text-2xl font-bold text-textPrimary mb-2">
                    {currentWorkspace.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-textSecondary">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {currentWorkspace.member_count}{' '}
                      {currentWorkspace.member_count === 1 ? 'membro' : 'membros'}
                    </span>
                    {currentWorkspace.status === 'disabled' && (
                      <span className="flex items-center gap-1 text-orange-600">
                        <Lock size={14} />
                        Desativado (somente leitura)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleCopyInviteCode(currentWorkspace.invite_code)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-soft-sm"
                >
                  <Copy size={16} />
                  <span className="font-mono font-medium">
                    {currentWorkspace.invite_code}
                  </span>
                </button>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    handleToggleStatus(currentWorkspace.id, currentWorkspace.status)
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                    currentWorkspace.status === 'active'
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {currentWorkspace.status === 'active' ? (
                    <>
                      <Lock size={16} />
                      Desativar Espaço
                    </>
                  ) : (
                    <>
                      <Unlock size={16} />
                      Reativar Espaço
                    </>
                  )}
                </button>

                {availableWorkspaces.length > 1 && (
                  <button
                    onClick={() =>
                      handleLeaveWorkspace(currentWorkspace.id, currentWorkspace.name)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 font-medium transition-colors"
                  >
                    <LogOut size={16} />
                    Sair deste Espaço
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Other Workspaces */}
          {availableWorkspaces.filter((w) => w.id !== currentWorkspace?.id).length >
            0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-textPrimary mb-4">
                Outros Espaços
              </h3>
              <div className="space-y-3">
                {availableWorkspaces
                  .filter((w) => w.id !== currentWorkspace?.id)
                  .map((workspace) => (
                    <motion.div
                      key={workspace.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between gap-4 border border-white/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-textPrimary">
                            {workspace.name}
                          </div>
                          {workspace.status === 'disabled' && (
                            <Lock size={14} className="text-orange-600" />
                          )}
                        </div>
                        <div className="text-sm text-textSecondary">
                          {workspace.member_count} membro
                          {workspace.member_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => switchWorkspace(workspace.id)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors font-medium"
                      >
                        Selecionar
                      </button>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-semibold hover:bg-primary/90 transition-colors shadow-soft-md"
            >
              <Plus size={20} />
              Criar Novo Espaço
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/80 backdrop-blur-xl text-textPrimary rounded-2xl font-semibold hover:bg-white transition-colors shadow-soft-sm"
            >
              <Key size={20} />
              Entrar com Código
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-soft-lg"
          >
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Criar Novo Espaço
            </h3>
            <form onSubmit={handleCreateWorkspace}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Nome do Espaço
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Ex: Meu Projeto"
                  className="w-full px-4 py-3 bg-surfaceAlt rounded-xl border border-gray-200 focus:border-primary focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-surfaceAlt text-textPrimary rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-soft-lg"
          >
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Entrar em um Espaço
            </h3>
            <form onSubmit={handleJoinWorkspace}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Código de Convite
                </label>
                <input
                  type="text"
                  name="inviteCode"
                  placeholder="ABC123"
                  className="w-full px-4 py-3 bg-surfaceAlt rounded-xl border border-gray-200 focus:border-primary focus:outline-none transition-colors font-mono uppercase"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-3 bg-surfaceAlt text-textPrimary rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {joining ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </ProtectedRoute>
  );
}

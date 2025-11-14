'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Workspace {
  id: string;
  name: string;
  invite_code: string;
  icon: string;
  status: 'active' | 'disabled' | 'archived';
  creator_id: string;
  created_at: string;
  member_count?: number;
}

interface WorkspaceContextType {
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  availableWorkspaces: Workspace[];
  loading: boolean;
  switchWorkspace: (workspaceId: string, showToast?: boolean) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Função para obter cookie
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  // Função para setar cookie
  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  };

  // Carregar workspaces do usuário
  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      setAvailableWorkspaces([]);
      setCurrentWorkspaceId(null);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 WorkspaceContext: Loading workspaces for user', user.id);

      // Buscar workspaces do usuário
      const { data: members, error } = await supabase
        .from('workspace_members')
        .select(`
          workspace_id,
          workspaces (
            id,
            name,
            invite_code,
            icon,
            status,
            creator_id,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .is('left_at', null);

      if (error) {
        console.error('❌ Error loading workspaces:');
        console.error('  Message:', error.message);
        console.error('  Code:', error.code);
        console.error('  Details:', error.details);
        console.error('  Hint:', error.hint);
        console.error('  Full error:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Filtrar e transformar dados
      const workspaces = (members || [])
        .flatMap(m => m.workspaces || [])
        .filter(w => w && w.status !== 'archived') as Workspace[];

      console.log('✅ Loaded workspaces:', workspaces.length);

      // Buscar count de membros para cada workspace
      const workspacesWithCounts = await Promise.all(
        workspaces.map(async (workspace) => {
          const { count } = await supabase
            .from('workspace_members')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', workspace.id)
            .is('left_at', null);

          return {
            ...workspace,
            member_count: count || 0,
          };
        })
      );

      setAvailableWorkspaces(workspacesWithCounts);

      // Determinar workspace atual
      let targetWorkspaceId = currentWorkspaceId;

      // 1. Tentar obter do cookie
      if (!targetWorkspaceId) {
        targetWorkspaceId = getCookie('currentWorkspaceId');
        console.log('📝 Cookie workspace:', targetWorkspaceId);
      }

      // 2. Validar que workspace do cookie ainda é válido
      if (targetWorkspaceId && !workspacesWithCounts.find(w => w.id === targetWorkspaceId)) {
        console.log('⚠️ Cookie workspace não é mais válido');
        targetWorkspaceId = null;
      }

      // 3. Fallback para primeiro workspace disponível
      if (!targetWorkspaceId && workspacesWithCounts.length > 0) {
        targetWorkspaceId = workspacesWithCounts[0].id;
        console.log('🔄 Using first workspace:', targetWorkspaceId);
      }

      // 4. Se ainda não tem workspace, criar um padrão
      if (!targetWorkspaceId) {
        console.log('⚠️ User has no workspaces, creating default...');
        // Isso não deveria acontecer pois o signup cria workspace
        // Mas caso aconteça, criar workspace padrão via API
        await createDefaultWorkspace();
        // Recarregar workspaces
        await loadWorkspaces();
        return;
      }

      // Setar workspace atual DIRETAMENTE (não depender de availableWorkspaces state)
      if (targetWorkspaceId) {
        const targetWorkspace = workspacesWithCounts.find(w => w.id === targetWorkspaceId);
        console.log('🎯 Setting current workspace:', { id: targetWorkspaceId, workspace: targetWorkspace });

        setCurrentWorkspaceId(targetWorkspaceId);
        setCurrentWorkspace(targetWorkspace || null);
        setCookie('currentWorkspaceId', targetWorkspaceId);

        // Broadcast evento
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('workspace-changed', {
            detail: { workspaceId: targetWorkspaceId }
          }));
        }
      }
    } catch (error: any) {
      console.error('❌ Error in loadWorkspaces:');
      console.error('  Message:', error?.message);
      console.error('  Code:', error?.code);
      console.error('  Details:', error?.details);
      console.error('  Stack:', error?.stack);
      toast.error('Erro ao carregar espaços de trabalho');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Criar workspace padrão (emergency fallback)
  const createDefaultWorkspace = async () => {
    try {
      const response = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Meu Espaço' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create default workspace');
      }

      console.log('✅ Created default workspace');
    } catch (error) {
      console.error('❌ Error creating default workspace:', error);
    }
  };

  // Trocar de workspace
  const switchWorkspace = async (workspaceId: string, showToast: boolean = true) => {
    console.log('🔄 Switching to workspace:', workspaceId);

    // Buscar detalhes do workspace
    const workspace = availableWorkspaces.find(w => w.id === workspaceId);

    console.log('📍 switchWorkspace:', {
      workspaceId,
      foundWorkspace: workspace ? { id: workspace.id, name: workspace.name } : null,
      availableWorkspacesCount: availableWorkspaces.length,
    });

    // Atualizar cookie
    setCookie('currentWorkspaceId', workspaceId);

    // Atualizar state
    setCurrentWorkspaceId(workspaceId);
    setCurrentWorkspace(workspace || null);

    // Broadcast evento para hooks recarregarem dados
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('workspace-changed', {
        detail: { workspaceId }
      }));
    }

    if (showToast && workspace) {
      toast.success(`Agora você está em: ${workspace.name}`);
    }
  };

  // Carregar workspaces quando user muda
  useEffect(() => {
    loadWorkspaces();
  }, [user, loadWorkspaces]);

  // Ouvir mudanças de workspace via Realtime
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const channel = supabase
      .channel('workspace-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workspaces',
          filter: `id=eq.${currentWorkspaceId}`,
        },
        (payload: any) => {
          console.log('🔄 Workspace updated:', payload);

          // Se workspace foi arquivado, trocar para outro
          if (payload.new.status === 'archived') {
            toast.error('Este espaço foi arquivado');

            // Trocar para outro workspace
            const otherWorkspace = availableWorkspaces.find(
              w => w.id !== currentWorkspaceId
            );

            if (otherWorkspace) {
              switchWorkspace(otherWorkspace.id);
            } else {
              // Sem workspaces disponíveis
              setCurrentWorkspaceId(null);
              setCurrentWorkspace(null);
            }
          } else {
            // Atualizar workspace atual
            setCurrentWorkspace(prev =>
              prev ? { ...prev, status: payload.new.status } : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, availableWorkspaces, supabase]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspaceId,
        currentWorkspace,
        availableWorkspaces,
        loading,
        switchWorkspace,
        refreshWorkspaces: loadWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

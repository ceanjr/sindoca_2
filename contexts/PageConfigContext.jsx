'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

const PageConfigContext = createContext(undefined);

export function PageConfigProvider({ children }) {
  const [pageConfig, setPageConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const supabaseRef = useRef(null); // ✅ Reutilizar mesma instância
  const channelRef = useRef(null); // ✅ Guardar referência do canal
  const initializedRef = useRef(false); // ✅ Prevenir dupla inicialização

  const isAdmin = user?.email === 'celiojunior0110@gmail.com';

  useEffect(() => {
    // ✅ Aguardar auth finalizar
    if (authLoading) {
      console.log('🔄 PageConfig: Waiting for auth...');
      return;
    }

    // ✅ Evitar dupla inicialização
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    console.log('🔧 PageConfig: Initializing once with user:', user?.email);
    console.log('🔧 PageConfig: isAdmin:', isAdmin);

    // ✅ Criar instância única do Supabase
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    const supabase = supabaseRef.current;
    let timeoutId = null;

    const initializePageConfig = async () => {
      try {
        // ✅ Timeout com AbortController
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller.abort();
          console.warn('⚠️ PageConfig: Timeout, using defaults');
          setLoading(false);
        }, 8000);

        const { data, error, status } = await supabase
          .from('page_config')
          .select('*')
          .order('page_id')
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        // ✅ Tratar erro de token expirado
        if (error) {
          if (status === 401 || error.message?.includes('JWT')) {
            console.error('❌ PageConfig: Auth error, user needs to re-login');
            await supabase.auth.signOut();
            window.location.href = '/auth/login';
            return;
          }
          throw error;
        }

        setPageConfig(data || []);
        setLoading(false);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('⚠️ PageConfig: Request aborted by timeout');
        } else {
          console.error('❌ PageConfig: Error loading config:', error);
        }
        // ✅ Sempre setar loading false
        setLoading(false);
      }
    };

    initializePageConfig();

    // ✅ Cleanup do canal anterior antes de criar novo
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // ✅ Subscribe to changes (apenas uma vez)
    const channel = supabase
      .channel('page_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_config',
        },
        (payload) => {
          console.log('📡 Page config changed:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setPageConfig((prev) =>
              prev.map((page) =>
                page.id === payload.new.id ? payload.new : page
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 PageConfig subscription status:', status);
      });

    channelRef.current = channel;

    // ✅ Cleanup completo
    return () => {
      console.log('🧹 PageConfig: Cleaning up...');
      if (timeoutId) clearTimeout(timeoutId);
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [authLoading]); // ✅ Só depende de authLoading

  /**
   * Update page active status
   * @param {string} pageId - The page ID to update
   * @param {boolean} isActive - New active status
   */
  const updatePageStatus = async (pageId, isActive) => {
    if (!isAdmin) {
      console.error('Only admin can update page status');
      return false;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('page_config')
        .update({ is_active: isActive })
        .eq('page_id', pageId);

      if (error) throw error;

      // Optimistic update
      setPageConfig((prev) =>
        prev.map((page) =>
          page.page_id === pageId ? { ...page, is_active: isActive } : page
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating page status:', error);
      return false;
    }
  };

  /**
   * Check if a specific page is active
   * @param {string} pageId - The page ID to check
   * @returns {boolean} - True if active or config not loaded yet (to prevent flickering)
   */
  const isPageActive = (pageId) => {
    const page = pageConfig.find((p) => p.page_id === pageId);
    return page ? page.is_active : true; // Default to true if not found
  };

  return (
    <PageConfigContext.Provider
      value={{
        pageConfig,
        isAdmin,
        loading,
        user,
        updatePageStatus,
        isPageActive,
      }}
    >
      {children}
    </PageConfigContext.Provider>
  );
}

export function usePageConfig() {
  const context = useContext(PageConfigContext);
  if (context === undefined) {
    throw new Error('usePageConfig must be used within PageConfigProvider');
  }
  return context;
}

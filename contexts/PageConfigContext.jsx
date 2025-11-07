'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

const PageConfigContext = createContext(undefined);

export function PageConfigProvider({ children }) {
  const [pageConfig, setPageConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth(); // Use user from AuthContext

  // Derive isAdmin from user
  const isAdmin = user?.email === 'celiojunior0110@gmail.com';

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('🔄 PageConfig: Waiting for auth to load...');
      return;
    }

    console.log('🔧 PageConfig: Initializing once with user:', user?.email);
    console.log('🔧 PageConfig: isAdmin:', isAdmin);

    const supabase = createClient();

    const initializePageConfig = async () => {
      try {
        // Fetch page config
        const { data, error } = await supabase
          .from('page_config')
          .select('*')
          .order('page_id');

        if (error) throw error;

        setPageConfig(data || []);
      } catch (error) {
        console.error('Error loading page config:', error);
      } finally {
        setLoading(false);
      }
    };

    initializePageConfig();

    // Subscribe to changes (only once)
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
          console.log('Page config changed:', payload);

          if (payload.eventType === 'UPDATE') {
            setPageConfig((prev) =>
              prev.map((page) =>
                page.id === payload.new.id ? payload.new : page
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 PageConfig: Cleaning up channel subscription');
      supabase.removeChannel(channel);
    };
  }, [authLoading]); // Only re-run when authLoading changes (once)

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

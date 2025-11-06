'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to manage page configuration (active/inactive pages)
 * @returns {Object} - { pageConfig, isAdmin, loading, updatePageStatus }
 */
export function usePageConfig() {
  const [pageConfig, setPageConfig] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const supabase = createClient();

    const initializePageConfig = async () => {
      try {
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setUser(currentUser);
        setIsAdmin(currentUser?.email === 'celiojunior0110@gmail.com');

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

    // Subscribe to changes
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
      supabase.removeChannel(channel);
    };
  }, []);

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

  return {
    pageConfig,
    isAdmin,
    loading,
    user,
    updatePageStatus,
    isPageActive,
  };
}

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook para sincronização de fotos com realtime do Supabase
 * - Fotos armazenadas no Firebase Storage
 * - Metadados e favoritos no Supabase Realtime
 */
export function useRealtimePhotos(pollInterval = 10000) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supabase] = useState(() => createClient());
  const [userId, setUserId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);

  // Get current user and workspace
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Get user's workspace
        const { data: members } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        if (members) {
          setWorkspaceId(members.workspace_id);
        }
      }
    };

    initAuth();
  }, [supabase]);

  // Load favorites from Supabase reactions table
  const loadFavorites = async () => {
    if (!userId || !workspaceId) return {};

    try {
      const { data: reactions } = await supabase
        .from('reactions')
        .select('content_id')
        .eq('user_id', userId)
        .eq('type', 'favorite');

      const favMap = {};
      reactions?.forEach((r) => {
        favMap[r.content_id] = true;
      });

      return favMap;
    } catch (err) {
      console.error('Error loading favorites:', err);
      return {};
    }
  };

  const loadPhotos = async () => {
    if (!storage) {
      console.warn('Firebase Storage não configurado');
      setLoading(false);
      return;
    }

    try {
      const galleryRootRef = storageRef(storage, 'gallery');
      const result = await listAll(galleryRootRef);

      if (result.items.length === 0) {
        setPhotos([]);
        setLoading(false);
        return;
      }

      // Load favorites from Supabase
      const favoritesMap = await loadFavorites();

      const remotePhotos = await Promise.all(
        result.items.map(async (item) => {
          try {
            const [downloadUrl, metadata] = await Promise.all([
              getDownloadURL(item),
              getMetadata(item).catch(() => null),
            ]);

            const createdAt = metadata?.timeCreated
              ? new Date(metadata.timeCreated)
              : null;
            const formattedDate = createdAt
              ? createdAt.toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10);

            const photoId = item.fullPath;

            return {
              id: photoId,
              storagePath: item.fullPath,
              url: downloadUrl,
              caption:
                metadata?.customMetadata?.caption ??
                item.name.replace(/\.[^/.]+$/, ''),
              date: formattedDate,
              favorite: !!favoritesMap[photoId],
              tags: metadata?.customMetadata?.tags?.split(',') || [],
            };
          } catch (err) {
            console.error(`Erro ao carregar foto ${item.name}:`, err);
            return null;
          }
        })
      );

      const validPhotos = remotePhotos
        .filter((photo) => photo !== null)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setPhotos(validPhotos);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (userId && workspaceId) {
      loadPhotos();
    }
  }, [userId, workspaceId]);

  // Realtime subscription to reactions (favorites) changes
  useEffect(() => {
    if (!userId || !workspaceId) return;

    const channel = supabase
      .channel('photo-favorites')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `type=eq.favorite`,
        },
        (payload) => {
          console.log('🔄 Realtime favorite change:', payload);
          loadPhotos(); // Reload photos when favorites change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, workspaceId, supabase]);

  // ❌ POLLING REMOVIDO - Realtime Subscription já cuida das atualizações

  const toggleFavorite = async (photoId) => {
    if (!userId) {
      console.warn('User not authenticated');
      return;
    }

    // Get current favorite status BEFORE optimistic update
    const photo = photos.find((p) => p.id === photoId);
    const currentFavoriteStatus = photo?.favorite || false;
    const newFavoriteStatus = !currentFavoriteStatus;

    // Optimistic update - Update UI immediately
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, favorite: newFavoriteStatus } : photo
      )
    );

    try {
      if (currentFavoriteStatus) {
        // Was favorited, now removing favorite from Supabase
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('content_id', photoId)
          .eq('user_id', userId)
          .eq('type', 'favorite');

        if (error) throw error;
        console.log('✅ Removed favorite from Supabase');
      } else {
        // Was not favorited, now adding favorite to Supabase
        const { error } = await supabase.from('reactions').insert({
          content_id: photoId,
          user_id: userId,
          type: 'favorite',
        });

        if (error && error.code !== '23505') {
          // Ignore duplicate key errors
          throw error;
        }
        console.log('✅ Added favorite to Supabase');
      }
    } catch (error) {
      console.error('❌ Erro ao alternar favorito:', error);
      // Rollback optimistic update on error
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId
            ? { ...photo, favorite: currentFavoriteStatus }
            : photo
        )
      );
    }
  };

  return { photos, loading, error, toggleFavorite, refresh: loadPhotos };
}

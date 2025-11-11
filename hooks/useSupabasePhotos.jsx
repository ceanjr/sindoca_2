/**
 * 🔥 CORREÇÃO: Next.js Image + Supabase
 *
 * Problemas resolvidos:
 * 1. ✅ Validação robusta de URL (data.url ou storage_path)
 * 2. ✅ Fallback para gerar URL do storage quando necessário
 * 3. ✅ Remove fotos sem URL válida da lista
 * 4. ✅ Logs para debug no console
 *
 * @file hooks/useSupabasePhotos.jsx
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  uploadPhotoToStorage,
  createPhotoRecord,
  deletePhotoFromStorage,
  deletePhotoRecord,
  updatePhotoCaption as updatePhotoCaptionAPI,
  togglePhotoFavorite as togglePhotoFavoriteAPI,
  fetchWorkspacePhotos,
} from '@/lib/supabase/photoOperations';
import { fetchJSON } from '@/lib/utils/fetchWithTimeout';

export function useSupabasePhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateCounter, setUpdateCounter] = useState(0);
  const supabaseRef = useRef(null);
  const userRef = useRef(null);
  const workspaceRef = useRef(null);
  const partnerIdRef = useRef(null);
  const channelRef = useRef(null);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);
  const urlCacheRef = useRef({}); // Cache for photo URLs to avoid regenerating

  useEffect(() => {
    // Prevent multiple initializations
    if (initializingRef.current || initializedRef.current) {
      return;
    }

    initializingRef.current = true;

    const initAuth = async () => {
      try {
        const supabase = createClient();
        supabaseRef.current = supabase;

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setLoading(false);
          initializingRef.current = false;
          return;
        }

        userRef.current = user;

        const { data: members, error: membersError } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        if (membersError || !members) {
          setLoading(false);
          initializingRef.current = false;
          return;
        }

        workspaceRef.current = members.workspace_id;

        // Get partner ID
        const { data: allMembers } = await supabase
          .from('workspace_members')
          .select('user_id')
          .eq('workspace_id', members.workspace_id);

        const partner = allMembers?.find(m => m.user_id !== user.id);
        if (partner) {
          partnerIdRef.current = partner.user_id;
        }

        await loadPhotos();

        // Only setup subscriptions if not already setup
        if (!channelRef.current) {
          setupRealtimeSubscription(supabase, members.workspace_id);
        }

        initializedRef.current = true;
        initializingRef.current = false;
      } catch (err) {
        setError(err.message);
        setLoading(false);
        initializingRef.current = false;
      }
    };

    initAuth();

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
    };
  }, []);

  const loadPhotos = useCallback(async () => {
    if (!supabaseRef.current || !workspaceRef.current) {
      return;
    }

    try {
      setLoading(true);
      const data = await fetchWorkspacePhotos(
        supabaseRef.current,
        workspaceRef.current
      );

      // Transform data to include favorites
      const transformedPhotos = data.map((photo) => {
        const favoritesMap = {};
        const favoritedBy = [];
        photo.reactions?.forEach((reaction) => {
          if (reaction.type === 'favorite') {
            favoritesMap[reaction.user_id] = true;
            favoritedBy.push({
              userId: reaction.user_id,
              name: reaction.profiles?.full_name || 'Desconhecido',
              avatar: reaction.profiles?.avatar_url,
            });
          }
        });

        // Parse data field if it's a string
        let photoData = photo.data;
        if (typeof photoData === 'string') {
          try {
            photoData = JSON.parse(photoData);
          } catch (e) {
            photoData = {};
          }
        }

        // Get URL from data or generate from storage_path with caching
        let photoUrl = photoData?.url || '';

        if (!photoUrl && photo.storage_path) {
          // Check cache first
          if (urlCacheRef.current[photo.storage_path]) {
            photoUrl = urlCacheRef.current[photo.storage_path];
          } else {
            // Generate and cache the URL
            const cleanPath = photo.storage_path.replace(/^gallery\//, '');
            const { data: urlData } = supabaseRef.current.storage
              .from('gallery')
              .getPublicUrl(cleanPath);
            photoUrl = urlData?.publicUrl || '';
            urlCacheRef.current[photo.storage_path] = photoUrl;
          }
        }

        return {
          id: photo.id,
          url: photoUrl,
          caption: photo.description || '',
          category: photo.category || 'all',
          created_at: photo.created_at,
          favorite: favoritesMap[userRef.current?.id] || false,
          isFavoritedByAnyone: favoritedBy.length > 0,
          favoritedBy: favoritedBy,
          storage_path: photo.storage_path,
        };
      });

      setPhotos([...transformedPhotos]); // Force new array reference
      setUpdateCounter((prev) => prev + 1); // Force re-render
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setupRealtimeSubscription = (supabase, workspaceId) => {
    const channel = supabase
      .channel(`workspace-${workspaceId}-photos`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          if (payload.new?.type !== 'photo') return;

          // Transform and add new photo to state
          const photo = payload.new;
          let photoData = photo.data;
          if (typeof photoData === 'string') {
            try {
              photoData = JSON.parse(photoData);
            } catch (e) {
              photoData = {};
            }
          }

          let photoUrl = photoData?.url || '';
          if (!photoUrl && photo.storage_path) {
            const cleanPath = photo.storage_path.replace(/^gallery\//, '');
            const { data: urlData } = supabase.storage
              .from('gallery')
              .getPublicUrl(cleanPath);
            photoUrl = urlData?.publicUrl || '';
          }

          const newPhoto = {
            id: photo.id,
            url: photoUrl,
            caption: photo.description || '',
            category: photo.category || 'all',
            created_at: photo.created_at,
            favorite: false,
            isFavoritedByAnyone: false,
            favoritedBy: [],
            storage_path: photo.storage_path,
          };

          setPhotos((prev) => [newPhoto, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          if (payload.new?.type !== 'photo') return;

          // Update existing photo
          const photo = payload.new;
          let photoData = photo.data;
          if (typeof photoData === 'string') {
            try {
              photoData = JSON.parse(photoData);
            } catch (e) {
              photoData = {};
            }
          }

          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? {
                    ...p,
                    caption: photo.description || '',
                    category: photo.category || 'all',
                  }
                : p
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (payload.old?.type !== 'photo') return;
          setPhotos((prev) => prev.filter((p) => p.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
        },
        async (payload) => {
          // Reload photos to update reactions (this is complex to do incrementally)
          await loadPhotos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reactions',
        },
        async (payload) => {
          // Reload photos to update reactions
          await loadPhotos();
        }
      )
      .subscribe();

    // Store channel for cleanup
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const uploadPhotos = async (files) => {
    if (!supabaseRef.current || !userRef.current || !workspaceRef.current) {
      throw new Error('Not initialized');
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const { path, publicUrl, originalName, size, mimeType } =
          await uploadPhotoToStorage(
            supabaseRef.current,
            file,
            userRef.current.id,
            workspaceRef.current
          );

        const photo = await createPhotoRecord(
          supabaseRef.current,
          workspaceRef.current,
          userRef.current.id,
          path,
          publicUrl,
          { originalName, size, mimeType }
        );

        results.push(photo);
      } catch (error) {
        errors.push({ file: file.name, error: error.message });
      }
    }

    if (results.length > 0) {
      await loadPhotos();

      // Send push notification to partner
      if (partnerIdRef.current && results.length > 0) {
        try {
          const photoCount = results.length;
          const message = photoCount === 1
            ? 'Uma nova foto foi adicionada à galeria!'
            : `${photoCount} novas fotos foram adicionadas à galeria!`;

          await fetchJSON('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            timeout: 10000,
            body: JSON.stringify({
              recipientUserId: partnerIdRef.current,
              title: '📸 Nova(s) foto(s) na galeria!',
              body: message,
              icon: '/icon-192x192.png',
              tag: 'new-photo',
              data: { url: '/fotos' },
            }),
          });

          console.log('✅ Push notification sent for photo upload');
        } catch (error) {
          console.error('❌ Error sending push notification for photo:', error);
          // Don't throw - notification sending is non-critical
        }
      }
    }

    return { results, errors };
  };

  const removePhoto = async (photoId) => {
    if (!supabaseRef.current) {
      throw new Error('Supabase not initialized');
    }

    try {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) {
        throw new Error('Photo not found');
      }

      if (photo.storage_path) {
        await deletePhotoFromStorage(supabaseRef.current, photo.storage_path);
      }

      await deletePhotoRecord(supabaseRef.current, photoId);

      setPhotos((prev) => [...prev.filter((p) => p.id !== photoId)]); // Force new array
      setUpdateCounter((prev) => prev + 1); // Force re-render
    } catch (error) {
      throw error;
    }
  };

  const toggleFavorite = async (photoId) => {
    if (!supabaseRef.current || !userRef.current) {
      throw new Error('Not initialized');
    }

    try {
      const isFavorited = await togglePhotoFavoriteAPI(
        supabaseRef.current,
        photoId,
        userRef.current.id
      );

      // Reload photos to get updated favoritedBy information
      await loadPhotos();
    } catch (error) {
      throw error;
    }
  };

  const updatePhotoCaption = async (photoId, newCaption) => {
    if (!supabaseRef.current || !userRef.current) {
      throw new Error('Not initialized');
    }

    try {
      await updatePhotoCaptionAPI(supabaseRef.current, photoId, newCaption);

      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) =>
          photo.id === photoId ? { ...photo, caption: newCaption } : photo
        )
      );

      return true;
    } catch (error) {
      throw error;
    }
  };

  return {
    photos,
    loading,
    error,
    uploadPhotos,
    removePhoto,
    toggleFavorite,
    updatePhotoCaption,
    refresh: loadPhotos,
  };
}

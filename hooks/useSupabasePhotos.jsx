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

export function useSupabasePhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabaseRef = useRef(null);
  const userRef = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
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
          return;
        }

        workspaceRef.current = members.workspace_id;
        await loadPhotos();
        setupRealtimeSubscription(supabase, members.workspace_id);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loadPhotos = useCallback(async () => {
    if (!supabaseRef.current || !workspaceRef.current) return;

    try {
      setLoading(true);
      const data = await fetchWorkspacePhotos(
        supabaseRef.current,
        workspaceRef.current
      );

      const transformedPhotos = data
        .map((photo) => {
          console.log('🔍 Processing photo:', photo.id, {
            data_url: photo.data?.url,
            storage_path: photo.storage_path,
          });

          const favoritesMap = {};
          photo.reactions?.forEach((reaction) => {
            if (reaction.type === 'favorite') {
              favoritesMap[reaction.user_id] = true;
            }
          });

          // 🔥 FIX: Melhor lógica de fallback para URL
          let photoUrl = '';

          // 1. Tenta pegar do data.url
          if (
            photo.data?.url &&
            typeof photo.data.url === 'string' &&
            photo.data.url.trim() !== ''
          ) {
            photoUrl = photo.data.url.trim();
            console.log('✅ Using data.url:', photoUrl);
          }
          // 2. Se não existir, gera do storage_path
          else if (photo.storage_path) {
            try {
              const { data: urlData } = supabaseRef.current.storage
                .from('photos')
                .getPublicUrl(photo.storage_path);

              if (urlData?.publicUrl) {
                photoUrl = urlData.publicUrl;
                console.log('✅ Generated from storage_path:', photoUrl);
              }
            } catch (err) {
              console.error(
                `Erro ao gerar URL para ${photo.storage_path}:`,
                err
              );
            }
          }

          // 🔥 FIX: Validação final - se ainda não tem URL válida, pular essa foto
          if (!photoUrl || photoUrl === '') {
            console.warn(`⚠️ Foto ${photo.id} sem URL válida, será ignorada`);
            return null;
          }

          return {
            id: photo.id,
            url: photoUrl,
            caption: photo.description || '',
            category: photo.category || 'all',
            created_at: photo.created_at,
            favorite: favoritesMap[userRef.current?.id] || false,
            storage_path: photo.storage_path,
          };
        })
        .filter(Boolean); // Remove fotos null (sem URL válida)

      setPhotos(transformedPhotos);
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
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          loadPhotos();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
        },
        () => {
          loadPhotos();
        }
      )
      .subscribe();

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
        const { path, publicUrl } = await uploadPhotoToStorage(
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
          publicUrl
        );

        results.push(photo);
      } catch (error) {
        errors.push({ file: file.name, error: error.message });
      }
    }

    if (results.length > 0) {
      await loadPhotos();
    }

    return { results, errors };
  };

  const removePhoto = async (photoId) => {
    if (!supabaseRef.current) {
      throw new Error('Supabase not initialized');
    }

    try {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) throw new Error('Photo not found');

      if (photo.storage_path) {
        await deletePhotoFromStorage(supabaseRef.current, photo.storage_path);
      }

      await deletePhotoRecord(supabaseRef.current, photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
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

      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId ? { ...photo, favorite: isFavorited } : photo
        )
      );
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

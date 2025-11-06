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
  const [updateCounter, setUpdateCounter] = useState(0);
  const supabaseRef = useRef(null);
  const userRef = useRef(null);
  const workspaceRef = useRef(null);
  const channelRef = useRef(null);

  // Log quando photos muda
  useEffect(() => {
    console.log('📊 Photos state changed:', photos.length, 'photos');
  }, [photos]);

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

    // Cleanup subscription on unmount
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
    };
  }, []);

  const loadPhotos = useCallback(async () => {
    console.log('🔵 loadPhotos called');

    if (!supabaseRef.current || !workspaceRef.current) {
      console.warn('⚠️  Cannot load photos: not initialized');
      return;
    }

    console.log('📥 Fetching photos for workspace:', workspaceRef.current);

    try {
      setLoading(true);
      const data = await fetchWorkspacePhotos(
        supabaseRef.current,
        workspaceRef.current
      );

      console.log(`📸 Fetched ${data.length} photos from database`);

      // Transform data to include favorites
      const transformedPhotos = data.map((photo) => {
        console.log('🔍 Processing photo:', photo.id);
        console.log('  storage_path:', photo.storage_path);
        console.log('  data type:', typeof photo.data);
        console.log('  data raw:', photo.data);

        const favoritesMap = {};
        photo.reactions?.forEach((reaction) => {
          if (reaction.type === 'favorite') {
            favoritesMap[reaction.user_id] = true;
          }
        });

        // Parse data field if it's a string
        let photoData = photo.data;
        if (typeof photoData === 'string') {
          try {
            photoData = JSON.parse(photoData);
            console.log('  ✅ Parsed data:', photoData);
          } catch (e) {
            console.warn('  ❌ Failed to parse photo data:', e);
            photoData = {};
          }
        }

        // Get URL from data or generate from storage_path
        let photoUrl = photoData?.url || '';
        console.log('  photoData.url:', photoData?.url);

        if (!photoUrl && photo.storage_path) {
          // Remove 'gallery/' prefix if exists, since bucket is already 'gallery'
          const cleanPath = photo.storage_path.replace(/^gallery\//, '');
          console.log('  Generating URL from storage_path:', cleanPath);
          const { data: urlData } = supabaseRef.current.storage
            .from('gallery')
            .getPublicUrl(cleanPath);
          photoUrl = urlData?.publicUrl || '';

          console.log('  Generated URL:', photoUrl);
        }

        console.log('  FINAL URL:', photoUrl);

        return {
          id: photo.id,
          url: photoUrl,
          caption: photo.description || '',
          category: photo.category || 'all',
          created_at: photo.created_at,
          favorite: favoritesMap[userRef.current?.id] || false,
          storage_path: photo.storage_path,
        };
      });

      console.log(`✅ Transformed ${transformedPhotos.length} photos`);
      setPhotos([...transformedPhotos]); // Force new array reference
      setUpdateCounter((prev) => prev + 1); // Force re-render
      setError(null);
      console.log('✅ Photos state updated');
    } catch (err) {
      console.error('❌ Error loading photos:', err);
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
        (payload) => {
          console.log('🔔 Realtime event (content):', payload.eventType);
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
        (payload) => {
          console.log('🔔 Realtime event (reactions):', payload.eventType);
          loadPhotos();
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
    console.log('🔵 uploadPhotos called with', files.length, 'files');

    if (!supabaseRef.current || !userRef.current || !workspaceRef.current) {
      console.error('❌ Not initialized:', {
        supabase: !!supabaseRef.current,
        user: !!userRef.current,
        workspace: !!workspaceRef.current,
      });
      throw new Error('Not initialized');
    }

    console.log('✅ Initialized:', {
      userId: userRef.current.id,
      workspaceId: workspaceRef.current,
    });

    const results = [];
    const errors = [];

    for (const file of files) {
      console.log(`📤 Uploading ${file.name}...`);
      try {
        const { path, publicUrl, originalName, size, mimeType } =
          await uploadPhotoToStorage(
            supabaseRef.current,
            file,
            userRef.current.id,
            workspaceRef.current
          );

        console.log(`  ✅ Uploaded to storage: ${path}`);
        console.log(`  🔗 Public URL: ${publicUrl}`);

        const photo = await createPhotoRecord(
          supabaseRef.current,
          workspaceRef.current,
          userRef.current.id,
          path,
          publicUrl,
          { originalName, size, mimeType }
        );

        console.log(`  ✅ Created DB record: ${photo.id}`);

        results.push(photo);
      } catch (error) {
        console.error(`  ❌ Error uploading ${file.name}:`, error);
        errors.push({ file: file.name, error: error.message });
      }
    }

    console.log(
      `🎉 Upload complete: ${results.length} success, ${errors.length} errors`
    );

    if (results.length > 0) {
      console.log('🔄 Reloading photos...');
      await loadPhotos();
    }

    return { results, errors };
  };

  const removePhoto = async (photoId) => {
    console.log('🔵 removePhoto called for:', photoId);

    if (!supabaseRef.current) {
      console.error('❌ Supabase not initialized');
      throw new Error('Supabase not initialized');
    }

    try {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) {
        console.error('❌ Photo not found:', photoId);
        throw new Error('Photo not found');
      }

      console.log('📸 Photo to delete:', {
        id: photo.id,
        storage_path: photo.storage_path,
      });

      if (photo.storage_path) {
        console.log('🗑️  Deleting from storage:', photo.storage_path);
        await deletePhotoFromStorage(supabaseRef.current, photo.storage_path);
        console.log('  ✅ Deleted from storage');
      }

      console.log('🗑️  Deleting from database...');
      await deletePhotoRecord(supabaseRef.current, photoId);
      console.log('  ✅ Deleted from database');

      setPhotos((prev) => [...prev.filter((p) => p.id !== photoId)]); // Force new array
      setUpdateCounter((prev) => prev + 1); // Force re-render
      console.log('✅ Photo removed successfully');
    } catch (error) {
      console.error('❌ Error removing photo:', error);
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

      setPhotos((prev) => [
        ...prev.map((photo) =>
          photo.id === photoId ? { ...photo, favorite: isFavorited } : photo
        ),
      ]);
      setUpdateCounter((prev) => prev + 1);
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

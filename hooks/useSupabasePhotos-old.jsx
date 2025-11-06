'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadPhoto, deletePhoto } from '@/lib/supabase/storage';

/**
 * Compress and optimize image before upload
 * ENSURES valid JPEG format
 */
async function compressImage(
  file,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85
) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        // Fill with white background (important for JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with JPEG format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Verify the blob is a valid JPEG
            if (blob.type !== 'image/jpeg') {
              console.warn(`⚠️ Blob type is ${blob.type}, expected image/jpeg`);
            }

            // Create new file with .jpg extension
            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${fileNameWithoutExt}.jpg`;

            const compressedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const originalSize = (file.size / 1024 / 1024).toFixed(2);
            const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(
              2
            );

            console.log(
              `🗜️ Compressed: ${originalSize}MB → ${compressedSize}MB`
            );
            console.log(`   File: ${file.name} → ${newFileName}`);
            console.log(`   MIME: ${file.type} → ${compressedFile.type}`);
            console.log(`   Blob type: ${blob.type}`);

            resolve(compressedFile);
          },
          'image/jpeg', // Force JPEG format
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}

/**
 * Hook para gerenciar fotos com Supabase Storage + Realtime
 */
export function useSupabasePhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabaseRef = useRef(createClient());
  const [userId, setUserId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);

  // Get current user and workspace
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabaseRef.current.auth.getUser();

        if (userError) {
          console.error('❌ Error getting user:', userError);
          setLoading(false);
          return;
        }

        if (!user) {
          console.warn('⚠️ No authenticated user found');
          setLoading(false);
          return;
        }

        setUserId(user.id);
        console.log('✅ User authenticated:', user.id);

        // Get user's workspace
        const { data: members, error: membersError } = await supabaseRef.current
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        if (membersError) {
          console.error('❌ Error getting workspace:', membersError);
          setError('Workspace não encontrado. Faça login novamente.');
          setLoading(false);
          return;
        }

        if (members?.workspace_id) {
          setWorkspaceId(members.workspace_id);
          console.log('✅ Workspace found:', members.workspace_id);
        } else {
          console.warn('⚠️ No workspace found for user');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Error in initAuth:', err);
        setError('Erro ao autenticar. Tente novamente.');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Load photos from Supabase
  const loadPhotos = useCallback(async () => {
    if (!userId || !workspaceId) {
      console.log('⏸️ Waiting for userId and workspaceId...');
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      console.log('📸 Loading photos from Supabase...');
      setLoading(true);

      // Get photos from content table
      const { data: contentData, error: contentError } =
        await supabaseRef.current
          .from('content')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('type', 'photo')
          .order('created_at', { ascending: false });

      if (contentError) {
        console.error('❌ Error fetching content:', contentError);
        throw contentError;
      }

      console.log(`📦 Found ${contentData?.length || 0} photos in database`);

      // Get favorites for current user
      const { data: reactionsData, error: reactionsError } =
        await supabaseRef.current
          .from('reactions')
          .select('content_id')
          .eq('user_id', userId)
          .eq('type', 'favorite');

      if (reactionsError) {
        console.warn('⚠️ Error fetching reactions:', reactionsError);
      }

      const favoritesMap = {};
      reactionsData?.forEach((r) => {
        favoritesMap[r.content_id] = true;
      });

      // Transform to photo format
      const photosData = (contentData || [])
        .filter((item) => item.storage_path)
        .map((item) => {
          const publicUrl = supabaseRef.current.storage
            .from('gallery')
            .getPublicUrl(item.storage_path).data.publicUrl;

          return {
            id: item.id,
            storagePath: item.storage_path,
            url: publicUrl,
            caption: item.title || item.description || 'Sem título',
            date: item.created_at
              ? item.created_at.split('T')[0]
              : new Date().toISOString().split('T')[0],
            favorite: !!favoritesMap[item.id],
            tags: item.data?.tags || [],
            category: item.category || 'momentos',
          };
        });

      console.log(`📦 Photos to display: ${photosData.length}`);
      setPhotos(photosData);
      setError(null);
      console.log(`✅ Loaded ${photosData.length} photos successfully`);
    } catch (err) {
      console.error('❌ Error loading photos:', err);
      setError(err.message);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [userId, workspaceId]);

  // Initial load
  useEffect(() => {
    if (userId && workspaceId) {
      loadPhotos();
    }
  }, [userId, workspaceId, loadPhotos]);

  // Realtime subscription
  useEffect(() => {
    if (!userId || !workspaceId) return;

    console.log('🔄 Setting up realtime subscription...');

    const channel = supabaseRef.current
      .channel('photos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('🔄 Content changed:', payload.eventType);

          if (payload.new?.type === 'photo' || payload.old?.type === 'photo') {
            loadPhotos();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (
            payload.eventType === 'INSERT' &&
            payload.new?.type === 'favorite'
          ) {
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === payload.new.content_id ? { ...p, favorite: true } : p
              )
            );
          } else if (
            payload.eventType === 'DELETE' &&
            payload.old?.type === 'favorite'
          ) {
            setPhotos((prev) =>
              prev.map((p) =>
                p.id === payload.old.content_id ? { ...p, favorite: false } : p
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
      });

    return () => {
      console.log('👋 Unsubscribing from realtime');
      supabaseRef.current.removeChannel(channel);
    };
  }, [userId, workspaceId, loadPhotos]);

  /**
   * Upload new photos with compression
   */
  const uploadPhotos = async (files) => {
    if (!userId || !workspaceId || !files.length) {
      console.error('❌ Missing userId, workspaceId, or files');
      return {
        results: [],
        errors: [{ error: 'Usuário ou workspace não encontrado' }],
      };
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        console.log(`\n📤 Processing ${i + 1}/${files.length}: ${file.name}`);
        console.log(
          `   Original type: ${file.type}, size: ${(
            file.size /
            1024 /
            1024
          ).toFixed(2)}MB`
        );

        // Compress image before upload
        let fileToUpload = file;
        try {
          console.log('🗜️ Starting compression...');
          fileToUpload = await compressImage(file);
          console.log(
            `   ✅ Compressed type: ${fileToUpload.type}, size: ${(
              fileToUpload.size /
              1024 /
              1024
            ).toFixed(2)}MB`
          );
        } catch (compressionError) {
          console.warn(
            '⚠️ Compression failed, using original:',
            compressionError
          );
          fileToUpload = file;
        }

        console.log(
          `📤 Uploading ${i + 1}/${files.length}: ${file.name} (${
            fileToUpload.type
          })`
        );
        console.log(`   Workspace: ${workspaceId}`);

        // Upload to Supabase Storage
        console.time(`upload-${i}`);
        const uploadResult = await uploadPhoto(fileToUpload, workspaceId);
        console.timeEnd(`upload-${i}`);

        if (!uploadResult || !uploadResult.url || !uploadResult.path) {
          throw new Error('Upload retornou dados inválidos');
        }

        const { url, path } = uploadResult;
        console.log(`✅ File uploaded to storage: ${path}`);

        // Create content record
        console.log('💾 Creating content record in database...');
        const { data: contentData, error: contentError } =
          await supabaseRef.current
            .from('content')
            .insert({
              workspace_id: workspaceId,
              author_id: userId,
              type: 'photo',
              title: file.name.replace(/\.[^/.]+$/, ''),
              storage_path: path,
              category: 'momentos',
              data: {
                original_name: file.name,
                size: fileToUpload.size,
                mime_type: fileToUpload.type,
                compressed: fileToUpload !== file,
              },
            })
            .select()
            .single();

        if (contentError) {
          console.error('❌ Error creating content record:', contentError);

          // If DB insert fails, delete the uploaded file
          try {
            await deletePhoto(path);
            console.log('🧹 Cleaned up orphaned file from storage');
          } catch (cleanupError) {
            console.error('❌ Failed to cleanup orphaned file:', cleanupError);
          }

          throw contentError;
        }

        console.log('✅ Content record created:', contentData.id);
        results.push({ id: contentData.id, url, path });
        console.log(`✅ Upload complete ${i + 1}/${files.length}`);
      } catch (err) {
        console.error(`❌ Error uploading ${file.name}:`, err);
        errors.push({
          file: file.name,
          error: err.message || 'Erro desconhecido',
        });
      }
    }

    console.log(
      `\n📊 Upload complete: ${results.length} success, ${errors.length} errors`
    );

    // Reload photos after upload
    if (results.length > 0) {
      setTimeout(() => {
        loadPhotos();
      }, 500);
    }

    return { results, errors };
  };

  /**
   * Delete a photo
   */
  const removePhoto = async (photoId) => {
    if (!userId) {
      console.error('❌ No userId');
      return;
    }

    try {
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) {
        console.error('❌ Photo not found:', photoId);
        return;
      }

      console.log(`🗑️ Deleting photo: ${photoId}`);

      // Delete from storage first
      if (photo.storagePath) {
        try {
          await deletePhoto(photo.storagePath);
          console.log('✅ Deleted from storage');
        } catch (storageError) {
          console.warn(
            '⚠️ Storage delete failed (file may not exist):',
            storageError
          );
        }
      }

      // Delete content record
      const { error } = await supabaseRef.current
        .from('content')
        .delete()
        .eq('id', photoId);

      if (error) {
        console.error('❌ Error deleting from database:', error);
        throw error;
      }

      console.log('✅ Photo deleted successfully');

      // Optimistically update UI
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      console.error('❌ Error deleting photo:', err);
      throw err;
    }
  };

  /**
   * Toggle favorite status
   */
  const toggleFavorite = async (photoId) => {
    if (!userId) {
      console.error('❌ No userId');
      return;
    }

    const photo = photos.find((p) => p.id === photoId);
    if (!photo) {
      console.error('❌ Photo not found:', photoId);
      return;
    }

    const currentFavoriteStatus = photo.favorite;
    const newFavoriteStatus = !currentFavoriteStatus;

    // Optimistic update
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, favorite: newFavoriteStatus } : p
      )
    );

    try {
      if (currentFavoriteStatus) {
        const { error } = await supabaseRef.current
          .from('reactions')
          .delete()
          .eq('content_id', photoId)
          .eq('user_id', userId)
          .eq('type', 'favorite');

        if (error) throw error;
        console.log('✅ Removed favorite');
      } else {
        const { error } = await supabaseRef.current.from('reactions').insert({
          content_id: photoId,
          user_id: userId,
          type: 'favorite',
        });

        if (error && error.code !== '23505') throw error;
        console.log('✅ Added favorite');
      }
    } catch (err) {
      console.error('❌ Error toggling favorite:', err);

      // Rollback on error
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, favorite: currentFavoriteStatus } : p
        )
      );
    }
  };

  /**
   * Update photo caption
   */
  const updatePhotoCaption = async (photoId, newCaption) => {
    if (!supabaseRef.current || !userRef.current) {
      throw new Error('Supabase client or user not initialized');
    }

    try {
      const { error } = await supabaseRef.current
        .from('content')
        .update({ description: newCaption })
        .eq('id', photoId);

      if (error) throw error;

      // Update local state
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) =>
          photo.id === photoId ? { ...photo, caption: newCaption } : photo
        )
      );

      return true;
    } catch (error) {
      // console.error('Error updating caption:', error);
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

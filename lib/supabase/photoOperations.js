/**
 * Supabase photo operations
 */
// import { compressImage } from '@/lib/utils/imageCompression';

/**
 * Upload photo to Supabase Storage
 */
export async function uploadPhotoToStorage(
  supabase,
  file,
  userId,
  workspaceId
) {
  if (!file) throw new Error('No file provided for upload');
  if (!workspaceId) throw new Error('Workspace ID is required');

  // Gera nome único: photos/{workspace}/{timestamp}-{random}.{ext}
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `photos/${workspaceId}/${timestamp}-${randomStr}.${ext}`;

  // Determine correct content type - default to jpeg if not provided or invalid
  let contentType = file.type;
  if (!contentType || !contentType.startsWith('image/')) {
    // If file type is missing or invalid, use image/jpeg as fallback
    contentType = 'image/jpeg';
  }

  // Upload direto, sem compressão, via SDK oficial
  const { data, error } = await supabase.storage
    .from('gallery')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: contentType, // Always provide explicit content type
    });

  if (error) {
    throw error;
  }

  // Gera URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from('gallery').getPublicUrl(fileName);

  // Retorna metadados pro restante do fluxo
  return {
    path: data?.path || fileName,
    publicUrl,
    originalName: file.name,
    size: file.size,
    mimeType: file.type,
  };
}

/**
 * Create photo record in database
 */
export async function createPhotoRecord(
  supabase,
  workspaceId,
  userId,
  storagePath,
  publicUrl,
  metadata,
  caption = ''
) {
  // Extrair título do nome original do arquivo (sem extensão)
  const title = metadata.originalName.replace(/\.[^/.]+$/, '');

  const insertData = {
    workspace_id: workspaceId,
    author_id: userId,
    type: 'photo',
    category: 'momentos',
    title: title,
    description: caption || null,
    storage_path: storagePath,
    data: {
      size: metadata.size,
      mime_type: metadata.mimeType,
      compressed: true,
      original_name: metadata.originalName,
    },
  };

  console.log('📝 Insert data:', JSON.stringify(insertData, null, 2));

  const { data, error } = await supabase
    .from('content')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete photo from storage
 */
export async function deletePhotoFromStorage(supabase, storagePath) {
  const { error } = await supabase.storage
    .from('gallery')
    .remove([storagePath]);
  if (error) throw error;
}

/**
 * Delete photo record from database
 */
export async function deletePhotoRecord(supabase, photoId) {
  const { error } = await supabase.from('content').delete().eq('id', photoId);
  if (error) throw error;
}

/**
 * Update photo caption
 */
export async function updatePhotoCaption(supabase, photoId, newCaption) {
  const { error } = await supabase
    .from('content')
    .update({ description: newCaption })
    .eq('id', photoId);

  if (error) throw error;
}

/**
 * Toggle photo favorite
 */
export async function togglePhotoFavorite(supabase, photoId, userId) {
  // Check if already favorited
  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('content_id', photoId)
    .eq('user_id', userId)
    .eq('type', 'favorite')
    .single();

  if (existing) {
    // Remove favorite
    await supabase.from('reactions').delete().eq('id', existing.id);
    return false;
  } else {
    // Add favorite
    await supabase.from('reactions').insert({
      content_id: photoId,
      user_id: userId,
      type: 'favorite',
    });
    return true;
  }
}

/**
 * Fetch all photos for workspace
 */
export async function fetchWorkspacePhotos(supabase, workspaceId) {
  const { data, error } = await supabase
    .from('content')
    .select(
      `
      *,
      reactions (
        id,
        type,
        user_id,
        profiles (
          full_name,
          avatar_url
        )
      )
    `
    )
    .eq('workspace_id', workspaceId)
    .eq('type', 'photo')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

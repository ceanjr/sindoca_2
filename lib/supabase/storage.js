import { createClient } from './client';

/**
 * Upload photo to Supabase Storage using RAW API
 * This bypasses the SDK to have full control over headers
 */
export async function uploadPhoto(file, workspaceId) {
  const supabase = createClient();

  // Validate inputs
  if (!file) {
    throw new Error('File is required');
  }
  if (!workspaceId) {
    throw new Error('Workspace ID is required');
  }

  // Get auth token
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}-${sanitizedName}`;
  const filePath = `photos/${workspaceId}/${fileName}`;

  console.log(`📤 Uploading to: ${filePath}`);
  console.log(`📦 File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`📄 MIME type: ${file.type}`);

  try {
    console.log('📡 Using RAW API to upload with correct headers...');

    // Get the Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/gallery/${filePath}`;

    console.log(`🌐 Upload URL: ${uploadUrl}`);

    // Upload using fetch with explicit headers
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'image/jpeg', // FORCE this header
        'x-upsert': 'false',
      },
      body: file, // Send the file directly
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Upload response:', result);
    console.log(`✅ File uploaded: ${filePath}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log(`🔗 Public URL: ${urlData.publicUrl}`);

    // Verify the URL and content-type
    console.log('🔍 Verifying URL accessibility...');
    try {
      const verifyResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
      const contentType = verifyResponse.headers.get('content-type');

      console.log(`📊 URL status: ${verifyResponse.status}`);
      console.log(`📄 Content-Type from server: ${contentType}`);

      if (contentType && !contentType.startsWith('image/')) {
        console.error(
          `❌ Server STILL returned wrong content-type: ${contentType}`
        );
        console.error(
          '   Supabase is detecting MIME type from file content, not our header!'
        );
      }
    } catch (fetchError) {
      console.warn('⚠️ Could not verify URL:', fetchError.message);
    }

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

/**
 * Delete photo from Supabase Storage
 */
export async function deletePhoto(storagePath) {
  if (!storagePath) {
    console.warn('⚠️ No storage path provided');
    return;
  }

  const supabase = createClient();

  console.log(`🗑️ Deleting from storage: ${storagePath}`);

  const { error } = await supabase.storage
    .from('gallery')
    .remove([storagePath]);

  if (error) {
    console.error('❌ Error deleting from Supabase Storage:', error);
    throw error;
  }

  console.log('✅ Deleted from storage successfully');
}

/**
 * List all photos in Supabase Storage for a workspace
 */
export async function listPhotos(workspaceId) {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from('gallery')
    .list(`photos/${workspaceId}`, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('❌ Error listing photos:', error);
    throw error;
  }

  return data || [];
}

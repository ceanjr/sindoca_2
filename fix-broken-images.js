/**
 * Script to fix images with wrong content-type in Supabase Storage
 * Downloads, deletes, and re-uploads with correct MIME type
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBrokenImages() {
  console.log('🔧 Starting to fix broken images...\n');

  // 1. Get all photos from database
  console.log('1️⃣ Fetching all photos from database...');
  const { data: photos, error: photosError } = await supabase
    .from('content')
    .select('*')
    .eq('type', 'photo')
    .order('created_at', { ascending: false });

  if (photosError) {
    console.error('❌ Error fetching photos:', photosError);
    return;
  }

  console.log(`   Found ${photos.length} photos\n`);

  let fixedCount = 0;
  let errorCount = 0;

  // 2. Check each photo's storage file
  for (const photo of photos) {
    const storagePath = photo.storage_path;
    if (!storagePath) {
      console.log(`⏭️  Skipping ${photo.id} - no storage path`);
      continue;
    }

    console.log(`\n🔍 Checking: ${photo.id}`);
    console.log(`   Path: ${storagePath}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(storagePath);

    try {
      // Check current content-type
      const headResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
      const currentContentType = headResponse.headers.get('content-type');

      console.log(`   Current Content-Type: ${currentContentType}`);

      // If it's not an image type, fix it
      if (!currentContentType || !currentContentType.startsWith('image/')) {
        console.log(`   ⚠️  BROKEN! Needs fixing...`);

        // Download the file
        console.log(`   📥 Downloading...`);
        const downloadResponse = await fetch(urlData.publicUrl);
        const buffer = await downloadResponse.arrayBuffer();

        // Detect actual image type from magic bytes
        const bytes = new Uint8Array(buffer);
        let detectedType = 'image/jpeg'; // default

        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
          detectedType = 'image/jpeg';
        } else if (
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47
        ) {
          detectedType = 'image/png';
        } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
          detectedType = 'image/gif';
        } else if (
          bytes[0] === 0x52 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x46
        ) {
          detectedType = 'image/webp';
        }

        console.log(`   🔍 Detected type: ${detectedType}`);

        // Delete old file
        console.log(`   🗑️  Deleting old file...`);
        const { error: deleteError } = await supabase.storage
          .from('gallery')
          .remove([storagePath]);

        if (deleteError) {
          console.error(`   ❌ Delete error:`, deleteError);
          errorCount++;
          continue;
        }

        // Re-upload with correct content-type
        console.log(`   📤 Re-uploading with correct content-type...`);
        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(storagePath, buffer, {
            contentType: detectedType,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`   ❌ Upload error:`, uploadError);
          errorCount++;
          continue;
        }

        // Verify fix
        const verifyResponse = await fetch(urlData.publicUrl, { method: 'HEAD' });
        const newContentType = verifyResponse.headers.get('content-type');
        console.log(`   ✅ FIXED! New Content-Type: ${newContentType}`);

        fixedCount++;
      } else {
        console.log(`   ✅ OK - already has correct content-type`);
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${photo.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   Total photos: ${photos.length}`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   OK: ${photos.length - fixedCount - errorCount}`);
}

fixBrokenImages().catch(console.error);

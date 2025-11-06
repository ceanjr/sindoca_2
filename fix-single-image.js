/**
 * Fix the specific broken image
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

async function fixImage() {
  const storagePath = 'photos/99c966b1-98b9-4905-8d0d-80e357336114/1762404360217-th52f.jpeg';

  console.log('🔧 Fixing broken image...');
  console.log(`Path: ${storagePath}\n`);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('gallery')
    .getPublicUrl(storagePath);

  console.log(`URL: ${urlData.publicUrl}`);

  // Download the file
  console.log('\n1️⃣ Downloading file...');
  const downloadResponse = await fetch(urlData.publicUrl);
  if (!downloadResponse.ok) {
    console.error('❌ Failed to download:', downloadResponse.status);
    return;
  }
  const buffer = await downloadResponse.arrayBuffer();
  console.log(`   ✅ Downloaded ${buffer.byteLength} bytes`);

  // Check magic bytes to confirm it's JPEG
  const bytes = new Uint8Array(buffer);
  console.log(`   Magic bytes: ${bytes[0].toString(16)} ${bytes[1].toString(16)} ${bytes[2].toString(16)}`);

  let detectedType = 'image/jpeg';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    console.log('   ✅ Confirmed: JPEG format');
    detectedType = 'image/jpeg';
  } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    console.log('   ✅ Detected: PNG format');
    detectedType = 'image/png';
  } else {
    console.log('   ⚠️  Unknown format, assuming JPEG');
  }

  // Delete the old file
  console.log('\n2️⃣ Deleting old file...');
  const { error: deleteError } = await supabase.storage
    .from('gallery')
    .remove([storagePath]);

  if (deleteError) {
    console.error('   ❌ Delete failed:', deleteError);
    return;
  }
  console.log('   ✅ Deleted');

  // Re-upload with correct content-type
  console.log('\n3️⃣ Re-uploading with correct content-type...');
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('gallery')
    .upload(storagePath, buffer, {
      contentType: detectedType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('   ❌ Upload failed:', uploadError);
    return;
  }
  console.log('   ✅ Uploaded successfully');

  // Verify the fix
  console.log('\n4️⃣ Verifying fix...');
  const verifyResponse = await fetch(urlData.publicUrl + '?t=' + Date.now(), {
    method: 'HEAD',
    cache: 'no-cache'
  });
  const newContentType = verifyResponse.headers.get('content-type');
  console.log(`   Status: ${verifyResponse.status}`);
  console.log(`   Content-Type: ${newContentType}`);

  if (newContentType && newContentType.startsWith('image/')) {
    console.log('\n✅ SUCCESS! Image is now fixed and should load correctly in the browser.');
  } else {
    console.log('\n⚠️  Still showing wrong content-type. May need cache to clear.');
  }
}

fixImage().catch(console.error);

/**
 * Check the latest uploaded image
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

async function checkLatestUpload() {
  const storagePath = 'photos/99c966b1-98b9-4905-8d0d-80e357336114/1762404954723-cwwhtc.jpg';
  const photoId = 'f6119673-9884-4eaa-b9cf-3914811e8d05';

  console.log('🔍 Checking latest upload...');
  console.log('Photo ID:', photoId);
  console.log('Storage path:', storagePath);
  console.log('');

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('gallery')
    .getPublicUrl(storagePath);

  console.log('Expected URL:', urlData.publicUrl);
  console.log('');

  // Check if file exists in storage
  console.log('1️⃣ Checking storage file...');
  const { data: files, error: listError } = await supabase.storage
    .from('gallery')
    .list('photos/99c966b1-98b9-4905-8d0d-80e357336114', {
      limit: 100,
    });

  if (listError) {
    console.error('   ❌ Error:', listError);
  } else {
    const targetFile = files.find(f => f.name === '1762404954723-cwwhtc.jpg');
    if (targetFile) {
      console.log('   ✅ File found in storage!');
      console.log('   Metadata:', JSON.stringify(targetFile.metadata, null, 2));
    } else {
      console.log('   ❌ File NOT found in storage!');
      console.log('   Available files:', files.map(f => f.name));
    }
  }
  console.log('');

  // Test URL accessibility
  console.log('2️⃣ Testing URL accessibility...');
  try {
    const response = await fetch(urlData.publicUrl + '?t=' + Date.now(), {
      method: 'HEAD',
      cache: 'no-cache'
    });
    console.log('   Status:', response.status, response.statusText);
    console.log('   Content-Type:', response.headers.get('content-type'));
    console.log('   Content-Length:', response.headers.get('content-length'));

    if (response.status === 404) {
      console.log('   ❌ File does not exist in storage!');
    } else if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        console.log('   ✅ File accessible with correct content-type!');
      } else {
        console.log('   ❌ File has WRONG content-type:', contentType);

        // Download a bit to check magic bytes
        const fullResponse = await fetch(urlData.publicUrl);
        const buffer = await fullResponse.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        console.log('   Magic bytes:',
          Array.from(bytes.slice(0, 10))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ')
        );
      }
    }
  } catch (error) {
    console.error('   ❌ Fetch error:', error.message);
  }
  console.log('');

  // List all files to see the pattern
  console.log('3️⃣ All files in workspace folder:');
  const { data: allFiles, error: allError } = await supabase.storage
    .from('gallery')
    .list('photos/99c966b1-98b9-4905-8d0d-80e357336114', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (allError) {
    console.error('   ❌ Error:', allError);
  } else {
    allFiles.forEach((file, idx) => {
      const mimeType = file.metadata?.mimetype || 'unknown';
      const status = mimeType.startsWith('image/') ? '✅' : '❌';
      console.log(`   ${status} ${file.name} - ${mimeType}`);
    });
  }
}

checkLatestUpload().catch(console.error);

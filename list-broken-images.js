/**
 * List all broken images that need to be deleted and re-uploaded
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

async function listBrokenImages() {
  console.log('🔍 Scanning for broken images...\n');

  // Get workspace folder
  const { data: folders, error: foldersError } = await supabase.storage
    .from('gallery')
    .list('photos', { limit: 100 });

  if (foldersError) {
    console.error('❌ Error listing folders:', foldersError);
    return;
  }

  let totalFiles = 0;
  let brokenFiles = 0;
  const brokenList = [];

  for (const folder of folders) {
    const workspaceId = folder.name;
    console.log(`\n📁 Checking workspace: ${workspaceId}`);

    const { data: files, error: filesError } = await supabase.storage
      .from('gallery')
      .list(`photos/${workspaceId}`, { limit: 100 });

    if (filesError) {
      console.error('   ❌ Error:', filesError);
      continue;
    }

    for (const file of files) {
      totalFiles++;
      const mimeType = file.metadata?.mimetype || 'unknown';

      // Check if it's a broken file
      if (!mimeType.startsWith('image/')) {
        brokenFiles++;
        const path = `photos/${workspaceId}/${file.name}`;
        brokenList.push(path);
        console.log(`   ❌ BROKEN: ${file.name} (${mimeType})`);
      } else {
        console.log(`   ✅ OK: ${file.name} (${mimeType})`);
      }
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   Total files: ${totalFiles}`);
  console.log(`   Broken files: ${brokenFiles}`);
  console.log(`   OK files: ${totalFiles - brokenFiles}`);

  if (brokenList.length > 0) {
    console.log(`\n\n⚠️  Broken images to delete:`);
    brokenList.forEach(path => console.log(`   - ${path}`));
    console.log(`\n💡 To fix: Delete these images from the gallery UI and re-upload them.`);
  } else {
    console.log(`\n✅ No broken images found!`);
  }
}

listBrokenImages().catch(console.error);

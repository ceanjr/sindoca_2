/**
 * Check database structure and content
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

async function checkDatabase() {
  console.log('🔍 Checking database structure and content...\n');

  // Try to get all content records
  console.log('1️⃣ Fetching all content records...');
  const { data: allContent, error: allError } = await supabase
    .from('content')
    .select('*')
    .limit(10);

  if (allError) {
    console.error('   ❌ Error:', allError);
  } else {
    console.log(`   ✅ Found ${allContent?.length || 0} content records`);
    if (allContent && allContent.length > 0) {
      console.log('\n   Sample record:');
      console.log(JSON.stringify(allContent[0], null, 2));
    }
  }

  // Try to get specific photo by ID
  console.log('\n2️⃣ Checking for specific photo ID...');
  const photoId = '0f4d803c-801b-4152-9f61-9fd17182c106';
  const { data: specificPhoto, error: specificError } = await supabase
    .from('content')
    .select('*')
    .eq('id', photoId);

  if (specificError) {
    console.error('   ❌ Error:', specificError);
  } else {
    console.log(`   Found ${specificPhoto?.length || 0} records with ID ${photoId}`);
    if (specificPhoto && specificPhoto.length > 0) {
      console.log('\n   Photo record:');
      console.log(JSON.stringify(specificPhoto[0], null, 2));
    }
  }

  // Check storage files
  console.log('\n3️⃣ Checking storage bucket...');
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    console.error('   ❌ Error:', bucketError);
  } else {
    console.log(`   ✅ Found ${buckets?.length || 0} storage buckets`);
    buckets.forEach((bucket) => {
      console.log(`      - ${bucket.name} (public: ${bucket.public})`);
    });
  }

  // List files in gallery bucket
  console.log('\n4️⃣ Listing files in gallery bucket...');
  const { data: folders, error: listError } = await supabase.storage
    .from('gallery')
    .list('photos', {
      limit: 100,
      offset: 0,
    });

  if (listError) {
    console.error('   ❌ Error:', listError);
  } else {
    console.log(`   ✅ Found ${folders?.length || 0} items in photos/`);
    if (folders && folders.length > 0) {
      console.log('\n   Workspace folders:');
      folders.forEach((folder) => {
        console.log(`      - ${folder.name}`);
      });

      // List files in first workspace folder
      if (folders[0]) {
        const workspaceId = folders[0].name;
        const { data: files, error: filesError } = await supabase.storage
          .from('gallery')
          .list(`photos/${workspaceId}`, {
            limit: 10,
          });

        if (filesError) {
          console.error(`   ❌ Error listing files in ${workspaceId}:`, filesError);
        } else {
          console.log(`\n   Files in photos/${workspaceId}:`);
          files.forEach((file) => {
            console.log(`      - ${file.name} (${file.metadata?.mimetype || 'unknown type'})`);
          });
        }
      }
    }
  }
}

checkDatabase().catch(console.error);

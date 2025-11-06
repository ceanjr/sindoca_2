/**
 * Diagnostic script to check Supabase storage and image accessibility
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

async function diagnoseImage() {
  console.log('🔍 Diagnosing image upload issue...\n');

  // The failing image from your error
  const photoId = '0f4d803c-801b-4152-9f61-9fd17182c106';
  const storagePath = 'photos/99c966b1-98b9-4905-8d0d-80e357336114/1762404360217-th52f.jpeg';
  const expectedUrl = 'https://wpgaxoqbrdyfihwzoxlc.supabase.co/storage/v1/object/public/gallery/photos/99c966b1-98b9-4905-8d0d-80e357336114/1762404360217-th52f.jpeg';

  console.log('📊 Photo details:');
  console.log('  ID:', photoId);
  console.log('  Storage path:', storagePath);
  console.log('  Expected URL:', expectedUrl);
  console.log('');

  // 1. Check database record
  console.log('1️⃣ Checking database record...');
  const { data: dbRecord, error: dbError } = await supabase
    .from('content')
    .select('*')
    .eq('id', photoId)
    .single();

  if (dbError) {
    console.error('  ❌ Database error:', dbError.message);
  } else {
    console.log('  ✅ Database record exists');
    console.log('  Storage path in DB:', dbRecord.storage_path);
    console.log('  Data field:', JSON.stringify(dbRecord.data, null, 2));
  }
  console.log('');

  // 2. Check if file exists in storage
  console.log('2️⃣ Checking if file exists in storage...');
  const { data: fileList, error: listError } = await supabase.storage
    .from('gallery')
    .list('photos/99c966b1-98b9-4905-8d0d-80e357336114', {
      limit: 100,
      offset: 0,
    });

  if (listError) {
    console.error('  ❌ Storage list error:', listError.message);
  } else {
    console.log(`  ✅ Found ${fileList.length} files in workspace folder`);
    const targetFile = fileList.find(f => f.name === '1762404360217-th52f.jpeg');
    if (targetFile) {
      console.log('  ✅ Target file found!');
      console.log('  File details:', JSON.stringify(targetFile, null, 2));
    } else {
      console.log('  ❌ Target file NOT found in storage!');
      console.log('  Available files:', fileList.map(f => f.name));
    }
  }
  console.log('');

  // 3. Try to fetch the URL directly
  console.log('3️⃣ Testing URL accessibility...');
  try {
    const response = await fetch(expectedUrl, { method: 'HEAD' });
    console.log('  Status:', response.status, response.statusText);
    console.log('  Content-Type:', response.headers.get('content-type'));
    console.log('  Content-Length:', response.headers.get('content-length'));

    if (response.status === 200) {
      console.log('  ✅ URL is accessible');
    } else {
      console.log('  ❌ URL returned error status');
    }
  } catch (fetchError) {
    console.error('  ❌ Fetch error:', fetchError.message);
  }
  console.log('');

  // 4. List all recent uploads
  console.log('4️⃣ Listing recent photos from database...');
  const { data: recentPhotos, error: recentError } = await supabase
    .from('content')
    .select('id, storage_path, created_at, data')
    .eq('type', 'photo')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentError) {
    console.error('  ❌ Error:', recentError.message);
  } else {
    console.log(`  Found ${recentPhotos.length} recent photos:`);
    recentPhotos.forEach((photo, idx) => {
      console.log(`\n  Photo ${idx + 1}:`);
      console.log('    ID:', photo.id);
      console.log('    Storage path:', photo.storage_path);
      console.log('    Created:', photo.created_at);
      console.log('    Data:', JSON.stringify(photo.data, null, 2));

      // Try to get public URL
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(photo.storage_path);
      console.log('    Public URL:', urlData.publicUrl);
    });
  }
}

diagnoseImage().catch(console.error);

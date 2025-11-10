import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAvatars() {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📸 Current Avatars in Database:\n');
  data.forEach(profile => {
    console.log(`👤 ${profile.full_name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Avatar: ${profile.avatar_url || '❌ NOT SET'}\n`);
  });
}

checkAvatars();

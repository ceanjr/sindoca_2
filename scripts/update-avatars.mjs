/**
 * Script to update user avatars in Supabase
 * Sets avatar_url to public images (eu.png and sindy.png)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAvatars() {
  console.log('🔍 Fetching user profiles...');

  // Get all profiles
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url')
    .order('created_at');

  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.error('❌ No profiles found');
    process.exit(1);
  }

  console.log(`📋 Found ${profiles.length} profiles:\n`);
  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name} (${profile.email})`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Current avatar: ${profile.avatar_url || 'none'}\n`);
  });

  // Map emails/names to avatar files
  const avatarMap = {
    'Célio Júnior': '/images/eu.png',
    'Sindy': '/images/sindy.png',
  };

  console.log('🔄 Updating avatars...\n');

  for (const profile of profiles) {
    // Try to match by name first, then by email patterns
    let avatarUrl = null;
    
    if (profile.full_name?.includes('Célio') || profile.full_name?.includes('Celio')) {
      avatarUrl = avatarMap['Célio Júnior'];
    } else if (profile.full_name?.includes('Sindy')) {
      avatarUrl = avatarMap['Sindy'];
    } else if (profile.email?.includes('celio') || profile.email?.includes('cean')) {
      avatarUrl = avatarMap['Célio Júnior'];
    } else if (profile.email?.includes('sindy')) {
      avatarUrl = avatarMap['Sindy'];
    }

    if (avatarUrl) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`❌ Error updating ${profile.full_name}:`, updateError);
      } else {
        console.log(`✅ Updated ${profile.full_name} → ${avatarUrl}`);
      }
    } else {
      console.log(`⚠️  Could not determine avatar for ${profile.full_name}`);
    }
  }

  console.log('\n🎉 Avatar update complete!');
  console.log('\n📸 Avatar URLs set:');
  console.log('   Célio Júnior → /images/eu.png');
  console.log('   Sindy → /images/sindy.png');
  console.log('\n💡 These images are served from public/images/ directory');
}

updateAvatars().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

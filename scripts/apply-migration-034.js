/**
 * Script to apply migration 034 - Fix trigger final
 * Run with: node scripts/apply-migration-034.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  console.log('🔧 Connecting to Supabase...');
  console.log('URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '034_fix_trigger_final.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('\n📄 Migration 034: Fix trigger final');
  console.log('─'.repeat(80));
  console.log('This migration recreates the handle_new_user trigger with SECURITY DEFINER');
  console.log('to properly bypass RLS and allow profile creation during signup.');
  console.log('─'.repeat(80));

  console.log('\n⚠️  NOTE: This script requires SUPABASE_SERVICE_ROLE_KEY');
  console.log('If you only have ANON_KEY, you must apply this migration manually');
  console.log('via Supabase Dashboard → SQL Editor\n');

  console.log('📋 Migration SQL:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));

  console.log('\n✋ MANUAL STEPS REQUIRED:');
  console.log('1. Copy the SQL above');
  console.log('2. Go to: https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/sql/new');
  console.log('3. Paste the SQL in the editor');
  console.log('4. Click "Run" to execute');
  console.log('5. Verify success message appears');
  console.log('\n⚡ After applying, try creating a new user to test!');

  console.log('\n💾 SQL has been copied to clipboard-ready format above.');
}

applyMigration().catch(console.error);

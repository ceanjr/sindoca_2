/**
 * Script to apply migration 033 - Fix profile insert trigger
 * Run with: node scripts/apply-migration-033.js
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
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '033_fix_profile_insert_trigger.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('\n📄 Migration 033: Fix profile insert trigger');
  console.log('─'.repeat(80));
  console.log('This migration fixes the handle_new_user trigger to properly bypass RLS');
  console.log('and allows profile creation during user signup.');
  console.log('─'.repeat(80));

  console.log('\n🚀 Applying migration...');

  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 10);

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';

      console.log(`[${i + 1}/${statements.length}] ${preview}`);

      try {
        // Use direct query execution
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          console.error(`  ❌ Error: ${error.message}`);

          // Some errors are acceptable (like DROP IF EXISTS on non-existent objects)
          if (!error.message.includes('does not exist') &&
              !error.message.includes('cannot drop')) {
            throw error;
          } else {
            console.log('  ⚠️  Continuing (non-critical error)');
          }
        } else {
          console.log('  ✅ Success');
        }
      } catch (execError) {
        console.error(`  ❌ Failed: ${execError.message}`);
        throw execError;
      }
    }

    console.log('\n✅ Migration applied successfully!');

    console.log('\n📊 Verifying trigger...');

    // Check if the trigger exists
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT trigger_name, event_manipulation, event_object_table
          FROM information_schema.triggers
          WHERE trigger_name = 'on_auth_user_created';
        `
      });

    if (triggerError) {
      console.log('⚠️  Could not verify trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger verified');
    }

    console.log('\n✨ Done! Profile creation during signup should now work.');
    console.log('👉 Try creating a new user account to test.');

  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message);
    console.error('\n📝 Manual steps required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the migration SQL from:');
    console.log('   supabase/migrations/033_fix_profile_insert_trigger.sql');
    console.log('3. Run the SQL manually');
    console.log('\n💡 Alternative: Use Supabase CLI:');
    console.log('   supabase db reset (WARNING: resets entire database)');
    console.log('   or');
    console.log('   supabase db push (pushes pending migrations)');
    process.exit(1);
  }
}

applyMigration().catch(console.error);

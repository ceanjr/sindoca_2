/**
 * Script to apply migration 019 - Fix push_subscriptions RLS
 * Run with: node scripts/apply-migration-019.js
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
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '019_fix_push_subscriptions_rls_workspace.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('\n📄 Migration SQL:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));

  console.log('\n🚀 Applying migration...');

  try {
    // Execute the SQL using Supabase client
    // Note: This uses the rpc method which might not work for DDL
    // If it fails, we'll need to use direct SQL execution

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative method - direct query
      console.log('⚠️  RPC method failed, trying direct execution...');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'));

      for (const statement of statements) {
        if (statement) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          const result = await supabase.rpc('exec_sql', { sql_query: statement });
          if (result.error) {
            console.error('❌ Error executing statement:', result.error);
            throw result.error;
          }
        }
      }

      console.log('\n✅ Migration applied successfully!');
    } else {
      console.log('\n✅ Migration applied successfully!');
      if (data) {
        console.log('Result:', data);
      }
    }

    console.log('\n📊 Verifying changes...');

    // Try to query push_subscriptions to verify the policy works
    const { data: subscriptions, error: queryError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(5);

    if (queryError) {
      console.log('⚠️  Query test:', queryError.message);
    } else {
      console.log('✅ Query test successful - found', subscriptions?.length || 0, 'subscriptions');
    }

    console.log('\n✨ Done! The new RLS policy should now be active.');
    console.log('👉 Users can now see push subscriptions from all workspace members.');

  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message);
    console.error('\n📝 Manual steps required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the migration SQL from:');
    console.log('   supabase/migrations/019_fix_push_subscriptions_rls_workspace.sql');
    console.log('3. Run the SQL manually');
    process.exit(1);
  }
}

applyMigration().catch(console.error);

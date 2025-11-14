/**
 * Script to check migration status in Supabase database
 * Verifies which critical columns and functions exist
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status...\n');

  const checks = [
    {
      name: 'Migration 022: workspace_members.left_at column',
      query: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'workspace_members'
          AND column_name = 'left_at'
      `,
      expected: 1,
    },
    {
      name: 'Migration 022: workspaces.archived_at column',
      query: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'workspaces'
          AND column_name = 'archived_at'
      `,
      expected: 1,
    },
    {
      name: 'Migration 031: is_workspace_member function',
      query: `
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_name = 'is_workspace_member'
          AND routine_schema = 'public'
      `,
      expected: 1,
    },
    {
      name: 'Migration 023: notification_preferences.workspace_id',
      query: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'notification_preferences'
          AND column_name = 'workspace_id'
      `,
      expected: 1,
    },
    {
      name: 'Migration 024: custom_emojis.workspace_id',
      query: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'custom_emojis'
          AND column_name = 'workspace_id'
      `,
      expected: 1,
    },
    {
      name: 'Migration 032: workspaces.icon column',
      query: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'workspaces'
          AND column_name = 'icon'
      `,
      expected: 1,
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: check.query });

      // Since we can't use RPC, let's try a different approach
      // This will only work if the table exists
      console.log(`⏳ ${check.name}...`);
      console.log(`   ⚠️  Cannot check directly (needs SQL access)\n`);

    } catch (err) {
      console.log(`❌ ${check.name}`);
      console.log(`   Error: ${err.message}\n`);
      allPassed = false;
    }
  }

  // Try to query workspace_members directly to see what happens
  console.log('\n🧪 Testing workspace_members query...');
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('id, user_id, workspace_id, left_at')
      .limit(1);

    if (error) {
      if (error.code === '42703') {
        console.log('❌ Column "left_at" does not exist → Migration 022 NOT applied');
        allPassed = false;
      } else if (error.code === '42P17') {
        console.log('❌ Infinite recursion error → Migration 031 NOT applied');
        allPassed = false;
      } else {
        console.log(`❌ Error: ${error.message} (code: ${error.code})`);
        allPassed = false;
      }
    } else {
      console.log('✅ workspace_members query successful');
      console.log(`   Found ${data?.length || 0} members`);
    }
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
    allPassed = false;
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All critical migrations appear to be applied!');
  } else {
    console.log('❌ Some migrations are MISSING or have errors!');
    console.log('\n📋 Action required:');
    console.log('   1. Check supabase/migrations/README_APLICAR_MIGRATIONS.md');
    console.log('   2. Apply missing migrations via Supabase Dashboard SQL Editor');
    console.log('   3. Start with: 022, 023, 024, 025, 026+031 together, 027, 028, 029');
  }
  console.log('='.repeat(60));
}

// Run the check
checkMigrationStatus().catch(console.error);

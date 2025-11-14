/**
 * Script para verificar se o schema de workspaces está correto
 * Executa queries no banco para validar estrutura
 */

const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking workspace schema...\n');

  // 1. Verificar colunas de workspaces
  console.log('1️⃣ Checking workspaces table columns...');

  const { data: wsData, error: testError } = await supabase
    .from('workspaces')
    .select('id, name, status, invite_code, archived_at, archived_by, creator_id')
    .limit(1);

  if (testError) {
    console.error('❌ Error querying workspaces:');
    console.error('   Message:', testError.message);
    console.error('   Code:', testError.code);

    if (testError.message.includes('archived_at') || testError.message.includes('archived_by')) {
      console.log('   ⚠️ Migration 022 NOT applied - archived columns missing!');
    }
  } else {
    console.log('✅ Workspaces table accessible with new columns');
  }

  // 2. Verificar constraint de role
  console.log('\n2️⃣ Checking workspace_members role constraint...');
  const { data: testMember, error: memberError } = await supabase
    .from('workspace_members')
    .select('role')
    .limit(1);

  if (memberError) {
    console.error('❌ Error querying workspace_members:', memberError);
  } else {
    console.log('✅ workspace_members table accessible');
    if (testMember && testMember.length > 0) {
      console.log('   Current roles in DB:', testMember.map(m => m.role));
    }
  }

  // 3. Verificar se função generate_unique_invite_code existe
  console.log('\n3️⃣ Checking generate_unique_invite_code function...');
  try {
    const { data: funcData, error: funcError } = await supabase.rpc('generate_unique_invite_code');

    if (funcError) {
      console.error('❌ Function error:', funcError.message);
    } else {
      console.log('✅ Function works! Generated code:', funcData);
    }
  } catch (e) {
    console.error('❌ Function not found or error:', e.message);
  }

  // 4. Verificar notification_preferences schema
  console.log('\n4️⃣ Checking notification_preferences workspace_id...');
  const { data: notifPrefs, error: notifError } = await supabase
    .from('notification_preferences')
    .select('user_id, workspace_id')
    .limit(1);

  if (notifError) {
    console.error('❌ Error:', notifError);
    if (notifError.message.includes('column') && notifError.message.includes('workspace_id')) {
      console.log('   ⚠️ Migration 023 NOT applied - workspace_id column missing!');
    }
  } else {
    console.log('✅ notification_preferences has workspace_id');
  }

  // 5. Verificar custom_emojis schema
  console.log('\n5️⃣ Checking custom_emojis workspace_id...');
  const { data: emojiData, error: emojiError } = await supabase
    .from('custom_emojis')
    .select('id, workspace_id')
    .limit(1);

  if (emojiError) {
    console.error('❌ Error:', emojiError);
    if (emojiError.message.includes('column') && emojiError.message.includes('workspace_id')) {
      console.log('   ⚠️ Migration 024 NOT applied - workspace_id column missing!');
    }
  } else {
    console.log('✅ custom_emojis has workspace_id');
  }

  // 6. Verificar workspaces status constraint
  console.log('\n6️⃣ Checking workspaces status values...');
  const { data: workspaces, error: statusError } = await supabase
    .from('workspaces')
    .select('id, status')
    .limit(5);

  if (statusError) {
    console.error('❌ Error:', statusError);
  } else {
    console.log('✅ Workspaces status values:', workspaces?.map(w => w.status) || []);
  }

  console.log('\n✅ Schema check complete!\n');
  console.log('📋 Summary:');
  console.log('   - If you see column errors, migrations 022-024 may not be applied');
  console.log('   - If role constraint fails, migration 030_SAFE is needed');
  console.log('   - Apply migrations in order: 022 → 023 → 024 → 025 → 026-029 → 030_SAFE');
}

checkSchema().catch(console.error);

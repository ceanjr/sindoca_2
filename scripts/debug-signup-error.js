/**
 * Script para debugar o erro de signup
 * Run with: node scripts/debug-signup-error.js
 */

require('dotenv').config({ path: '.env.local' });

async function debugSignup() {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  console.log('🔧 Connecting to Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Verificar se o trigger existe
  console.log('1️⃣ Verificando se o trigger existe...');
  console.log('─'.repeat(80));

  const checkTriggerSQL = `
    SELECT
      trigger_name,
      event_manipulation,
      event_object_schema,
      event_object_table,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created';
  `;

  console.log('📋 SQL para verificar trigger:');
  console.log(checkTriggerSQL);
  console.log('');
  console.log('⚠️  Execute este SQL no Supabase Dashboard → SQL Editor');
  console.log('    https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/sql/new');
  console.log('');

  // 2. Verificar a função handle_new_user
  console.log('2️⃣ Verificando a função handle_new_user...');
  console.log('─'.repeat(80));

  const checkFunctionSQL = `
    SELECT
      routine_name,
      routine_type,
      security_type,
      routine_definition
    FROM information_schema.routines
    WHERE routine_name = 'handle_new_user'
      AND routine_schema = 'public';
  `;

  console.log('📋 SQL para verificar função:');
  console.log(checkFunctionSQL);
  console.log('');

  // 3. Verificar políticas RLS da tabela profiles
  console.log('3️⃣ Verificando políticas RLS da tabela profiles...');
  console.log('─'.repeat(80));

  const checkRLSSQL = `
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename = 'profiles';
  `;

  console.log('📋 SQL para verificar RLS:');
  console.log(checkRLSSQL);
  console.log('');

  // 4. Testar signup com email de teste
  console.log('4️⃣ Tentando signup de teste...');
  console.log('─'.repeat(80));

  const testEmail = `test-${Date.now()}@teste.com`;
  const testPassword = 'Teste123!@#';
  const testFullName = 'Usuário Teste Debug';

  console.log('📧 Email de teste:', testEmail);
  console.log('🔑 Senha:', testPassword);
  console.log('👤 Nome:', testFullName);
  console.log('');

  console.log('🚀 Executando signup...');

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: testFullName
      }
    }
  });

  if (error) {
    console.log('');
    console.log('❌ ERRO NO SIGNUP:');
    console.log('─'.repeat(80));
    console.log('Message:', error.message);
    console.log('Status:', error.status);
    console.log('Code:', error.code || error.name);
    console.log('');
    console.log('📋 Detalhes completos do erro:');
    console.log(JSON.stringify(error, null, 2));
    console.log('');

    // Diagnóstico baseado no erro
    console.log('🔍 DIAGNÓSTICO:');
    console.log('─'.repeat(80));

    if (error.message.includes('Database error')) {
      console.log('❌ Erro de banco de dados detectado!');
      console.log('');
      console.log('Possíveis causas:');
      console.log('  1. Trigger não existe ou está desabilitado');
      console.log('  2. Função handle_new_user() tem erro de sintaxe');
      console.log('  3. Políticas RLS bloqueando a criação do perfil');
      console.log('  4. Tabela profiles com problema de schema');
      console.log('');
      console.log('🔧 PASSOS PARA RESOLVER:');
      console.log('');
      console.log('A) Verificar logs do Supabase:');
      console.log('   https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/logs/postgres-logs');
      console.log('');
      console.log('B) Recriar o trigger:');
      console.log('   1. Acesse: https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/sql/new');
      console.log('   2. Execute o SQL de supabase/migrations/034_fix_trigger_final.sql');
      console.log('');
      console.log('C) Verificar schema da tabela profiles:');
      console.log('   SELECT * FROM information_schema.columns WHERE table_name = \'profiles\';');
      console.log('');
    } else if (error.message.includes('already registered')) {
      console.log('⚠️  Email já cadastrado');
    } else {
      console.log('⚠️  Erro desconhecido:', error.message);
    }

  } else {
    console.log('');
    console.log('✅ SIGNUP BEM SUCEDIDO!');
    console.log('─'.repeat(80));
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Email confirmado?', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    console.log('');
    console.log('✨ O signup está funcionando! O problema pode ter sido resolvido.');
    console.log('');
    console.log('⚠️  Lembre-se de deletar o usuário de teste depois:');
    console.log('   https://supabase.com/dashboard/project/wpgaxoqbrdyfihwzoxlc/auth/users');
  }

  console.log('');
  console.log('🏁 Debug finalizado!');
}

debugSignup().catch(console.error);

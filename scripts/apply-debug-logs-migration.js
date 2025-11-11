/**
 * Script para aplicar a migration de debug_logs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrada no .env.local');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
    console.log('\n⚠️  Esta migration precisa da SERVICE ROLE KEY para criar tabelas');
    console.log('Por favor, aplique manualmente via Supabase Dashboard (SQL Editor)');
    console.log('Arquivo: supabase/migrations/012_add_debug_logs.sql');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔧 Aplicando migration de debug_logs...\n');

  try {
    // Lê o arquivo SQL
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '012_add_debug_logs.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Executa o SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se RPC não existir, tenta executar diretamente
      console.log('⚠️  Não foi possível executar via RPC');
      console.log('Por favor, aplique manualmente via Supabase Dashboard:');
      console.log('1. Acesse https://app.supabase.com');
      console.log('2. Vá em SQL Editor');
      console.log('3. Cole o conteúdo de: supabase/migrations/012_add_debug_logs.sql');
      console.log('4. Execute a query');
      process.exit(1);
    }

    console.log('✅ Migration aplicada com sucesso!\n');

    // Testa se a tabela existe
    const { data, error: testError } = await supabase
      .from('debug_logs')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Erro ao testar tabela:', testError.message);
      console.log('\nA migration pode não ter sido aplicada corretamente.');
      console.log('Por favor, aplique manualmente via Supabase Dashboard.');
      process.exit(1);
    }

    console.log('✅ Tabela debug_logs criada e funcionando!\n');
    console.log('📋 Próximos passos:');
    console.log('1. Acesse /debug-logs no seu site');
    console.log('2. Peça para a Sindy acessar /musica e conectar o Spotify');
    console.log('3. Volte para /debug-logs e veja todos os logs do processo!');
    console.log('\n🎉 Sistema de logs remotos ativado!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    console.log('\nPor favor, aplique manualmente via Supabase Dashboard:');
    console.log('1. Acesse https://app.supabase.com');
    console.log('2. Vá em SQL Editor');
    console.log('3. Cole o conteúdo de: supabase/migrations/012_add_debug_logs.sql');
    console.log('4. Execute a query');
    process.exit(1);
  }
}

applyMigration();

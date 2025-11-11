/**
 * Script para verificar se a tabela debug_logs existe
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Verificando se a tabela debug_logs existe...\n');

  try {
    const { data, error } = await supabase
      .from('debug_logs')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.error('❌ Tabela debug_logs NÃO existe!\n');
        console.log('📋 Para criar a tabela:');
        console.log('1. Acesse: https://app.supabase.com');
        console.log('2. Vá em SQL Editor > New Query');
        console.log('3. Cole o conteúdo de: supabase/migrations/012_add_debug_logs.sql');
        console.log('4. Execute (Ctrl+Enter)');
        console.log('\nOu veja as instruções em: APLICAR_DEBUG_LOGS_MIGRATION.md');
        process.exit(1);
      }

      if (error.code === '42501') {
        console.error('❌ Erro de permissão (RLS)!\n');
        console.log('A tabela existe mas você não tem permissão para acessá-la.');
        console.log('Verifique as políticas de RLS no Supabase Dashboard.');
        process.exit(1);
      }

      console.error('❌ Erro ao acessar tabela:', error);
      console.log('\nDetalhes:', {
        code: error.code,
        message: error.message,
        hint: error.hint,
      });
      process.exit(1);
    }

    console.log('✅ Tabela debug_logs existe e está acessível!\n');

    // Contar logs existentes
    const { count, error: countError } = await supabase
      .from('debug_logs')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`📊 Total de logs: ${count || 0}`);
    }

    // Mostrar últimos logs
    const { data: recentLogs, error: logsError } = await supabase
      .from('debug_logs')
      .select('created_at, level, category, message, user_email')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!logsError && recentLogs && recentLogs.length > 0) {
      console.log('\n📝 Últimos logs:');
      recentLogs.forEach((log) => {
        const date = new Date(log.created_at).toLocaleString('pt-BR');
        console.log(`  ${log.level.toUpperCase()} | ${log.category} | ${log.message}`);
        console.log(`  👤 ${log.user_email || 'Anônimo'} | ${date}`);
        console.log('');
      });
    } else if (!logsError) {
      console.log('\n📝 Nenhum log registrado ainda');
    }

    console.log('\n✅ Tudo pronto! Acesse /debug-logs no site para ver a interface.');
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

checkTable();

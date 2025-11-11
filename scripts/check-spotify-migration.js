/**
 * Script para verificar se a migration do Spotify foi aplicada
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas no .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Verificando colunas da tabela profiles...\n');

  try {
    // Tentar fazer uma query que usa as colunas do Spotify
    const { data, error } = await supabase
      .from('profiles')
      .select('id, spotify_tokens, spotify_user_id, spotify_display_name')
      .limit(1);

    if (error) {
      console.error('❌ Migration NÃO foi aplicada!\n');
      console.error('Erro:', error.message);
      console.log('\n📋 Para aplicar a migration:');
      console.log('1. Acesse: https://app.supabase.com');
      console.log('2. Vá em SQL Editor');
      console.log('3. Execute o SQL em: supabase/migrations/011_add_spotify_integration.sql');
      console.log('\nOu siga as instruções em: APLICAR_SPOTIFY_MIGRATION.md');
      process.exit(1);
    }

    console.log('✅ Migration aplicada com sucesso!\n');
    console.log('As seguintes colunas existem na tabela profiles:');
    console.log('  - spotify_tokens');
    console.log('  - spotify_user_id');
    console.log('  - spotify_display_name');

    // Verificar se há algum usuário com Spotify conectado
    const { data: connectedUsers, error: countError } = await supabase
      .from('profiles')
      .select('id, full_name, spotify_user_id, spotify_display_name')
      .not('spotify_tokens', 'is', null);

    if (!countError && connectedUsers && connectedUsers.length > 0) {
      console.log(`\n🎵 ${connectedUsers.length} usuário(s) com Spotify conectado:`);
      connectedUsers.forEach(user => {
        console.log(`  - ${user.full_name || 'Sem nome'} (Spotify: ${user.spotify_display_name || 'N/A'})`);
      });
    } else {
      console.log('\n⚠️  Nenhum usuário com Spotify conectado ainda');
      console.log('Os usuários precisarão conectar suas contas do Spotify em /musica');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar migration:', error);
    process.exit(1);
  }
}

checkMigration();

/**
 * Verificar se o perfil foi criado para o usuário de teste
 */

require('dotenv').config({ path: '.env.local' });

async function verifyProfile() {
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Verificando perfis criados recentemente...\n');

  // Buscar perfis criados nos últimos 5 minutos
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .gte('created_at', fiveMinutesAgo)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar perfis:', error.message);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('⚠️  Nenhum perfil criado nos últimos 5 minutos');
    console.log('   Mas isso pode ser normal se você não fez signup recentemente');
    return;
  }

  console.log(`✅ Encontrados ${profiles.length} perfil(s) recente(s):\n`);

  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. Perfil:`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Nome: ${profile.full_name}`);
    console.log(`   Criado em: ${profile.created_at}`);
    console.log(`   Atualizado em: ${profile.updated_at}`);
    console.log('');
  });

  console.log('✨ Perfis criados com sucesso pelo trigger!');
}

verifyProfile().catch(console.error);

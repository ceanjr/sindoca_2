/**
 * Script para deletar fotos antigas com storage_path incorreto
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanOldPhotos() {
  // Login
  const partnerEmail = process.env.PARTNER_EMAIL;
  const partnerPassword = process.env.PARTNER_PASSWORD;

  console.log('🔐 Fazendo login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: partnerEmail,
    password: partnerPassword,
  });

  if (authError || !authData.user) {
    console.error('❌ Erro ao fazer login:', authError);
    return;
  }

  console.log(`✅ Login: ${authData.user.id}\n`);

  // Buscar workspace
  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!members) {
    console.error('❌ Usuário não tem workspace.');
    return;
  }

  const workspaceId = members.workspace_id;

  // Buscar todas as fotos
  const { data: photos, error } = await supabase
    .from('content')
    .select('*')
    .eq('type', 'photo')
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('❌ Erro ao buscar fotos:', error);
    return;
  }

  console.log(`📷 Total de fotos: ${photos.length}\n`);

  // Identificar fotos com problemas
  const brokenPhotos = photos.filter(photo =>
    photo.storage_path?.startsWith('photos/') || !photo.data?.url
  );

  console.log(`🔍 Fotos com problemas encontradas: ${brokenPhotos.length}\n`);

  if (brokenPhotos.length === 0) {
    console.log('✅ Não há fotos com problemas!');
    return;
  }

  // Listar fotos que serão deletadas
  brokenPhotos.forEach((photo, index) => {
    console.log(`${index + 1}. ID: ${photo.id.substring(0, 8)}...`);
    console.log(`   Storage Path: ${photo.storage_path}`);
    console.log(`   Data.url: ${photo.data?.url || 'undefined'}`);
    console.log('');
  });

  // Deletar fotos do banco
  console.log('🗑️  Deletando fotos do banco de dados...\n');

  for (const photo of brokenPhotos) {
    const { error: deleteError } = await supabase
      .from('content')
      .delete()
      .eq('id', photo.id);

    if (deleteError) {
      console.error(`❌ Erro ao deletar ${photo.id}:`, deleteError);
    } else {
      console.log(`✅ Deletado: ${photo.id.substring(0, 8)}...`);
    }
  }

  console.log('\n🎉 Limpeza concluída!');
  console.log('   Agora a galeria deve mostrar apenas fotos válidas.');
}

cleanOldPhotos().catch(console.error);

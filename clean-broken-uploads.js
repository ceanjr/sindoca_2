/**
 * Script para deletar fotos com campos NULL do último upload
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanBrokenUploads() {
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

  // Buscar fotos com problemas (storage_path NULL ou category NULL)
  const { data: photos, error } = await supabase
    .from('content')
    .select('*')
    .eq('type', 'photo')
    .eq('workspace_id', workspaceId)
    .or('storage_path.is.null,category.is.null');

  if (error) {
    console.error('❌ Erro ao buscar fotos:', error);
    return;
  }

  console.log(`📷 Total de fotos com problemas: ${photos.length}\n`);

  if (photos.length === 0) {
    console.log('✅ Não há fotos com problemas!');
    return;
  }

  // Listar fotos que serão deletadas
  photos.forEach((photo, index) => {
    console.log(`${index + 1}. ID: ${photo.id.substring(0, 8)}...`);
    console.log(`   Storage Path: ${photo.storage_path || 'NULL'}`);
    console.log(`   Category: ${photo.category || 'NULL'}`);
    console.log(`   Data.url: ${photo.data?.url || 'undefined'}`);
    console.log('');
  });

  // Deletar fotos do storage (se tiverem storage_path)
  console.log('🗑️  Deletando fotos do storage...\n');

  for (const photo of photos) {
    // Tentar deletar do storage usando diferentes paths
    const urlMatch = photo.data?.url?.match(/gallery\/(.+?)(\?|$)/);
    if (urlMatch) {
      const pathFromUrl = urlMatch[1];
      console.log(`   Tentando deletar: ${pathFromUrl}`);

      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([pathFromUrl]);

      if (storageError) {
        console.log(`   ⚠️  Não foi possível deletar do storage: ${storageError.message}`);
      } else {
        console.log(`   ✅ Deletado do storage`);
      }
    }
  }

  // Deletar fotos do banco
  console.log('\n🗑️  Deletando fotos do banco de dados...\n');

  for (const photo of photos) {
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
  console.log('   Agora você pode testar o upload novamente.');
}

cleanBrokenUploads().catch(console.error);

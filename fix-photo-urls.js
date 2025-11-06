/**
 * Script para corrigir URLs das fotos que têm storage_path mas data.url undefined
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPhotoUrls() {
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

  // Buscar todas as fotos do workspace
  const { data: photos, error } = await supabase
    .from('content')
    .select('*')
    .eq('type', 'photo')
    .eq('workspace_id', workspaceId)
    .not('storage_path', 'is', null);

  if (error) {
    console.error('❌ Erro ao buscar fotos:', error);
    return;
  }

  console.log(`📷 Total de fotos encontradas: ${photos.length}\n`);

  let fixed = 0;
  let skipped = 0;
  let deleted = 0;

  for (const photo of photos) {
    const hasUrl = photo.data && photo.data.url;
    const hasStoragePath = photo.storage_path;
    const hasCategory = photo.category;

    // Se não tem categoria, é foto problemática - deletar
    if (!hasCategory) {
      console.log(`🗑️  Deletando foto sem categoria: ${photo.id.substring(0, 8)}...`);

      // Deletar do storage
      if (hasStoragePath) {
        const { error: storageError } = await supabase.storage
          .from('gallery')
          .remove([photo.storage_path]);

        if (!storageError) {
          console.log(`   ✅ Deletado do storage: ${photo.storage_path}`);
        }
      }

      // Deletar do banco
      await supabase.from('content').delete().eq('id', photo.id);
      console.log(`   ✅ Deletado do banco\n`);
      deleted++;
      continue;
    }

    // Se tem URL, pular
    if (hasUrl) {
      skipped++;
      continue;
    }

    // Se não tem URL mas tem storage_path, gerar URL
    if (hasStoragePath && !hasUrl) {
      console.log(`🔧 Corrigindo foto: ${photo.id.substring(0, 8)}...`);
      console.log(`   Storage Path: ${photo.storage_path}`);

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(photo.storage_path);

      const publicUrl = urlData.publicUrl;
      console.log(`   🔗 URL Gerada: ${publicUrl}`);

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('content')
        .update({
          data: {
            ...photo.data,
            url: publicUrl
          }
        })
        .eq('id', photo.id);

      if (updateError) {
        console.error(`   ❌ Erro ao atualizar:`, updateError);
      } else {
        console.log(`   ✅ URL atualizada no banco\n`);
        fixed++;
      }
    }
  }

  console.log('\n🎉 Correção concluída!');
  console.log(`   ✅ ${fixed} foto(s) corrigida(s)`);
  console.log(`   ⏭️  ${skipped} foto(s) já tinham URL`);
  console.log(`   🗑️  ${deleted} foto(s) deletada(s) (sem category)`);
}

fixPhotoUrls().catch(console.error);

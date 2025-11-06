/**
 * Script para deletar fotos da pasta errada (user_id ao invés de workspace_id)
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanWrongUserFolder() {
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

  const userId = authData.user.id;
  console.log(`✅ Login: ${userId}\n`);

  // Buscar workspace
  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .single();

  if (!members) {
    console.error('❌ Usuário não tem workspace.');
    return;
  }

  const workspaceId = members.workspace_id;
  console.log(`✅ Workspace ID: ${workspaceId}\n`);

  // Buscar fotos com storage_path incorreto (que usam userId ao invés de workspaceId)
  const { data: photos, error } = await supabase
    .from('content')
    .select('*')
    .eq('type', 'photo')
    .eq('workspace_id', workspaceId)
    .like('storage_path', `photos/${userId}/%`);

  if (error) {
    console.error('❌ Erro ao buscar fotos:', error);
    return;
  }

  console.log(`📷 Fotos encontradas com path incorreto: ${photos.length}\n`);

  if (photos.length === 0) {
    console.log('✅ Não há fotos com path incorreto!');

    // Verificar também pastas no storage
    console.log('\n📂 Verificando pastas no storage...\n');

    const { data: folders } = await supabase.storage
      .from('gallery')
      .list('photos', {
        limit: 100,
      });

    if (folders) {
      console.log('Pastas encontradas em photos/:');
      folders.forEach(f => {
        console.log(`   - ${f.name} ${f.id ? '(pasta)' : '(arquivo)'}`);
      });

      // Deletar pasta do userId se existir
      const userFolder = folders.find(f => f.name === userId);
      if (userFolder) {
        console.log(`\n🗑️  Deletando pasta incorreta: photos/${userId}/`);

        // Listar arquivos dentro da pasta
        const { data: files } = await supabase.storage
          .from('gallery')
          .list(`photos/${userId}`, {
            limit: 100,
          });

        if (files && files.length > 0) {
          console.log(`   Encontrados ${files.length} arquivo(s)`);

          // Deletar todos os arquivos
          const filePaths = files.map(f => `photos/${userId}/${f.name}`);
          const { error: deleteError } = await supabase.storage
            .from('gallery')
            .remove(filePaths);

          if (deleteError) {
            console.error(`   ❌ Erro ao deletar arquivos:`, deleteError);
          } else {
            console.log(`   ✅ ${files.length} arquivo(s) deletado(s)`);
          }
        }
      }
    }

    return;
  }

  // Listar e deletar fotos
  for (const photo of photos) {
    console.log(`🗑️  Deletando: ${photo.id.substring(0, 8)}...`);
    console.log(`   Path: ${photo.storage_path}`);

    // Deletar do storage
    if (photo.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([photo.storage_path]);

      if (storageError) {
        console.log(`   ⚠️  Erro no storage: ${storageError.message}`);
      } else {
        console.log(`   ✅ Deletado do storage`);
      }
    }

    // Deletar do banco
    const { error: dbError } = await supabase
      .from('content')
      .delete()
      .eq('id', photo.id);

    if (dbError) {
      console.error(`   ❌ Erro no banco:`, dbError);
    } else {
      console.log(`   ✅ Deletado do banco\n`);
    }
  }

  console.log('🎉 Limpeza concluída!');
}

cleanWrongUserFolder().catch(console.error);

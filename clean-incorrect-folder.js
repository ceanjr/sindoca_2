/**
 * Script para deletar a pasta incorreta na raiz do bucket
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanIncorrectFolder() {
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

  // Listar pastas na raiz do bucket
  const { data: rootFiles, error: listError } = await supabase.storage
    .from('gallery')
    .list('', {
      limit: 100,
      offset: 0,
    });

  if (listError) {
    console.error('❌ Erro ao listar bucket:', listError);
    return;
  }

  console.log(`📂 Pastas/arquivos na raiz do bucket:\n`);
  rootFiles.forEach(file => {
    console.log(`   - ${file.name} ${file.id ? '(pasta)' : '(arquivo)'}`);
  });

  // Encontrar pastas que não são "photos"
  const incorrectFolders = rootFiles.filter(f => f.name !== 'photos' && f.id);

  if (incorrectFolders.length === 0) {
    console.log('\n✅ Não há pastas incorretas na raiz!');
    return;
  }

  console.log(`\n🗑️  Encontradas ${incorrectFolders.length} pasta(s) incorreta(s) para deletar:\n`);

  for (const folder of incorrectFolders) {
    console.log(`📁 Deletando pasta: ${folder.name}`);

    // Listar arquivos dentro da pasta
    const { data: files } = await supabase.storage
      .from('gallery')
      .list(folder.name, {
        limit: 100,
      });

    if (files && files.length > 0) {
      console.log(`   Encontrados ${files.length} arquivo(s) dentro da pasta`);

      // Deletar todos os arquivos
      const filePaths = files.map(f => `${folder.name}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('gallery')
        .remove(filePaths);

      if (deleteError) {
        console.error(`   ❌ Erro ao deletar arquivos:`, deleteError);
      } else {
        console.log(`   ✅ ${files.length} arquivo(s) deletado(s)`);
      }
    }

    console.log('');
  }

  console.log('🎉 Limpeza concluída!');
}

cleanIncorrectFolder().catch(console.error);

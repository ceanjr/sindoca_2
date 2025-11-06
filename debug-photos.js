/**
 * Script de debug para verificar dados das fotos no Supabase
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltam variáveis de ambiente do Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPhotos() {
  // Login com as credenciais do .env
  const partnerEmail = process.env.PARTNER_EMAIL;
  const partnerPassword = process.env.PARTNER_PASSWORD;

  if (!partnerEmail || !partnerPassword) {
    console.error('❌ Faltam PARTNER_EMAIL ou PARTNER_PASSWORD no .env.local');
    process.exit(1);
  }

  console.log('🔐 Fazendo login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: partnerEmail,
    password: partnerPassword,
  });

  if (authError || !authData.user) {
    console.error('❌ Erro ao fazer login:', authError);
    return;
  }

  console.log(`✅ Login bem-sucedido! User ID: ${authData.user.id}\n`);

  // Buscar workspace
  console.log('🔍 Buscando workspace_members...');
  const { data: members, error: membersError } = await supabase
    .from('workspace_members')
    .select('*');

  console.log(`   Membros encontrados: ${members?.length || 0}`);
  if (members && members.length > 0) {
    members.forEach(m => {
      console.log(`   - Workspace: ${m.workspace_id}, User: ${m.user_id}, Role: ${m.role}`);
    });
  }

  // Buscar workspaces
  console.log('\n🔍 Buscando workspaces...');
  const { data: workspaces, error: workspacesError } = await supabase
    .from('workspaces')
    .select('*');

  console.log(`   Workspaces encontrados: ${workspaces?.length || 0}`);
  if (workspaces && workspaces.length > 0) {
    workspaces.forEach(w => {
      console.log(`   - ID: ${w.id}, Name: ${w.name || 'sem nome'}`);
    });
  }

  // Se não temos workspace, não podemos continuar
  if (!members || members.length === 0) {
    console.error('\n❌ Usuário não tem workspace_members! Não pode buscar fotos.');

    // Vamos tentar buscar fotos direto sem filtro de workspace
    console.log('\n🔍 Tentando buscar fotos SEM filtro de workspace...');
    const { data: allPhotos, error: allError } = await supabase
      .from('content')
      .select('*')
      .eq('type', 'photo');

    console.log(`   Fotos encontradas (sem filtro): ${allPhotos?.length || 0}\n`);
    if (allPhotos && allPhotos.length > 0) {
      console.log('⚠️ Há fotos no banco, mas o usuário não tem acesso por falta de workspace_members!\n');
    }
    return;
  }

  const workspaceId = members[0].workspace_id;
  console.log(`\n✅ Usando Workspace ID: ${workspaceId}\n`);

  console.log('🔍 Buscando fotos no banco de dados...\n');

  const { data: photos, error } = await supabase
    .from('content')
    .select('*')
    .eq('type', 'photo')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Erro ao buscar fotos:', error);
    return;
  }

  console.log(`✅ Encontradas ${photos?.length || 0} fotos\n`);

  photos?.forEach((photo, index) => {
    console.log(`📷 Foto ${index + 1}:`);
    console.log(`   ID: ${photo.id}`);
    console.log(`   Storage Path: ${photo.storage_path}`);
    console.log(`   Data.url: ${photo.data?.url || 'undefined'}`);
    console.log(`   Description: ${photo.description || 'sem descrição'}`);
    console.log(`   Created: ${photo.created_at}`);

    // Testar gerar URL do storage_path
    if (photo.storage_path) {
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(photo.storage_path);

      console.log(`   🔗 URL Gerada (com path completo): ${urlData.publicUrl}`);

      // Tentar sem o prefixo 'gallery/'
      const cleanPath = photo.storage_path.replace(/^gallery\//, '');
      const { data: urlData2 } = supabase.storage
        .from('gallery')
        .getPublicUrl(cleanPath);

      console.log(`   🔗 URL Gerada (path limpo): ${urlData2.publicUrl}`);
    }

    console.log('');
  });

  // Listar arquivos no bucket
  console.log('\n📂 Listando arquivos no bucket "gallery"...\n');

  const { data: files, error: listError } = await supabase.storage
    .from('gallery')
    .list('', {
      limit: 10,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (listError) {
    console.error('❌ Erro ao listar arquivos:', listError);
  } else {
    console.log(`✅ Encontrados ${files?.length || 0} arquivos/pastas no root do bucket\n`);
    files?.forEach(file => {
      console.log(`   ${file.name} (${file.id ? 'pasta' : 'arquivo'})`);
    });
  }
}

debugPhotos().catch(console.error);

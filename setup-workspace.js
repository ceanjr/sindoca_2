/**
 * Script para configurar workspace e adicionar usuário
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

async function setupWorkspace() {
  // Login
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

  const userId = authData.user.id;
  console.log(`✅ Login bem-sucedido! User ID: ${userId}\n`);

  // Verificar workspaces existentes
  console.log('🔍 Buscando workspaces...');
  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id');

  if (members && members.length > 0) {
    const workspaceId = members[0].workspace_id;
    console.log(`✅ Workspace encontrado: ${workspaceId}\n`);

    // Verificar se o usuário já está no workspace
    console.log('🔍 Verificando se usuário está no workspace...');
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      console.log('✅ Usuário já está no workspace!');
      return workspaceId;
    }

    // Adicionar usuário ao workspace
    console.log('➕ Adicionando usuário ao workspace...');
    const { error: insertError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: 'partner'
      });

    if (insertError) {
      console.error('❌ Erro ao adicionar usuário:', insertError);
      return null;
    }

    console.log('✅ Usuário adicionado ao workspace com sucesso!');
    return workspaceId;
  } else {
    // Criar novo workspace
    console.log('➕ Criando novo workspace...');
    const { data: newWorkspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Nosso Amor'
      })
      .select()
      .single();

    if (workspaceError) {
      console.error('❌ Erro ao criar workspace:', workspaceError);
      return null;
    }

    const workspaceId = newWorkspace.id;
    console.log(`✅ Workspace criado: ${workspaceId}\n`);

    // Adicionar usuário ao workspace
    console.log('➕ Adicionando usuário ao workspace...');
    const { error: insertError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: 'partner'
      });

    if (insertError) {
      console.error('❌ Erro ao adicionar usuário:', insertError);
      return null;
    }

    console.log('✅ Workspace configurado com sucesso!');
    return workspaceId;
  }
}

setupWorkspace()
  .then(workspaceId => {
    if (workspaceId) {
      console.log(`\n🎉 Tudo pronto! Workspace ID: ${workspaceId}`);
      console.log('\n📝 Agora você pode:');
      console.log('   1. Fazer upload de fotos pela interface');
      console.log('   2. As fotos aparecerão automaticamente na galeria');
    }
  })
  .catch(console.error);

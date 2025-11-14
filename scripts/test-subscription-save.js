#!/usr/bin/env node

/**
 * Script para testar salvamento de subscription no banco
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubscriptionSave() {
  console.log('🧪 Testando salvamento de subscription...\n');

  try {
    // 1. Buscar um usuário existente
    console.log('1. Buscando usuários...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(1);

    if (profilesError) {
      console.error('❌ Erro ao buscar usuários:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ Nenhum usuário encontrado!');
      return;
    }

    const user = profiles[0];
    console.log(`✅ Usuário encontrado: ${user.full_name} (${user.email})\n`);

    // 2. Criar uma subscription de teste
    console.log('2. Criando subscription de teste...');
    const testSubscription = {
      user_id: user.id,
      endpoint: `https://fcm.googleapis.com/fcm/send/test-${Date.now()}`,
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
    };

    console.log('Dados:', JSON.stringify(testSubscription, null, 2));

    // 3. Tentar salvar no banco (com client anon - sem auth)
    console.log('\n3. Tentando salvar com client anônimo...');
    const { data: anonData, error: anonError } = await supabase
      .from('push_subscriptions')
      .insert(testSubscription)
      .select()
      .single();

    if (anonError) {
      console.error('❌ Erro com client anônimo:', anonError.message);
      console.log('   Isso é esperado - RLS bloqueia inserção sem autenticação!\n');
    } else {
      console.log('✅ Subscription salva (inesperado!):', anonData);
    }

    // 4. Verificar se a tabela existe
    console.log('4. Verificando estrutura da tabela...');
    const { data: tableData, error: tableError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela:', tableError);
    } else {
      console.log(
        `✅ Tabela acessível. Total de subscriptions: ${
          tableData ? tableData.length : 0
        }\n`
      );
    }

    // 5. Verificar todas as subscriptions existentes
    console.log('5. Listando todas as subscriptions...');
    const { data: allSubs, error: allSubsError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (allSubsError) {
      console.error('❌ Erro ao listar:', allSubsError);
    } else {
      console.log(`📊 Total: ${allSubs?.length || 0} subscription(s)\n`);
      if (allSubs && allSubs.length > 0) {
        allSubs.forEach((sub, i) => {
          console.log(
            `   ${i + 1}. User ID: ${sub.user_id.substring(0, 8)}... | Endpoint: ${sub.endpoint.substring(0, 40)}...`
          );
        });
      }
    }
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

testSubscriptionSave();

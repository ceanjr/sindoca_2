/**
 * Script de teste para notificações push
 *
 * Execute com: node test-push-notification.js
 *
 * Este script envia uma notificação de teste para um usuário específico
 */

require('dotenv').config({ path: '.env.local' });

// Configurações
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

// IDs dos usuários (copie da tabela profiles)
const CELIO_ID = '50e5a69d-8421-4fc1-a33a-8cb0d125ab50';
const SINDY_ID = 'd92c396b-db11-45f8-a45f-47ff5152484a';
const CEANBRJR_ID = 'b726a059-f7b3-4825-8e29-e4a4f93aae39';

async function testPushNotification(recipientUserId, recipientName) {
  console.log(`\n🧪 Testando envio de notificação para ${recipientName}...`);
  console.log(`   User ID: ${recipientUserId}`);
  console.log(`   API URL: ${SITE_URL}/api/push/send`);

  try {
    const response = await fetch(`${SITE_URL}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_API_SECRET,
      },
      body: JSON.stringify({
        recipientUserId: recipientUserId,
        title: '🧪 Teste de Notificação',
        body: `Esta é uma notificação de teste enviada em ${new Date().toLocaleString('pt-BR')}`,
        icon: '/icon-192x192.png',
        tag: 'test-notification',
        data: { url: '/' },
      }),
    });

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`   ❌ Erro ao processar resposta (HTTP ${response.status})`);
      console.log(`   📋 Resposta do servidor:`, responseText);
      return { error: 'Invalid JSON response', responseText };
    }

    if (response.ok) {
      console.log(`   ✅ Sucesso!`);
      console.log(`   📊 Resultado:`, JSON.stringify(data, null, 2));
    } else {
      console.log(`   ❌ Erro HTTP ${response.status}`);
      console.log(`   📋 Detalhes:`, JSON.stringify(data, null, 2));
    }

    return data;
  } catch (error) {
    console.log(`   ❌ Erro na requisição:`, error.message);
    return { error: error.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('🔔 TESTE DE NOTIFICAÇÕES PUSH - SINDOCA');
  console.log('═══════════════════════════════════════════════');

  if (!INTERNAL_API_SECRET) {
    console.log('\n❌ ERRO: INTERNAL_API_SECRET não configurado!');
    console.log('   Configure em .env.local');
    process.exit(1);
  }

  console.log(`\n📍 Servidor: ${SITE_URL}`);
  console.log(`🔐 Secret: ${INTERNAL_API_SECRET.substring(0, 10)}...`);

  // Menu de opções
  console.log('\n📋 Escolha um destinatário:');
  console.log('   1. Célio Júnior');
  console.log('   2. Sindy');
  console.log('   3. ceanbrjr');
  console.log('   4. Todos');

  const args = process.argv.slice(2);
  const option = args[0] || '1';

  console.log(`\n▶️  Opção selecionada: ${option}`);
  console.log('═══════════════════════════════════════════════\n');

  switch(option) {
    case '1':
      await testPushNotification(CELIO_ID, 'Célio Júnior');
      break;
    case '2':
      await testPushNotification(SINDY_ID, 'Sindy');
      break;
    case '3':
      await testPushNotification(CEANBRJR_ID, 'ceanbrjr');
      break;
    case '4':
      await testPushNotification(CELIO_ID, 'Célio Júnior');
      await testPushNotification(SINDY_ID, 'Sindy');
      await testPushNotification(CEANBRJR_ID, 'ceanbrjr');
      break;
    default:
      console.log('❌ Opção inválida!');
      process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Teste concluído!');
  console.log('═══════════════════════════════════════════════\n');

  console.log('📝 Verificações:');
  console.log('   1. Verifique se a notificação apareceu no dispositivo/navegador');
  console.log('   2. Verifique o console do navegador para logs');
  console.log('   3. Verifique o Service Worker em DevTools > Application');
  console.log('   4. Verifique a tabela push_subscriptions no Supabase\n');
}

main().catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});

/**
 * Script de teste LOCAL para notificações push
 */

require('dotenv').config({ path: '.env.local' });

const SITE_URL = 'http://localhost:3000'; // FORÇAR LOCAL
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

const CELIO_ID = '50e5a69d-8421-4fc1-a33a-8cb0d125ab50';
const SINDY_ID = 'd92c396b-db11-45f8-a45f-47ff5152484a';

async function testPushNotification(recipientUserId, recipientName) {
  console.log(`\n🧪 Testando envio LOCAL para ${recipientName}...`);
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
        title: '🧪 Teste LOCAL',
        body: `Teste de notificação local em ${new Date().toLocaleString('pt-BR')}`,
        icon: '/icon-192x192.png',
        tag: 'test-local',
        data: { url: '/' },
      }),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log(`   ❌ Erro ao processar resposta (HTTP ${response.status})`);
      console.log(`   📋 Resposta:`, responseText.substring(0, 500));
      return { error: 'Invalid JSON response', responseText };
    }

    if (response.ok) {
      console.log(`   ✅ SUCESSO!`);
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
  console.log('🔔 TESTE LOCAL DE NOTIFICAÇÕES');
  console.log('═══════════════════════════════════════════════');

  if (!INTERNAL_API_SECRET) {
    console.log('\n❌ ERRO: INTERNAL_API_SECRET não configurado!');
    process.exit(1);
  }

  console.log(`\n📍 Servidor: ${SITE_URL}`);
  console.log(`🔐 Secret: ${INTERNAL_API_SECRET.substring(0, 10)}...`);
  console.log('\n═══════════════════════════════════════════════\n');

  // Testar para Sindy primeiro
  const result1 = await testPushNotification(SINDY_ID, 'Sindy');

  console.log('\n⏱️  Aguardando 2 segundos...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Testar para Célio
  const result2 = await testPushNotification(CELIO_ID, 'Célio');

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Teste concluído!');
  console.log('═══════════════════════════════════════════════\n');

  if (result1.success && result2.success) {
    console.log('🎉 TUDO FUNCIONANDO! As notificações foram enviadas.');
    console.log('\n📱 Verifique se a notificação apareceu nos dispositivos/navegadores.');
  } else {
    console.log('⚠️  Houve problemas. Veja os detalhes acima.');
  }
}

main().catch(error => {
  console.error('\n💥 Erro fatal:', error);
  process.exit(1);
});

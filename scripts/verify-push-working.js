#!/usr/bin/env node

/**
 * Script simplificado para verificar se push notifications está funcionando
 * Verifica através do debug endpoint da aplicação
 */

const http = require('http');

const hostname = process.argv[2] || 'localhost';
const port = process.argv[3] || '3000';

console.log('🔍 Verificando Push Notifications via API...\n');
console.log(`   Servidor: http://${hostname}:${port}`);
console.log(`   Endpoint: /api/push/stats\n`);

const options = {
  hostname,
  port,
  path: '/api/push/stats',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 404) {
      console.log('⚠️  Endpoint /api/push/stats não existe ainda.');
      console.log('\n💡 ALTERNATIVA: Use o Debug do PWA:');
      console.log('   1. Abra o app no navegador');
      console.log('   2. Menu → Debug → Push Notifications');
      console.log('   3. Veja a seção "Banco de Dados"\n');
      return;
    }

    if (res.statusCode !== 200) {
      console.error(`❌ Erro: Status ${res.statusCode}`);
      console.error(data);
      return;
    }

    try {
      const result = JSON.parse(data);
      console.log('✅ Push Notifications Status:\n');
      console.log(`   Total subscriptions: ${result.total || 0}`);
      console.log(`   Subscriptions ativas: ${result.active || 0}`);
      console.log(`   Última atualização: ${result.lastUpdated || 'N/A'}\n`);

      if (result.total > 0) {
        console.log('🎉 Push notifications está funcionando corretamente!\n');
      } else {
        console.log('⚠️  Nenhuma subscription ativa.');
        console.log('   Ative notificações no app para criar uma subscription.\n');
      }
    } catch (error) {
      console.error('❌ Erro ao parsear resposta:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro ao conectar:', error.message);
  console.log('\n💡 Certifique-se de que o servidor está rodando:');
  console.log(`   npm run dev\n`);
  console.log('   Ou especifique hostname/porta:');
  console.log('   node scripts/verify-push-working.js <hostname> <port>\n');
});

req.end();

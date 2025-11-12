/**
 * Script de diagnóstico e reparo de push notifications
 * Execute este script no console do navegador (F12)
 *
 * OU execute aqui para verificar o banco:
 * node debug-push.js check
 */

// === PARTE 1: Verificar banco (Node.js) ===
if (typeof window === 'undefined') {
  const { createClient } = require('@supabase/supabase-js');

  const supabaseUrl = 'https://wpgaxoqbrdyfihwzoxlc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZ2F4b3FicmR5Zmlod3pveGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzUyMTAsImV4cCI6MjA3NzcxMTIxMH0.x9TeSxEmsUxCak3wc-3wb8tAq_yX2bDGnCSe1L0eK1A';

  const supabase = createClient(supabaseUrl, supabaseKey);

  async function checkDatabase() {
    console.log('🔍 Verificando subscriptions no banco...\n');

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }

    console.log(`✅ Total de subscriptions: ${subscriptions.length}\n`);

    if (subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`Subscription #${index + 1}:`);
        console.log(`  User ID: ${sub.user_id}`);
        console.log(`  Endpoint: ${sub.endpoint.substring(0, 60)}...`);
        console.log(`  Created: ${new Date(sub.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Nenhuma subscription encontrada!');
      console.log('\n📋 Próximos passos:');
      console.log('1. Abra o app no navegador');
      console.log('2. Abra o console (F12)');
      console.log('3. Cole e execute o seguinte comando:');
      console.log('\n--- COPIE DAQUI ---\n');
      console.log(`
// Forçar criação de subscription
async function forceSubscribe() {
  console.log('🔧 Forçando criação de subscription...');

  // Verificar permissão
  if (Notification.permission !== 'granted') {
    console.error('❌ Notificações não estão permitidas!');
    console.log('   Vá em Configurações do site e permita notificações');
    return;
  }

  // Verificar service worker
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('❌ Push notifications não suportado neste browser');
    return;
  }

  try {
    // Esperar service worker
    const registration = await navigator.serviceWorker.ready;
    console.log('✅ Service Worker pronto');

    // Verificar subscription existente
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('⚠️  Já existe uma subscription no browser. Removendo...');
      await subscription.unsubscribe();
    }

    // Criar nova subscription
    const vapidKey = 'BJ7_jdvbDffFpqbFYzR6v3W0oOWuQQupXDN8_hIgbzcL2wcHn78m9YGxf-mUXUtOuVVdEQ-v3JufIcRK-yMnzxw';

    // Converter VAPID key
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    console.log('✅ Subscription criada no browser!');
    console.log('   Endpoint:', subscription.endpoint.substring(0, 60) + '...');

    // Salvar no banco
    console.log('💾 Salvando no banco de dados...');

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCESSO! Subscription salva no banco:', result);
      console.log('\\n🎉 Push notifications agora devem funcionar!');
    } else {
      console.error('❌ Erro ao salvar:', result);
      console.log('   Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar
forceSubscribe();
      `);
      console.log('\n--- ATÉ AQUI ---\n');
    }

    // Verificar usuários
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email, full_name');

    if (users) {
      console.log('\n👥 Usuários registrados:', users.length);
      users.forEach(user => {
        const userSubs = subscriptions.filter(s => s.user_id === user.id);
        const status = userSubs.length > 0 ? '✅' : '❌';
        console.log(`  ${status} ${user.full_name || user.email}: ${userSubs.length} subscription(s)`);
      });
    }
  }

  checkDatabase().catch(console.error);

} else {
  // === PARTE 2: Executar no browser ===
  console.log('Este script deve ser executado via Node.js:');
  console.log('  node debug-push.js check');
}

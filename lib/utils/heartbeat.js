'use client';

let lastHeartbeat = Date.now();
let heartbeatInterval = null;

export function startHeartbeat() {
  if (heartbeatInterval) return;

  // ✅ Heartbeat a cada 30 segundos
  heartbeatInterval = setInterval(() => {
    const now = Date.now();
    const timeSinceLastBeat = now - lastHeartbeat;

    // ✅ Se passou mais de 2 minutos sem atualizar, algo está travado
    if (timeSinceLastBeat > 120000) {
      console.error('❌ HEARTBEAT: App parece estar travado!');
      console.error('❌ Tempo desde último beat:', timeSinceLastBeat / 1000, 'segundos');
      
      // ✅ Mostrar notificação ao usuário
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('App Travado', {
          body: 'O app parece estar travado. Por favor, recarregue a página.',
          icon: '/icon-192x192.png',
        });
      }
      
      // ✅ Log no console
      console.error('❌ DIAGNÓSTICO:');
      console.error('- Conexões Supabase abertas:', performance.getEntriesByType('resource').filter(r => r.name.includes('supabase')).length);
      console.error('- Requests pendentes:', performance.getEntriesByType('resource').filter(r => r.duration === 0).length);
    }

    lastHeartbeat = now;
  }, 30000);
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export function updateHeartbeat() {
  lastHeartbeat = Date.now();
}

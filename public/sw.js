// Service Worker para Sindoca da Maloka
// Versão v4 - Fix de navegação após login

const CACHE_VERSION = 'v4';
const CACHE_NAME = `sindoca-${CACHE_VERSION}`;
const RUNTIME_CACHE = `sindoca-runtime-${CACHE_VERSION}`;

// Assets essenciais para cache inicial (SEM manifest.json e SEM homepage)
const PRECACHE_URLS = [
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install: Cachear apenas ícones, skipWaiting imediato
self.addEventListener('install', (event) => {
  console.log('[SW] Install event - v4');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential assets (icons only)');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting - force activation');
        return self.skipWaiting();
      })
  );
});

// Activate: LIMPAR TODOS OS CACHES ANTIGOS e tomar controle imediato
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event - v4 cleaning ALL old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('[SW] Found caches:', cacheNames);
      // Deletar TODOS os caches que não são v4
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] 🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming all clients immediately');
      return self.clients.claim();
    }).then(() => {
      console.log('[SW] ✅ All clients now controlled by v4');
      // Notificar todos os clientes para recarregar
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: 'v4',
            message: 'Service Worker atualizado - recarregando página'
          });
        });
      });
    })
  );
});

// Fetch: Estratégia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que não são GET
  if (request.method !== 'GET') {
    return;
  }

  // NUNCA cachear manifest.json ou homepage - sempre buscar do servidor
  if (url.pathname === '/manifest.json' || url.pathname === '/' || url.pathname.match(/^\/(_next|api)/)) {
    event.respondWith(fetch(request));
    return;
  }

  // Ignorar requests do Chrome extensions e outras origens
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('supabase.co') && !url.origin.includes('googleapis.com') && !url.origin.includes('gstatic.com')) {
    return;
  }

  // Estratégia para diferentes tipos de recursos
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    // Imagens: Cache First
    event.respondWith(cacheFirst(request));
  } else if (url.origin.includes('googleapis.com') || url.origin.includes('gstatic.com')) {
    // Google Fonts: Cache First com fallback
    event.respondWith(cacheFirst(request));
  } else if (url.origin.includes('supabase.co')) {
    // Supabase: Network First
    event.respondWith(networkFirst(request));
  } else {
    // Outras requests: Network First com cache fallback
    event.respondWith(networkFirst(request));
  }
});

// Cache First: Tenta cache primeiro, depois network
async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Fetch failed for:', request.url);
    throw error;
  }
}

// Network First: Tenta network primeiro, depois cache
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notificação', body: event.data.text() };
    }
  }

  const title = data.title || 'Sindoca da Maloka';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: data.url || '/',
    tag: data.tag || 'default',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click');
  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já existe uma janela aberta, focar nela
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service Worker loaded');

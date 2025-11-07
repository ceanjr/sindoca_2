// Service Worker para Sindoca da Maloka
// Versão simplificada mas funcional para PWA

const CACHE_VERSION = 'v2';
const CACHE_NAME = `sindoca-${CACHE_VERSION}`;
const RUNTIME_CACHE = `sindoca-runtime-${CACHE_VERSION}`;

// Assets essenciais para cache inicial (SEM manifest.json)
const PRECACHE_URLS = [
  '/',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install: Cachear assets essenciais
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
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

  // NUNCA cachear manifest.json - sempre buscar do servidor
  if (url.pathname === '/manifest.json') {
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

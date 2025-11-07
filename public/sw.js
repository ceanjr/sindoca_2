// Service Worker para Sindoca da Maloka
// Baseado em Workbox e boas práticas de PWA

const CACHE_NAME = 'sindoca-v1.0.0';
const RUNTIME_CACHE = 'sindoca-runtime';

// Assets essenciais para precache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install: Precache de assets essenciais
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      console.log('[SW] Install complete, skip waiting');
      return self.skipWaiting();
    })
  );
});

// Activate: Cleanup de caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('sindoca-') && name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activation complete, claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch: Estratégias de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições não-GET
  if (request.method !== 'GET') return;

  // Estratégia para diferentes tipos de recursos
  if (url.pathname === '/') {
    // Página inicial: Network First com timeout
    event.respondWith(networkFirstWithTimeout(request, 3000));
  } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|avif|ico)$/i)) {
    // Imagens: Cache First
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.match(/\.(js|css)$/i)) {
    // JS/CSS: Cache First
    event.respondWith(cacheFirst(request));
  } else if (url.origin.includes('supabase.co') && url.pathname.includes('/storage/')) {
    // Supabase Storage: Cache First
    event.respondWith(cacheFirst(request));
  } else if (url.origin.includes('supabase.co') && url.pathname.includes('/rest/')) {
    // Supabase REST API: Network First
    event.respondWith(networkFirst(request));
  } else if (url.origin.includes('googleapis.com') || url.origin.includes('gstatic.com')) {
    // Google Fonts: Cache First
    event.respondWith(cacheFirst(request));
  } else {
    // Default: Network First
    event.respondWith(networkFirst(request));
  }
});

// Estratégia: Cache First
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Cache hit:', request.url);
      return cached;
    }

    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Estratégia: Network First
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Estratégia: Network First com Timeout
async function networkFirstWithTimeout(request, timeout = 3000) {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    );

    const response = await Promise.race([fetch(request), timeoutPromise]);

    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network timeout/failed, using cache:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback para página inicial
    const fallback = await caches.match('/');
    if (fallback) return fallback;

    throw error;
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'Sindoca da Maloka',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      vibrate: data.vibrate,
      tag: data.tag || 'notification',
      data: data.data || {},
    })
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification Close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

console.log('[SW] Service Worker v1.0.0 loaded');

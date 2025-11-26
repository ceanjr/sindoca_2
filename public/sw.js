// Service Worker para Sindoca da Maloka
// Versão v10 - Remove badge para eliminar "from Sindoca" nas notificações

const CACHE_VERSION = 'v10';
const CACHE_NAME = `sindoca-${CACHE_VERSION}`;
const RUNTIME_CACHE = `sindoca-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `sindoca-images-${CACHE_VERSION}`;

// Network timeout para evitar requests travadas
const NETWORK_TIMEOUT = 5000; // 5 segundos

// Assets essenciais para cache inicial
const PRECACHE_URLS = [
  '/icon-72x72.png',
  '/icon-96x96.png',
  '/icon-128x128.png',
  '/icon-144x144.png',
  '/icon-152x152.png',
  '/icon-192x192.png',
  '/icon-384x384.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
];

// Install: Cachear assets essenciais
self.addEventListener('install', (event) => {
  console.log('[SW] Install event - v10');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(PRECACHE_URLS).catch(err => {
          console.error('[SW] Failed to cache some assets:', err);
          // Não falhar completamente se alguns assets não carregarem
        });
      })
      .then(() => {
        console.log('[SW] Install complete');
        // Não usar skipWaiting imediatamente para evitar problemas
        // Apenas se não houver controller ativo
        if (!self.clients || self.clients.length === 0) {
          return self.skipWaiting();
        }
      })
  );
});

// Activate: Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event - v10');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('[SW] Found caches:', cacheNames);
      // Deletar caches de versões antigas
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    }).then(() => {
      console.log('[SW] Service Worker v10 activated');
      // NÃO enviar mensagem de reload para evitar loops infinitos
      // O usuário verá a nova versão naturalmente na próxima navegação
    })
  );
});

// Fetch: Estratégia de cache otimizada
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que não são GET
  if (request.method !== 'GET') {
    return;
  }

  // API e páginas dinâmicas: sempre do servidor (sem cache)
  if (url.pathname.match(/^\/api\//) || url.pathname === '/') {
    event.respondWith(fetch(request));
    return;
  }

  // Next.js internal: Network First com timeout
  if (url.pathname.match(/^\/(_next|_error)/)) {
    event.respondWith(networkFirstWithTimeout(request));
    return;
  }

  // Manifest sempre fresco
  if (url.pathname === '/manifest.json') {
    event.respondWith(fetch(request));
    return;
  }

  // Ignorar outras origens não confiáveis
  const trustedOrigins = [self.location.origin, 'supabase.co', 'googleapis.com', 'gstatic.com'];
  if (!trustedOrigins.some(origin => url.origin.includes(origin))) {
    return;
  }

  // Imagens: Cache First com fallback (cache separado)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|avif)$/)) {
    event.respondWith(cacheFirstImages(request));
  }
  // Google Fonts: Cache First (longa duração)
  else if (url.origin.includes('googleapis.com') || url.origin.includes('gstatic.com')) {
    event.respondWith(cacheFirst(request));
  }
  // Supabase: Network First com timeout
  else if (url.origin.includes('supabase.co')) {
    event.respondWith(networkFirstWithTimeout(request));
  }
  // CSS, JS, fontes: Stale While Revalidate (melhor UX)
  else if (url.pathname.match(/\.(css|js|woff2?|ttf|eot)$/)) {
    event.respondWith(staleWhileRevalidate(request));
  }
  // Outras requests: Network First com timeout
  else {
    event.respondWith(networkFirstWithTimeout(request));
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
    console.log('[SW] Fetch failed:', request.url);
    throw error;
  }
}

// Cache First para imagens (cache separado)
async function cacheFirstImages(request) {
  const cache = await caches.open(IMAGE_CACHE);
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
    console.log('[SW] Image fetch failed:', request.url);
    throw error;
  }
}

// Network First com timeout
async function networkFirstWithTimeout(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    // Race entre fetch e timeout
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
      )
    ]);

    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale While Revalidate: Retorna cache imediatamente, atualiza em background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  // Promise para buscar nova versão em background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(err => {
    console.log('[SW] Background fetch failed:', request.url);
    return null;
  });

  // Retorna cache se disponível, senão espera o fetch
  return cached || fetchPromise;
}

// Helper to send logs to clients (for mobile logger)
async function logToClients(level, category, message, data = null) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  const logMessage = {
    type: 'SW_LOG',
    log: {
      level,
      category,
      message,
      data,
      timestamp: new Date().toISOString()
    }
  };

  clients.forEach(client => {
    client.postMessage(logMessage);
  });
}

// Push Notification Handler
self.addEventListener('push', (event) => {
  const timestamp = new Date().toISOString();
  console.log('🔔 [SW] Push notification received at', timestamp);
  console.log('🔔 [SW] Service Worker state:', self.registration.active ? 'active' : 'not active');

  // Log to clients for mobile debugging
  logToClients('info', 'PUSH', '🔔 Push notification received', { timestamp });
  logToClients('info', 'PUSH', 'Service Worker state', { active: self.registration.active ? 'active' : 'not active' });

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('📦 [SW] Push data parsed:', data);
      logToClients('info', 'PUSH', '📦 Push data parsed', data);
    } catch (e) {
      console.warn('⚠️ [SW] Failed to parse push data as JSON:', e);
      logToClients('warn', 'PUSH', '⚠️ Failed to parse push data as JSON', { error: e.message });
      data = { title: 'Notificação', body: event.data.text() };
    }
  } else {
    console.warn('⚠️ [SW] Push event has no data');
    logToClients('warn', 'PUSH', '⚠️ Push event has no data');
    // Usar valores padrão se não houver dados
    data = { title: 'Sindoca', body: 'Nova notificação' };
  }

  const title = data.title || 'Sindoca';
  const options = {
    body: data.body || 'Nova notificação',
    icon: data.icon || '/icon-192x192.png',
    // badge removido para evitar texto "from Sindoca" nas notificações Android
    data: data.data || { url: data.url || '/' },
    tag: data.tag || 'sindoca-notification',
    requireInteraction: false,
    vibrate: [200, 100, 200], // Padrão de vibração
    silent: false, // Garantir que não seja silenciosa
    // Adicionar image se houver
    ...(data.image && { image: data.image }),
  };

  console.log('📢 [SW] Preparing to show notification:', { title, options });
  logToClients('info', 'PUSH', '📢 Preparing to show notification', { title, body: options.body, data: options.data });

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        const successTimestamp = new Date().toISOString();
        console.log('✅ [SW] Notification displayed successfully at', successTimestamp);
        logToClients('success', 'PUSH', '✅ Notification displayed successfully', {
          timestamp: successTimestamp,
          title,
          body: options.body
        });
      })
      .catch((error) => {
        console.error('❌ [SW] Failed to display notification:', error);
        console.error('❌ [SW] Notification error details:', {
          name: error.name,
          message: error.message,
          timestamp: new Date().toISOString()
        });
        logToClients('error', 'PUSH', '❌ Failed to display notification', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      })
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click', event.notification.data);
  event.notification.close();

  // Get URL from notification data
  // data can be either a string URL or an object with url property
  let urlToOpen = '/';
  if (event.notification.data) {
    if (typeof event.notification.data === 'string') {
      urlToOpen = event.notification.data;
    } else if (event.notification.data.url) {
      urlToOpen = event.notification.data.url;
    }
  }

  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já existe uma janela aberta do app, navegar nela
        if (clientList.length > 0) {
          const client = clientList[0];
          if ('navigate' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          } else if ('focus' in client) {
            // Se não pode navegar, apenas focar e esperar que o app atualize
            client.focus();
            // Enviar mensagem para o client navegar
            client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen
            });
            return client;
          }
        }
        // Se não existe janela aberta, abrir nova
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[SW] Service Worker loaded');

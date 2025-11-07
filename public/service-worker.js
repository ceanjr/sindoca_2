/**
 * Service Worker para Sindoca da Maloka
 *
 * Este Service Worker implementa caching estratégico para tornar o app
 * funcional offline e melhorar a performance em conexões lentas.
 *
 * Estratégias implementadas:
 * - Cache First: Assets estáticos (CSS, JS, imagens, fontes)
 * - Network First: Páginas HTML e dados dinâmicos
 * - Offline Fallback: Página offline quando não há conexão
 *
 * @version 1.0.0
 */

// Nome e versão do cache - atualize a versão para forçar atualização do cache
const CACHE_VERSION = 'v1.0.0'
const CACHE_NAME = `sindoca-${CACHE_VERSION}`
const RUNTIME_CACHE = `sindoca-runtime-${CACHE_VERSION}`

// Assets críticos que serão cacheados na instalação
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Padrões de URLs para diferentes estratégias de cache
const CACHE_STRATEGIES = {
  // Cache First - Assets estáticos (prioriza cache, fallback para rede)
  cacheFirst: [
    /\.(?:css|js)$/i,                          // CSS e JavaScript
    /\.(?:jpg|jpeg|png|gif|webp|svg|ico)$/i,   // Imagens
    /\.(?:woff|woff2|ttf|eot)$/i,              // Fontes
    /\/icon-.*\.png$/i,                         // Ícones do PWA
  ],

  // Network First - Conteúdo dinâmico (prioriza rede, fallback para cache)
  networkFirst: [
    /\/api\//i,                                 // APIs
    /\.(?:json)$/i,                             // Dados JSON
  ],
}

// Tempo máximo de espera pela rede antes de usar cache (em ms)
const NETWORK_TIMEOUT = 3000

/**
 * Evento: Install
 * Dispara quando o Service Worker é instalado pela primeira vez
 * ou quando uma nova versão é detectada
 */
self.addEventListener('install', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Installing...`)

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW ${CACHE_VERSION}] Caching core assets`)
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => {
        console.log(`[SW ${CACHE_VERSION}] Installation complete`)
        // skipWaiting força o SW a ativar imediatamente
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error(`[SW ${CACHE_VERSION}] Installation failed:`, error)
      })
  )
})

/**
 * Evento: Activate
 * Dispara quando o Service Worker se torna ativo
 * Usado para limpar caches antigos
 */
self.addEventListener('activate', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Activating...`)

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Remove caches de versões antigas
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Mantém apenas caches da versão atual
              return cacheName.startsWith('sindoca-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE
            })
            .map((cacheName) => {
              console.log(`[SW ${CACHE_VERSION}] Deleting old cache: ${cacheName}`)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log(`[SW ${CACHE_VERSION}] Activation complete`)
        // clientsClaim faz o SW assumir controle de todas as páginas imediatamente
        return self.clients.claim()
      })
      .catch((error) => {
        console.error(`[SW ${CACHE_VERSION}] Activation failed:`, error)
      })
  )
})

/**
 * Evento: Fetch
 * Intercepta todas as requisições de rede
 * Aplica estratégias de cache apropriadas
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requisições de outros domínios (exceto CDNs conhecidos)
  if (url.origin !== location.origin && !isTrustedOrigin(url.origin)) {
    return
  }

  // Ignora requisições que não são GET
  if (request.method !== 'GET') {
    return
  }

  // Determina a estratégia de cache baseada na URL
  if (shouldUseCacheFirst(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request))
  } else if (shouldUseNetworkFirst(url.pathname)) {
    event.respondWith(networkFirstStrategy(request))
  } else {
    // Para páginas HTML, usa Network First com timeout
    event.respondWith(networkFirstWithTimeout(request))
  }
})

/**
 * Estratégia: Cache First
 * Busca primeiro no cache, se não encontrar busca na rede
 * Ideal para: Assets estáticos que mudam raramente
 */
async function cacheFirstStrategy(request) {
  try {
    // Tenta buscar do cache primeiro
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      console.log(`[SW] Cache hit: ${request.url}`)
      return cachedResponse
    }

    // Se não está no cache, busca da rede
    console.log(`[SW] Cache miss, fetching: ${request.url}`)
    const networkResponse = await fetch(request)

    // Cacheia a resposta para uso futuro (se for bem-sucedida)
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.error(`[SW] Cache First failed for ${request.url}:`, error)

    // Se falhar completamente, tenta retornar algo do cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Retorna fallback para imagens
    if (request.destination === 'image') {
      return caches.match('/icon-192x192.png')
    }

    throw error
  }
}

/**
 * Estratégia: Network First
 * Busca primeiro na rede, se falhar busca no cache
 * Ideal para: Conteúdo dinâmico que precisa estar atualizado
 */
async function networkFirstStrategy(request) {
  try {
    // Tenta buscar da rede primeiro
    const networkResponse = await fetch(request)

    // Cacheia a resposta para uso offline
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log(`[SW] Network failed, trying cache: ${request.url}`)

    // Se a rede falhar, tenta o cache
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    throw error
  }
}

/**
 * Estratégia: Network First com Timeout
 * Busca na rede com timeout, se demorar muito ou falhar usa cache
 * Ideal para: Páginas HTML em conexões lentas
 */
async function networkFirstWithTimeout(request) {
  try {
    // Cria uma Promise que rejeita após o timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
    })

    // Tenta buscar da rede com timeout
    const networkResponse = await Promise.race([
      fetch(request),
      timeoutPromise
    ])

    // Cacheia a resposta
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log(`[SW] Network timeout/failed, using cache: ${request.url}`)

    // Se falhar ou timeout, usa cache
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Última tentativa: retorna a página inicial do cache
    return caches.match('/')
  }
}

/**
 * Verifica se a URL deve usar estratégia Cache First
 */
function shouldUseCacheFirst(pathname) {
  return CACHE_STRATEGIES.cacheFirst.some(pattern => pattern.test(pathname))
}

/**
 * Verifica se a URL deve usar estratégia Network First
 */
function shouldUseNetworkFirst(pathname) {
  return CACHE_STRATEGIES.networkFirst.some(pattern => pattern.test(pathname))
}

/**
 * Verifica se a origem é confiável (CDNs conhecidos)
 */
function isTrustedOrigin(origin) {
  const trustedOrigins = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ]
  return trustedOrigins.includes(origin)
}

/**
 * Push Notifications
 * Gerenciamento de notificações push
 */

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event)

  let notificationData = {
    title: 'Sindoca da Maloka',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {},
  }

  // Tenta parsear os dados do push
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
      notificationData.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      tag: notificationData.tag || 'notification',
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction || false,
      actions: notificationData.actions || [],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Verifica se já existe uma janela aberta
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }

      // Se não, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event)
})

/**
 * Background Sync
 * Sincronização em background (para funcionalidades futuras)
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  try {
    console.log('[SW] Syncing data...')
    // Implementar lógica de sincronização aqui
    return Promise.resolve()
  } catch (error) {
    console.error('[SW] Sync failed:', error)
    throw error
  }
}

// Log de inicialização
console.log(`[SW ${CACHE_VERSION}] Service Worker loaded`)

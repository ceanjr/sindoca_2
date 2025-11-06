// Custom Service Worker for Push Notifications
// This extends the PWA service worker

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {}

  const title = data.title || 'Sindoca Love Site'
  const options = {
    body: data.body || 'Nova mensagem!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ver',
      },
      {
        action: 'close',
        title: 'Fechar',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Handle background sync
self.addEventListener('sync', function (event) {
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos())
  }
})

async function syncPhotos() {
  // Placeholder for background sync logic
  console.log('Background sync triggered')
}

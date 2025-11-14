'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { fetchJSON } from '@/lib/utils/fetchWithTimeout'
import { config } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook para gerenciar Push Notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState('default')
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [dbSubscription, setDbSubscription] = useState(null) // Subscription from database

  useEffect(() => {
    // Check if Push API is supported
    try {
      if (typeof window === 'undefined') {
        setIsSupported(false)
        return
      }

      // Basic checks
      const hasNotification = 'Notification' in window
      const hasServiceWorker = 'serviceWorker' in navigator
      const hasPushManager = 'PushManager' in window

      // Safari iOS specific checks
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)

      // Safari on iOS 16.4+ supports push notifications, but only when installed as PWA
      let isPWAInstalled = false
      if (isIOS && isSafari) {
        // Check if running as standalone (PWA installed)
        isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true
      }

      // Determine support
      const supported = hasNotification && hasServiceWorker && hasPushManager &&
                       (!isIOS || isPWAInstalled)

      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)

        // Load existing subscription from browser AND database
        const loadExistingSubscription = async () => {
          try {
            const registration = await navigator.serviceWorker.ready
            const existingSub = await registration.pushManager.getSubscription()
            if (existingSub) {
              logger.log('[Push] Found existing subscription in browser')
              setSubscription(existingSub)

              // Also check if subscription exists in database
              await checkDatabaseSubscription(existingSub.endpoint)
            } else {
              logger.log('[Push] No browser subscription found')
              // Still check database in case there's a stale subscription
              await checkDatabaseSubscription(null)
            }
          } catch (error) {
            logger.error('[Push] Error loading existing subscription:', error)
          }
        }

        loadExistingSubscription()
      } else {
        if (isIOS && !isPWAInstalled) {
          console.log('[Push] Safari iOS detectado - Notificações requerem instalação como PWA')
        }
      }
    } catch (error) {
      console.log('Push: Erro ao verificar suporte:', error.message)
      setIsSupported(false)
    }
  }, [])

  /**
   * Check if subscription exists in database
   */
  const checkDatabaseSubscription = async (endpoint) => {
    try {
      const supabase = createClient()

      // Get current user's subscriptions from database
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        logger.error('[Push] Error checking database subscription:', error)
        return
      }

      if (data) {
        logger.log('[Push] Found subscription in database')
        setDbSubscription(data)

        // If browser subscription exists but database has different endpoint,
        // we need to update the database
        if (endpoint && data.endpoint !== endpoint) {
          logger.warn('[Push] Subscription mismatch between browser and database')
          // The subscription will be re-synced when subscribeToPush is called
        }
      } else {
        logger.log('[Push] No subscription in database')
        setDbSubscription(null)
      }
    } catch (error) {
      logger.error('[Push] Error checking database subscription:', error)
    }
  }

  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    if (!isSupported) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        await subscribeToPush()
        return true
      } else if (permission === 'denied') {
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  /**
   * Subscribe to push notifications
   */
  const subscribeToPush = async () => {
    if (!isSupported) {
      logger.error('[Push] Push notifications not supported')
      return null
    }

    // Verificar se tem permissão antes de tentar criar subscription
    if (permission !== 'granted') {
      logger.warn('[Push] Permission not granted, cannot subscribe')
      return null
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Service Worker timeout')), 5000)
      )
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise
      ])

      // Check if already subscribed
      let sub = await registration.pushManager.getSubscription()

      if (!sub) {
        // Get VAPID public key from config
        const vapidPublicKey = config.vapidPublicKey

        if (!vapidPublicKey) {
          console.error('[Push] VAPID public key not configured')
          logger.error('[Push] VAPID key missing:', { config })
          return null
        }

        logger.log('[Push] Creating subscription with VAPID key:', vapidPublicKey.substring(0, 20) + '...')

        // Create new subscription
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }).catch((error) => {
          console.error('[Push] Error creating push subscription:', error)
          logger.error('[Push] Subscription error details:', error)
          return null
        })

        if (sub) {
          logger.log('[Push] Subscription created successfully!')
        } else {
          logger.error('[Push] Failed to create subscription')
        }
      }

      if (sub) {
        setSubscription(sub)

        // Send subscription to backend
        try {
          logger.log('[Push] Saving subscription to database...')
          const result = await fetchJSON('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000, // 10 seconds timeout
            body: JSON.stringify({
              subscription: sub.toJSON(),
            }),
          })
          logger.log('[Push] Subscription saved successfully:', result)

          // Refresh database subscription state
          await checkDatabaseSubscription(sub.endpoint)
        } catch (error) {
          console.error('[Push] Error saving subscription:', error)
          logger.error('[Push] Failed to save subscription to database:', error)
          // Não mostrar erro ao usuário - deixar UI otimista fazer seu trabalho
        }
      }

      return sub
    } catch (error) {
      console.error('Error subscribing to push:', error)
      return null
    }
  }

  /**
   * Show a local notification (doesn't require backend)
   */
  const showLocalNotification = async (title, options = {}) => {
    if (!isSupported) {
      toast.info(title, { description: options.body })
      return
    }

    if (permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Notification timeout')), 3000)
      )
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        timeoutPromise
      ])
      await registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/icon-192x192.png',
        // badge removido para evitar "from Sindoca" no Android
        vibrate: options.vibrate || [200, 100, 200],
        tag: options.tag || 'local-notification',
        data: options.data || {},
        ...options,
      })
    } catch (error) {
      console.log('Erro ao mostrar notificação:', error.message)
      // Fallback to toast
      toast.info(title, { description: options.body })
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = async () => {
    if (subscription) {
      try {
        const endpoint = subscription.endpoint

        // Unsubscribe from browser
        await subscription.unsubscribe()

        // Delete from backend
        try {
          await fetchJSON('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000, // 10 seconds timeout
            body: JSON.stringify({ endpoint }),
          })
        } catch (error) {
          console.error('Error deleting subscription from server:', error)
        }

        setSubscription(null)
        setDbSubscription(null) // Clear database subscription state
        logger.log('[Push] Unsubscribed successfully')
      } catch (error) {
        console.error('Error unsubscribing:', error)
        logger.error('[Push] Unsubscribe error:', error)
      }
    }
  }

  // Note: Auto-subscribe is now handled by AppProvider to ensure user is logged in
  // This prevents 401 errors when trying to save subscription to database

  return {
    isSupported,
    permission,
    subscription, // Browser subscription
    dbSubscription, // Database subscription (more reliable for checking if push is active)
    requestPermission,
    subscribeToPush,
    showLocalNotification,
    unsubscribe,
    isGranted: permission === 'granted',
    // Helper to check if push is truly active (both browser and database)
    isPushActive: subscription !== null && dbSubscription !== null,
  }
}

/**
 * Helper function to convert base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

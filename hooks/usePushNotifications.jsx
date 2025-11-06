'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

/**
 * Hook para gerenciar Push Notifications
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState('default')
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    // Check if Push API is supported
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Notificações não suportadas neste navegador')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === 'granted') {
        toast.success('Notificações ativadas!')
        await subscribeToPush()
        return true
      } else if (permission === 'denied') {
        toast.error('Permissão de notificações negada')
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast.error('Erro ao solicitar permissão')
      return false
    }
  }

  /**
   * Subscribe to push notifications
   */
  const subscribeToPush = async () => {
    if (!isSupported) return

    try {
      const registration = await navigator.serviceWorker.ready

      // Check if already subscribed
      let sub = await registration.pushManager.getSubscription()

      if (!sub) {
        // Create new subscription
        // Note: You'll need a VAPID public key for production
        // For now, we'll use a mock subscription
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            // This is a placeholder - replace with your VAPID public key
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xQmrxSL3o'
          ),
        }).catch(() => null)
      }

      if (sub) {
        setSubscription(sub)
        // Here you would send the subscription to your backend
        // await sendSubscriptionToServer(sub)
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
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/icon-192x192.png',
        vibrate: options.vibrate || [200, 100, 200],
        tag: options.tag || 'local-notification',
        data: options.data || {},
        ...options,
      })
    } catch (error) {
      console.error('Error showing notification:', error)
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
        await subscription.unsubscribe()
        setSubscription(null)
        toast.success('Notificações desativadas')
      } catch (error) {
        console.error('Error unsubscribing:', error)
        toast.error('Erro ao desativar notificações')
      }
    }
  }

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    showLocalNotification,
    unsubscribe,
    isGranted: permission === 'granted',
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

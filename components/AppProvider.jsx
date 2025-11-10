'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/utils/logger'

const AppContext = createContext()

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export default function AppProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const { user } = useAuth()
  const { subscribeToPush, isSupported, permission } = usePushNotifications()

  // Load theme from storage
  useEffect(() => {
    const loadTheme = async () => {
      if (typeof window !== 'undefined' && window.storage) {
        try {
          const savedTheme = await window.storage.get('theme', false)
          if (savedTheme) setTheme(savedTheme)
        } catch (error) {
          // console.log('Storage not available, using default theme')
        }
      }
    }
    loadTheme()
  }, [])

  // Apply dark mode class to html
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Register Service Worker with retry logic
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker não suportado')
      return
    }

    let retryCount = 0
    const maxRetries = 3

    // Listener para mensagens do Service Worker
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('✅ Service Worker atualizado:', event.data.version)
        // Não recarregar automaticamente para evitar loops
        // A nova versão será usada na próxima navegação
      }

      // Navigate when notification is clicked
      if (event.data && event.data.type === 'NAVIGATE') {
        console.log('📍 Navegando para:', event.data.url)
        window.location.href = event.data.url
      }
    }

    navigator.serviceWorker.addEventListener('message', handleSWMessage)

    let updateIntervalId = null

    const registerServiceWorker = async () => {
      try {
        console.log('Registrando Service Worker...')

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none', // Sempre busca versão nova do SW
        })

        console.log('Service Worker registrado:', registration.scope)

        // Configurar listener para atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('Nova versão do service worker encontrada')

          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nova versão disponível - aguardando ativação')
            }
            if (newWorker.state === 'activated') {
              console.log('Nova versão ativada!')
            }
          })
        })

        // Verificar atualizações a cada 5 minutos (balanceado)
        updateIntervalId = setInterval(() => {
          registration.update().catch(err => {
            console.log('Erro ao verificar atualização:', err.message)
          })
        }, 5 * 60 * 1000) // 5 minutos

      } catch (error) {
        console.error('Erro ao registrar Service Worker:', {
          name: error.name,
          message: error.message,
        })

        // Tentar novamente se ainda não excedeu o máximo de tentativas
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`Tentando novamente (${retryCount}/${maxRetries}) em 5s...`)
          setTimeout(registerServiceWorker, 5000)
        }
      }
    }

    registerServiceWorker()

    // Cleanup function for useEffect
    return () => {
      if (updateIntervalId) {
        clearInterval(updateIntervalId)
      }
      navigator.serviceWorker.removeEventListener('message', handleSWMessage)
    }
  }, [])

  // Auto-request push notification permission when user is logged in
  useEffect(() => {
    if (!user || !isSupported) return

    // Use ref to prevent duplicate execution
    let isExecuting = false

    const setupPushNotifications = async () => {
      if (isExecuting) return
      isExecuting = true

      try {
        // Only auto-request if permission is not already denied
        if (permission === 'default') {
          // Wait a bit after page load to ask for permission (better UX)
          await new Promise(resolve => setTimeout(resolve, 3000))

          const result = await Notification.requestPermission()
          if (result === 'granted') {
            await subscribeToPush()
          }
        } else if (permission === 'granted') {
          // If permission is granted, check if we have an active subscription
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready
            const existingSubscription = await registration.pushManager.getSubscription()

            if (!existingSubscription) {
              // Permission granted but no subscription - create one!
              logger.log('[Push] Permission granted but no subscription found - creating one...')
              await subscribeToPush()
            } else {
              // Subscription exists, sync with database (important for migration)
              logger.log('[Push] Subscription found, syncing with database...')
              await subscribeToPush()
            }
          }
        }
      } catch (error) {
        logger.error('[Push] Error setting up notifications:', error)
      } finally {
        isExecuting = false
      }
    }

    setupPushNotifications()
    // Don't add subscribeToPush to deps - it causes unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSupported, permission])

  // Save theme to storage
  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme)
    if (typeof window !== 'undefined' && window.storage) {
      try {
        await window.storage.set('theme', newTheme, false)
      } catch (error) {
        // console.log('Could not save theme preference')
      }
    }
  }

  return (
    <AppContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </AppContext.Provider>
  )
}

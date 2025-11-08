'use client'

import { useState, useEffect, createContext, useContext } from 'react'

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
        const updateInterval = setInterval(() => {
          registration.update().catch(err => {
            console.log('Erro ao verificar atualização:', err.message)
          })
        }, 5 * 60 * 1000) // 5 minutos

        // Limpar interval quando componente desmontar
        return () => {
          clearInterval(updateInterval)
          navigator.serviceWorker.removeEventListener('message', handleSWMessage)
        }

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
  }, [])

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

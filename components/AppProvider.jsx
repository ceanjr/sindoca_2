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

  // Register Service Worker
  useEffect(() => {
    console.log('🔍 AppProvider mounted - checking SW support')
    console.log('Window available:', typeof window !== 'undefined')
    console.log('ServiceWorker in navigator:', typeof window !== 'undefined' && 'serviceWorker' in navigator)

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('🚀 Tentando registrar Service Worker...')

      // Register custom service worker
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registrado com sucesso!')
          console.log('📍 Scope:', registration.scope)
          console.log('📦 Active:', registration.active?.state)
          console.log('⏳ Installing:', registration.installing?.state)
          console.log('⏸️ Waiting:', registration.waiting?.state)

          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            console.log('🔄 Nova versão do service worker encontrada')

            newWorker?.addEventListener('statechange', () => {
              console.log('📡 SW state changed:', newWorker.state)
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✨ Nova versão disponível - recarregue a página')
                // Opcional: mostrar uma mensagem ao usuário para recarregar
              }
            })
          })

          // Check for updates every hour
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error)
          console.error('📄 Error name:', error.name)
          console.error('💬 Error message:', error.message)
          console.error('🔗 Error stack:', error.stack)
        })
    } else {
      console.log('⚠️ Service Worker não suportado neste ambiente')
    }
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

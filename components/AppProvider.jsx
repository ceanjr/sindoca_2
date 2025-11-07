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
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register SW - will only work in production build
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado com sucesso:', registration.scope)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            console.log('🔄 Nova versão do service worker encontrada')

            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✨ Nova versão disponível - recarregue a página')
              }
            })
          })
        })
        .catch((error) => {
          console.log('ℹ️ Service Worker não disponível (desenvolvimento):', error.message)
        })
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

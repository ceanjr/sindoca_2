'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para gerenciar instalação do PWA
 * Captura o evento beforeinstallprompt e permite instalar o app
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verifica se está no navegador
    if (typeof window === 'undefined') return

    // Verifica se o app já está instalado
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
        setIsInstallable(false)
        return
      }
    } catch (error) {
      console.log('PWA: Erro ao verificar display-mode:', error.message)
    }

    // Verifica instalabilidade de forma alternativa (sem depender só do evento)
    const checkInstallability = async () => {
      try {
        // Verifica se tem service worker (com timeout)
        if ('serviceWorker' in navigator) {
          const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000))
          const registrationPromise = navigator.serviceWorker.getRegistration()
          const registration = await Promise.race([registrationPromise, timeoutPromise])
          const hasServiceWorker = !!registration?.active

          // Verifica se tem manifest
          const manifestLink = document.querySelector('link[rel="manifest"]')
          const hasManifest = !!manifestLink

          // Se tem SW e manifest, considera potencialmente instalável
          if (hasServiceWorker && hasManifest) {
            console.log('PWA: Critérios básicos atendidos (SW + Manifest)')
          }
        }
      } catch (error) {
        console.log('PWA: Erro ao verificar instalabilidade:', error.message)
      }
    }

    // Não deixar o check bloquear o resto
    checkInstallability().catch(() => {})

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('✅ PWA: beforeinstallprompt event captured!')
      console.log('PWA: userChoice will be prompted')
      // Previne o mini-infobar do Chrome no mobile
      e.preventDefault()
      // Guarda o evento para usar depois
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    // Timeout para detectar se o evento não foi disparado
    const timeoutId = setTimeout(() => {
      if (!deferredPrompt) {
        console.log('⚠️ PWA: beforeinstallprompt NÃO foi disparado após 5 segundos')
        console.log('Possíveis motivos:')
        console.log('1. Já foi instalado anteriormente (mesmo que desinstalado)')
        console.log('2. Cooldown do navegador (tente novamente em 24h)')
        console.log('3. Falta engajamento (interaja mais com o app)')
        console.log('4. Modo anônimo/incógnito')
        console.log('💡 Solução: Use o menu do navegador → "Instalar app"')
      }
    }, 5000)

    // Detecta quando o app foi instalado
    const handleAppInstalled = () => {
      console.log('PWA: App foi instalado')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  /**
   * Mostra o prompt de instalação
   */
  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('PWA: Prompt de instalação não disponível')
      return false
    }

    // Mostra o prompt de instalação
    deferredPrompt.prompt()

    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA: User choice: ${outcome}`)

    if (outcome === 'accepted') {
      console.log('PWA: Usuário aceitou instalar')
    } else {
      console.log('PWA: Usuário recusou instalar')
    }

    // Limpa o prompt pois só pode ser usado uma vez
    setDeferredPrompt(null)
    setIsInstallable(false)

    return outcome === 'accepted'
  }

  /**
   * Verifica se está rodando em modo standalone
   */
  const isStandalone = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true
  }

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    isStandalone: isStandalone(),
  }
}

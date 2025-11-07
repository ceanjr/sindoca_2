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
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event captured')
      // Previne o mini-infobar do Chrome no mobile
      e.preventDefault()
      // Guarda o evento para usar depois
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

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

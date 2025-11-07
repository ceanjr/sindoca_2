'use client'

import { useEffect, useState } from 'react'
import { usePWAInstall } from '@/hooks/usePWAInstall'

// Force this page to be client-side only
export const dynamic = 'force-dynamic'

export default function PWADebugPage() {
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWAInstall()
  const [diagnostics, setDiagnostics] = useState({
    hasServiceWorker: false,
    hasManifest: false,
    isSecureContext: false,
    manifestData: null,
    serviceWorkerState: null,
    swFileExists: false,
    registrationError: null,
    errors: [],
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    async function runDiagnostics() {
      const results = {
        hasServiceWorker: 'serviceWorker' in navigator,
        hasManifest: false,
        isSecureContext: window.isSecureContext,
        manifestData: null,
        serviceWorkerState: null,
        errors: [],
      }

      // Check if sw.js file exists
      try {
        const swResponse = await fetch('/sw.js', { method: 'HEAD' })
        results.swFileExists = swResponse.ok
        if (!swResponse.ok) {
          results.errors.push(`Arquivo sw.js não encontrado (status ${swResponse.status})`)
        }
      } catch (error) {
        results.errors.push(`Erro ao verificar sw.js: ${error.message}`)
      }

      // Check Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            results.serviceWorkerState = {
              state: registration.active?.state || 'not active',
              scope: registration.scope,
              updateViaCache: registration.updateViaCache,
              installing: registration.installing?.state,
              waiting: registration.waiting?.state,
            }
          } else {
            // Try to register manually to get error
            try {
              await navigator.serviceWorker.register('/sw.js')
              results.errors.push('SW registrado agora, recarregue a página')
            } catch (regError) {
              results.registrationError = regError.message
              results.errors.push(`Erro ao registrar SW: ${regError.message}`)
            }
          }
        } catch (error) {
          results.errors.push(`Erro ao verificar Service Worker: ${error.message}`)
        }
      }

      // Check Manifest
      try {
        const response = await fetch('/manifest.json')
        if (response.ok) {
          results.hasManifest = true
          results.manifestData = await response.json()
        } else {
          results.errors.push(`Manifest retornou status ${response.status}`)
        }
      } catch (error) {
        results.errors.push(`Erro ao buscar manifest: ${error.message}`)
      }

      // Check PWA criteria
      if (!results.isSecureContext) {
        results.errors.push('Não está em contexto seguro (HTTPS)')
      }

      setDiagnostics(results)
    }

    runDiagnostics()
  }, [])

  const handleInstall = async () => {
    const result = await promptInstall()
    console.log('Install result:', result)
  }

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--textPrimary)' }}>
          PWA Debug Info
        </h1>

        {/* Installation Status */}
        <div className="glass-strong rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--textPrimary)' }}>
            Status de Instalação
          </h2>
          <div className="space-y-2">
            <StatusItem label="Instalável (via evento)" value={isInstallable} />
            <StatusItem label="Instalado" value={isInstalled} />
            <StatusItem label="Modo Standalone" value={isStandalone} />
          </div>
          {isInstallable ? (
            <button
              onClick={handleInstall}
              className="mt-4 px-6 py-3 rounded-xl text-white font-medium"
              style={{ background: 'var(--primary)' }}
            >
              Instalar Agora
            </button>
          ) : !isInstalled && (
            <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">
                Como Instalar Manualmente
              </h3>
              <ul className="text-xs space-y-1" style={{ color: 'var(--textSecondary)' }}>
                <li>• <strong>Chrome/Edge (Desktop):</strong> Ícone ⊕ na barra de endereço ou Menu → "Instalar Sindoca"</li>
                <li>• <strong>Chrome (Android):</strong> Menu (⋮) → "Instalar app" ou "Adicionar à tela inicial"</li>
                <li>• <strong>Safari (iOS):</strong> Botão Compartilhar → "Adicionar à Tela de Início"</li>
                <li>• <strong>Firefox:</strong> Menu → "Instalar"</li>
              </ul>
              <p className="text-xs mt-3 text-yellow-400">
                ⚠️ O evento de instalação automática pode não disparar se você já instalou antes ou não interagiu o suficiente com o app
              </p>
            </div>
          )}
        </div>

        {/* System Diagnostics */}
        <div className="glass-strong rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--textPrimary)' }}>
            Diagnósticos do Sistema
          </h2>
          <div className="space-y-2">
            <StatusItem label="Service Worker Suportado" value={diagnostics.hasServiceWorker} />
            <StatusItem label="Arquivo sw.js Existe" value={diagnostics.swFileExists} />
            <StatusItem label="Manifest Acessível" value={diagnostics.hasManifest} />
            <StatusItem label="Contexto Seguro (HTTPS)" value={diagnostics.isSecureContext} />
          </div>
          {diagnostics.registrationError && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">
                <strong>Erro de registro:</strong> {diagnostics.registrationError}
              </p>
            </div>
          )}
        </div>

        {/* Service Worker Status */}
        {diagnostics.serviceWorkerState && (
          <div className="glass-strong rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--textPrimary)' }}>
              Service Worker
            </h2>
            <div className="space-y-2 text-sm font-mono">
              <div style={{ color: 'var(--textSecondary)' }}>
                <strong>Estado:</strong> {diagnostics.serviceWorkerState.state}
              </div>
              <div style={{ color: 'var(--textSecondary)' }}>
                <strong>Scope:</strong> {diagnostics.serviceWorkerState.scope}
              </div>
              <div style={{ color: 'var(--textSecondary)' }}>
                <strong>Update Via Cache:</strong> {diagnostics.serviceWorkerState.updateViaCache}
              </div>
            </div>
          </div>
        )}

        {/* Manifest Data */}
        {diagnostics.manifestData && (
          <div className="glass-strong rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--textPrimary)' }}>
              Manifest Data
            </h2>
            <pre className="text-xs overflow-auto p-4 rounded-lg bg-black/20" style={{ color: 'var(--textSecondary)' }}>
              {JSON.stringify(diagnostics.manifestData, null, 2)}
            </pre>
          </div>
        )}

        {/* Errors */}
        {diagnostics.errors.length > 0 && (
          <div className="glass-strong rounded-2xl p-6 mb-6 border-2 border-red-500/30">
            <h2 className="text-xl font-semibold mb-4 text-red-500">
              Problemas Detectados
            </h2>
            <ul className="space-y-2">
              {diagnostics.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-400">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Environment Info */}
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--textPrimary)' }}>
            Informações do Ambiente
          </h2>
          <div className="space-y-2 text-sm" style={{ color: 'var(--textSecondary)' }}>
            <div><strong>User Agent:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
            <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
            <div><strong>Protocol:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusItem({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span style={{ color: 'var(--textSecondary)' }}>{label}</span>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
        value ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {value ? '✓ Sim' : '✗ Não'}
      </span>
    </div>
  )
}

'use client';

import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Componente que mostra um banner/botão para instalar o PWA
 */
export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, isStandalone } =
    usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  // Não mostra se já está instalado, não é instalável ou foi descartado
  if (!isInstallable || isInstalled || isStandalone || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      toast.success('App instalado com sucesso!');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 glass-strong rounded-2xl p-4 shadow-lg bg-primary/30 backdrop-blur-md"
      style={{
        border: '1px solid rgba(255, 107, 157, 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary)' }}
          >
            <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm mb-1"
            style={{ color: 'var(--textPrimary)' }}
          >
            Instalar Sindoca
          </h3>
          <p className="text-xs" style={{ color: 'var(--textSecondary)' }}>
            Instale o app na sua tela inicial para acesso rápido e experiência
            melhor!
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
          aria-label="Fechar"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--textSecondary)' }}
          >
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleInstall}
          className="flex-1 py-2 px-4 rounded-xl font-medium text-sm text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background:
              'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          }}
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 rounded-xl font-medium text-sm transition-colors hover:bg-black/5"
          style={{ color: 'var(--textSecondary)' }}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}

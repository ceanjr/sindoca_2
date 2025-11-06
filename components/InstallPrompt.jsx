'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import Button from './ui/Button';

/**
 * Componente que exibe um prompt para instalar o PWA
 * Aparece apenas em dispositivos que suportam instalação
 * Respeita a escolha do usuário (instalar ou dispensar)
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já instalou ou dispensou
    const hasInstalled = localStorage.getItem('pwa-installed');
    const hasDismissed = localStorage.getItem('pwa-dismissed');

    if (hasInstalled || hasDismissed) {
      return;
    }

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Previne o prompt automático do browser
      e.preventDefault();
      // Salva o evento para usar depois
      setDeferredPrompt(e);

      // Aguarda 5 segundos antes de mostrar (evita conflito com outros prompts)
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    // Detecta quando o app foi instalado
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt de instalação nativo
    deferredPrompt.prompt();

    // Aguarda a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA instalado com sucesso');
      localStorage.setItem('pwa-installed', 'true');
    }

    // Limpa o prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-4 right-4 z-40 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-md"
      >
        <div className="glass-strong rounded-3xl p-5 shadow-soft-xl border border-primary/20">
          {/* Botão de fechar */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-primary/10 transition-colors"
            aria-label="Dispensar"
          >
            <X size={18} className="text-textSecondary" />
          </button>

          {/* Conteúdo */}
          <div className="flex items-start gap-4">
            {/* Ícone do app */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-soft-md">
              <Download size={28} className="text-white" />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-textPrimary mb-1">
                Instalar Sindoca
              </h3>
              <p className="text-sm text-textSecondary mb-4 leading-relaxed">
                Adicione nosso app à tela inicial para acesso rápido e experiência completa!
              </p>

              {/* Botões */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={handleInstallClick}
                  className="flex-1"
                >
                  Instalar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                >
                  Agora não
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

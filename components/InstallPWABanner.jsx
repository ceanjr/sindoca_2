'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * InstallPWABanner - Banner para instalar o PWA
 * Aparece automaticamente na primeira visita se o app não estiver instalado
 */
export default function InstallPWABanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);

    setIsIOS(iOS);
    setIsAndroid(android);

    // Verificar se PWA já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;

    if (isStandalone || isIOSStandalone) {
      console.log('[InstallBanner] App já está instalado');
      return;
    }

    // Verificar se usuário já fechou o banner antes
    const bannerDismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedDate = localStorage.getItem('pwa-banner-dismissed-date');

    // Se fechou há menos de 7 dias, não mostrar
    if (bannerDismissed && dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        console.log('[InstallBanner] Banner foi fechado recentemente');
        return;
      }
    }

    // Capturar evento beforeinstallprompt (Chrome/Android)
    const handleBeforeInstallPrompt = (e) => {
      console.log('[InstallBanner] beforeinstallprompt capturado');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, sempre mostrar (não tem beforeinstallprompt)
    if (iOS && !isIOSStandalone) {
      console.log('[InstallBanner] iOS detectado, mostrando banner');
      setTimeout(() => setShowBanner(true), 2000); // Aguardar 2s para não ser intrusivo
    }

    // Para Android, se não capturar beforeinstallprompt em 3s, mostrar mesmo assim
    if (android && !isStandalone) {
      setTimeout(() => {
        if (!deferredPrompt) {
          console.log('[InstallBanner] Android sem beforeinstallprompt, mostrando banner customizado');
          setShowBanner(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android com beforeinstallprompt - usar prompt nativo
      console.log('[InstallBanner] Iniciando instalação via prompt nativo');
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log('[InstallBanner] Escolha do usuário:', outcome);

      if (outcome === 'accepted') {
        console.log('[InstallBanner] Usuário aceitou a instalação');
      }

      setDeferredPrompt(null);
      setShowBanner(false);
    } else if (isIOS) {
      // iOS - não fechar banner, apenas mostrar instruções
      console.log('[InstallBanner] iOS - Mostrando instruções');
    } else {
      // Android sem beforeinstallprompt - instruções manuais
      console.log('[InstallBanner] Android - Mostrando instruções manuais');
    }
  };

  const handleDismiss = () => {
    console.log('[InstallBanner] Banner fechado pelo usuário');
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
    localStorage.setItem('pwa-banner-dismissed-date', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
        }}
      >
        <div className="mx-4 mb-4 pointer-events-auto">
          <div className="bg-gradient-to-br from-primary to-pink-600 rounded-3xl shadow-2xl overflow-hidden">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
              aria-label="Fechar"
            >
              <X size={18} className="text-white" />
            </button>

            <div className="p-6">
              {/* Icon e título */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 flex-shrink-0 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <img
                    src="/icon-192x192.png"
                    alt="Sindoca"
                    className="w-12 h-12 rounded-xl"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Instalar Sindoca
                  </h3>
                  <p className="text-white/90 text-sm">
                    {isIOS
                      ? 'Adicione à tela inicial para melhor experiência'
                      : 'Instale nosso app para acesso rápido e notificações'}
                  </p>
                </div>
              </div>

              {/* Botão de instalação ou instruções */}
              {deferredPrompt ? (
                // Android com prompt nativo
                <button
                  onClick={handleInstallClick}
                  className="w-full py-4 px-6 bg-white text-primary font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download size={20} />
                  Instalar App
                </button>
              ) : isIOS ? (
                // iOS - Instruções
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-3">
                  <p className="text-white font-semibold text-sm">
                    📱 Como instalar no iOS:
                  </p>
                  <ol className="text-white/90 text-sm space-y-2 ml-4 list-decimal">
                    <li>
                      Toque no botão <strong>Compartilhar</strong> (
                      <svg
                        className="inline w-4 h-4 mx-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      ) na barra inferior
                    </li>
                    <li>
                      Role para baixo e toque em{' '}
                      <strong>"Adicionar à Tela Inicial"</strong>
                    </li>
                    <li>
                      Toque em <strong>"Adicionar"</strong>
                    </li>
                  </ol>
                </div>
              ) : (
                // Android sem prompt - Instruções manuais
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-3">
                  <p className="text-white font-semibold text-sm">
                    📱 Como instalar no Android:
                  </p>
                  <ol className="text-white/90 text-sm space-y-2 ml-4 list-decimal">
                    <li>
                      Toque no menu <strong>⋮</strong> (três pontos) no canto
                      superior direito
                    </li>
                    <li>
                      Procure e toque em <strong>"Instalar app"</strong> ou{' '}
                      <strong>"Adicionar à tela inicial"</strong>
                    </li>
                    <li>
                      Confirme tocando em <strong>"Instalar"</strong>
                    </li>
                  </ol>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-white/80 text-xs">
                      💡 Se não aparecer a opção, tente limpar o cache do
                      navegador primeiro
                    </p>
                  </div>
                </div>
              )}

              {/* Benefícios */}
              <div className="mt-4 flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-white/90 text-xs">
                  <Smartphone size={14} />
                  <span>Acesso rápido</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-xs">
                  <Download size={14} />
                  <span>Offline</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-xs">
                  🔔
                  <span>Notificações</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

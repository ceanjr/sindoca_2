'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, BellRing } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

/**
 * Unified PWA Actions Component
 * Shows a floating action button with options to:
 * - Install PWA
 * - Enable Push Notifications
 *
 * Disappears after both actions are completed
 */
export default function PWAActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [showInstallOption, setShowInstallOption] = useState(false);
  const [showNotificationOption, setShowNotificationOption] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { permission, isSupported, requestPermission } = usePushNotifications();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine which options to show
  useEffect(() => {
    // Check localStorage for dismissed actions
    const installDismissed =
      localStorage.getItem('pwa-install-dismissed') === 'true';
    const notificationDismissed =
      localStorage.getItem('pwa-notification-dismissed') === 'true';

    // Show install option if:
    // - Not dismissed before
    // - Is installable OR not installed yet
    const shouldShowInstall =
      !installDismissed && (isInstallable || !isInstalled);

    // Show notification option if:
    // - Not dismissed before
    // - Notifications are supported
    // - Permission is not granted yet
    const shouldShowNotification =
      !notificationDismissed && isSupported && permission !== 'granted';

    setShowInstallOption(shouldShowInstall);
    setShowNotificationOption(shouldShowNotification);
  }, [isInstallable, isInstalled, isSupported, permission]);

  // Hide button if no options to show
  const shouldShowButton = showInstallOption || showNotificationOption;

  const handleInstallClick = async () => {
    try {
      const installed = await promptInstall();

      if (installed) {
        toast.success('App instalado com sucesso! 🎉');
        localStorage.setItem('pwa-install-dismissed', 'true');
        setShowInstallOption(false);
        setIsOpen(false);
      } else {
        // User cancelled or installation failed
        localStorage.setItem('pwa-install-dismissed', 'true');
        setShowInstallOption(false);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Erro ao instalar app');
    }
  };

  const handleNotificationClick = async () => {
    try {
      const granted = await requestPermission();

      if (granted) {
        toast.success('Notificações ativadas! 🔔');
      } else {
        toast.info('Você pode ativar depois nas configurações');
      }

      // Always dismiss after user interacts
      localStorage.setItem('pwa-notification-dismissed', 'true');
      setShowNotificationOption(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Notification error:', error);
      toast.error('Erro ao ativar notificações');
      localStorage.setItem('pwa-notification-dismissed', 'true');
      setShowNotificationOption(false);
      setIsOpen(false);
    }
  };

  if (!shouldShowButton) {
    return null;
  }

  return (
    <>
      {/* Backdrop - only on mobile when open */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <div className="fixed bottom-[104px] right-4 z-[100] lg:bottom-6">
        {/* Options Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile: Speed Dial (stacked buttons) */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex flex-col gap-3 mb-4"
                >
                  {showInstallOption && (
                    <motion.button
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0, y: 20 }}
                      transition={{ delay: 0.05 }}
                      onClick={handleInstallClick}
                      className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-4 py-3 hover:shadow-xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Download size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-textPrimary">
                        Instalar App
                      </span>
                    </motion.button>
                  )}

                  {showNotificationOption && (
                    <motion.button
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0, y: 20 }}
                      transition={{ delay: showInstallOption ? 0.1 : 0.05 }}
                      onClick={handleNotificationClick}
                      className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-4 py-3 hover:shadow-xl transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <BellRing size={20} className="text-primary" />
                      </div>
                      <span className="font-medium text-textPrimary">
                        Ativar Notificações
                      </span>
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Desktop: Compact Card */}
              {!isMobile && (
                <motion.div
                  initial={{ opacity: 0, x: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  className="absolute bottom-full right-0 mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[240px]"
                >
                  <div className="space-y-2">
                    {showInstallOption && (
                      <button
                        onClick={handleInstallClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                          <Download size={18} className="text-primary" />
                        </div>
                        <span className="font-medium text-textPrimary text-sm">
                          Instalar App
                        </span>
                      </button>
                    )}

                    {showNotificationOption && (
                      <button
                        onClick={handleNotificationClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                          <BellRing size={18} className="text-primary" />
                        </div>
                        <span className="font-medium text-textPrimary text-sm">
                          Ativar Notificações
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-primary rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
          aria-label="Ações PWA"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}

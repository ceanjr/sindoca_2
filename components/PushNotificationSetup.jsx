'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Component to request push notification permission on first app load
 * Shows a friendly banner asking for permission
 */
export default function PushNotificationSetup() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { permission, isSupported, requestPermission } = usePushNotifications();

  useEffect(() => {
    // Only show prompt if:
    // 1. Push is supported
    // 2. Permission is default (not granted or denied)
    // 3. User hasn't dismissed the prompt before
    const hasSeenPrompt = localStorage.getItem('push-prompt-seen');

    if (isSupported && permission === 'default' && !hasSeenPrompt) {
      // Wait 2 seconds after page load to show prompt (less intrusive)
      const timeout = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isSupported, permission]);

  const handleAccept = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPrompt(false);
      localStorage.setItem('push-prompt-seen', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push-prompt-seen', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-20 left-4 right-4 z-[100] lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-purple-500" />

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>

            <div className="flex gap-3">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Bell size={20} className="text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pr-6">
                <h3 className="font-bold text-textPrimary mb-1">
                  Ative as notificações 💕
                </h3>
                <p className="text-sm text-textSecondary mb-3">
                  Receba avisos quando seu macho interagir com você pelo app!
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Ativar
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 text-textSecondary hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Depois
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

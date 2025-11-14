'use client';

import { useState } from 'react';
import { ChevronLeft, Bug } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DebugPushTab from './debug-tabs/DebugPushTab';

const TABS = [
  {
    id: 'push',
    label: 'Push Notifications',
    icon: '🔔',
    component: DebugPushTab,
  },
  // Futuramente: outras tabs de debug
  // { id: 'database', label: 'Database', icon: '💾', component: DebugDatabaseTab },
  // { id: 'auth', label: 'Authentication', icon: '🔐', component: DebugAuthTab },
];

/**
 * DebugSheet - Sheet com tabs para ferramentas de debug
 */
export default function DebugSheet({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('push');

  const handleClose = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClose();
  };

  const handleTabChange = (tabId) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
    setActiveTab(tabId);
  };

  const handleDragEnd = (event, info) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Velocity threshold (>850px/s fecha mesmo se perto do topo)
    if (velocity > 850 || offset > 150) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onClose();
    }
  };

  const ActiveTabComponent = TABS.find((tab) => tab.id === activeTab)?.component;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Escurece o menu atrás e cobre safe area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed bg-black/50 backdrop-blur-md z-[60]"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 35,
              stiffness: 260,
              mass: 0.8,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragStart={() => {
              if ('vibrate' in navigator) {
                navigator.vibrate(5);
              }
            }}
            onDragEnd={handleDragEnd}
            className="fixed left-0 right-0 z-[70] bg-white overflow-hidden"
            style={{
              top: '120px',
              bottom: 'calc(-1 * env(safe-area-inset-bottom))',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.18)',
              touchAction: 'none',
            }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 z-10">
              <div className="flex items-center justify-between px-4 py-4">
                <button
                  onClick={handleClose}
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={24} className="text-textPrimary" />
                </button>
                <div className="flex items-center gap-2">
                  <Bug size={20} className="text-primary" />
                  <h2 className="text-lg font-semibold text-textPrimary">Debug</h2>
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Drag indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />

              {/* Tabs */}
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all
                      ${
                        activeTab === tab.id
                          ? 'bg-primary text-white font-semibold'
                          : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                      }
                    `}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div
              className="overflow-y-auto h-full"
              style={{
                overscrollBehavior: 'contain',
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'calc(70px + env(safe-area-inset-bottom))',
              }}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {ActiveTabComponent && <ActiveTabComponent />}
            </div>

            {/* Safe Area Bottom - Fundo branco para iOS */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-white pointer-events-none z-10"
              style={{
                height: 'env(safe-area-inset-bottom)',
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

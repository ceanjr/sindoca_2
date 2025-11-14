'use client';

import { useState, useEffect } from 'react';
import {
  Gift,
  User,
  Bell,
  ChevronRight,
  LogOut as LogOutIcon,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AvatarPicker from '@/components/ui/AvatarPicker';
import ProfileSheet from './ProfileSheet';
import NotificationsSheet from './NotificationsSheet';

/**
 * MenuSheet - Menu principal do app
 */
export default function MenuSheet({ isOpen, onClose, onLogout }) {
  const { user, profile } = useAuth();
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);

  const handleClose = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClose();
  };

  const handleDragEnd = (event, info) => {
    // Se arrastar mais de 200px para baixo, fechar
    if (info.offset.y > 200) {
      onClose();
    }
  };

  const handleOpenProfile = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setShowProfileSheet(true);
  };

  const handleOpenNotifications = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setShowNotificationsSheet(true);
  };

  const handleLogout = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
    onLogout();
  };

  const handleAvatarChange = () => {
    // O AvatarPicker já atualiza o contexto automaticamente
  };

  // Bloquear scroll do body quando menu estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Garantir safe area branca mesmo com sub-sheets abertos
  useEffect(() => {
    if (isOpen || showProfileSheet || showNotificationsSheet) {
      // Força safe area branca
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', '#ffffff');
      }
    }
  }, [isOpen, showProfileSheet, showNotificationsSheet]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={handleClose}
            />

            {/* Fullscreen Bottom Sheet */}
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
              onDragEnd={handleDragEnd}
              onDragStart={() => {
                if ('vibrate' in navigator) {
                  navigator.vibrate(5);
                }
              }}
              className="fixed left-0 right-0 z-50 bg-white overflow-hidden"
              style={{
                top: '80px',
                bottom: 'calc(-1 * env(safe-area-inset-bottom))',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.12)',
                touchAction: 'none',
              }}
            >
              {/* Header com drag indicator e botão fechar */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 z-10">
                {/* Drag indicator */}
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="w-10" /> {/* Spacer */}
                  <h2 className="text-lg font-semibold text-textPrimary">
                    Menu
                  </h2>
                  <button
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={24} className="text-textSecondary" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div
                className="overflow-y-auto h-full"
                style={{
                  overscrollBehavior: 'contain',
                  paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
                  touchAction: 'pan-y', // Permite apenas scroll vertical
                  WebkitOverflowScrolling: 'touch', // Smooth scroll iOS
                }}
                onTouchStart={(e) => e.stopPropagation()} // Previne drag quando rola
              >
                <div className="px-6 space-y-8 pt-4">
                  {/* Avatar e Nome */}
                  <div className="flex flex-col items-center pt-4">
                    <div className="scale-75">
                      <AvatarPicker
                        avatarUrl={profile?.avatar_url}
                        userId={user?.id}
                        onAvatarChange={handleAvatarChange}
                      />
                    </div>
                    <h2 className="text-2xl font-bold text-textPrimary mt-2">
                      {profile?.full_name || 'Usuário'}
                    </h2>
                  </div>

                  {/* SEÇÃO: RECURSOS */}
                  <div>
                    <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
                      Recursos
                    </h3>

                    <div className="space-y-3">
                      {/* Em Breve... (tab fake) */}
                      <div className="bg-gradient-to-r from-primary/5 to-lavender/5 rounded-2xl p-4 border-2 border-dashed border-primary/20 cursor-not-allowed">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-lavender/20 rounded-full flex items-center justify-center">
                            <span className="text-2xl">✨</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-textSecondary">
                              Em Breve...
                            </h4>
                            <p className="text-sm text-textSecondary/70">
                              Novidades chegando um dia quem sabe!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO: CONFIGURAÇÕES */}
                  <div>
                    <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
                      Configurações
                    </h3>

                    <div className="space-y-3">
                      {/* Perfil */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleOpenProfile}
                        className="w-full bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <User size={24} className="text-primary" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-textPrimary">
                                Perfil
                              </h4>
                              <p className="text-sm text-textSecondary">
                                Editar informações
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            size={20}
                            className="text-textSecondary"
                          />
                        </div>
                      </motion.button>

                      {/* Notificações */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleOpenNotifications}
                        className="w-full bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Bell size={24} className="text-primary" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold text-textPrimary">
                                Notificações
                              </h4>
                              <p className="text-sm text-textSecondary">
                                Gerenciar notificações
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            size={20}
                            className="text-textSecondary"
                          />
                        </div>
                      </motion.button>
                    </div>
                  </div>

                  {/* BOTÃO SAIR */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full py-4 border-2 border-red-500 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOutIcon size={20} />
                    <span>Sair</span>
                  </motion.button>
                </div>
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

      {/* Sub-sheets */}
      <ProfileSheet
        isOpen={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
      />

      <NotificationsSheet
        isOpen={showNotificationsSheet}
        onClose={() => setShowNotificationsSheet(false)}
      />
    </>
  );
}

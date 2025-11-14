'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Bell,
  Music,
  Image,
  Heart,
  Clock,
  Info,
  Smile,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

/**
 * NotificationsSheet - Tela de gerenciamento de notificações
 */
export default function NotificationsSheet({ isOpen, onClose }) {
  const { user } = useAuth();
  const {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribe,
  } = usePushNotifications();

  const { preferences, loading, updatePreference } = useNotificationPreferences(
    user?.id
  );

  const handleClose = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClose();
  };

  // Toggle push notifications
  const handlePushToggle = async (enabled) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }

    if (enabled) {
      // Tentar ativar
      if (permission === 'denied') {
        toast.error('Notificações bloqueadas', {
          description: 'Permita notificações nas configurações do navegador',
        });
        return;
      }

      // Solicitar permissão e criar subscription
      const granted = await requestPermission();
      if (granted) {
        // requestPermission já chama subscribeToPush internamente
        await updatePreference('push_enabled', true);
        toast.success('Notificações ativadas!');
      } else {
        toast.error('Permissão de notificações negada');
      }
    } else {
      // Desativar
      await unsubscribe();
      await updatePreference('push_enabled', false);
      toast.info('Notificações desativadas');
    }
  };

  // Toggle outras preferências
  const handleToggle = async (key, value) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    await updatePreference(key, value);
  };

  // Verificar se push está realmente ativo
  const isPushActive = subscription !== null && preferences.push_enabled;

  // Detectar Safari iOS
  const isIOS =
    typeof window !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari =
    typeof window !== 'undefined' &&
    /Safari/.test(navigator.userAgent) &&
    !/Chrome/.test(navigator.userAgent);
  const isPWAInstalled =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true);

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
                <h2 className="text-lg font-semibold text-textPrimary">
                  Notificações
                </h2>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Drag indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Content */}
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
              <div className="px-6 py-6 space-y-6">
                {/* SEÇÃO: GERAL */}
                <div>
                  <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
                    GERAL
                  </h3>

                  {/* Notificações Push */}
                  <div className="bg-pink-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bell size={24} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-textPrimary">
                            Notificações Push
                          </h4>
                          <p className="text-sm text-textSecondary">
                            Receber notificações no dispositivo
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <Toggle
                        enabled={isPushActive}
                        onChange={handlePushToggle}
                        disabled={!isSupported || loading}
                      />
                    </div>

                    {/* Aviso se não suportado */}
                    {!isSupported && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800 font-medium mb-1">
                          ⚠️ Notificações não disponíveis
                        </p>
                        {isIOS && isSafari && !isPWAInstalled ? (
                          <p className="text-xs text-yellow-700">
                            No Safari iOS, você precisa{' '}
                            <strong>instalar o app</strong> na tela inicial para
                            receber notificações.
                            <br />
                            Toque em{' '}
                            <strong>
                              Compartilhar → Adicionar à Tela Inicial
                            </strong>
                            .
                          </p>
                        ) : (
                          <p className="text-xs text-yellow-700">
                            Seu navegador não suporta notificações push ou você
                            está em modo de navegação privada.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Aviso se bloqueado */}
                    {isSupported && permission === 'denied' && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-800 font-medium mb-1">
                          ⚠️ Notificações bloqueadas
                        </p>
                        <p className="text-xs text-red-700">
                          Permita notificações nas configurações do navegador
                          para receber atualizações.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* SEÇÃO: ATIVIDADES DO MOZÃO */}
                <div>
                  <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
                    ATIVIDADES DO MOZÃO
                  </h3>

                  <div className="space-y-3">
                    {/* Novas Músicas */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                            <Music size={24} className="text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-textPrimary">
                              Novas Músicas
                            </h4>
                            <p className="text-sm text-textSecondary">
                              Quando seu mozão adicionar uma música nova
                            </p>
                          </div>
                        </div>

                        <Toggle
                          enabled={preferences.notify_new_music}
                          onChange={(val) =>
                            handleToggle('notify_new_music', val)
                          }
                          disabled={!isPushActive || loading}
                        />
                      </div>
                    </div>

                    {/* Novas Fotos */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <Image size={24} className="text-purple-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-textPrimary">
                              Novas Fotos
                            </h4>
                            <p className="text-sm text-textSecondary">
                              Quando seu mozão adicionar uma foto nova
                            </p>
                          </div>
                        </div>

                        <Toggle
                          enabled={preferences.notify_new_photos}
                          onChange={(val) =>
                            handleToggle('notify_new_photos', val)
                          }
                          disabled={!isPushActive || loading}
                        />
                      </div>
                    </div>

                    {/* Novas Razões */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <Heart size={24} className="text-red-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-textPrimary">
                              Novas Razões
                            </h4>
                            <p className="text-sm text-textSecondary">
                              Quando seu mozão escrever uma razão nova
                            </p>
                          </div>
                        </div>

                        <Toggle
                          enabled={preferences.notify_new_reasons}
                          onChange={(val) =>
                            handleToggle('notify_new_reasons', val)
                          }
                          disabled={!isPushActive || loading}
                        />
                      </div>
                    </div>

                    {/* Novas Reações */}
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Smile size={24} className="text-yellow-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-textPrimary">
                              Novas Reações
                            </h4>
                            <p className="text-sm text-textSecondary">
                              Quando seu mozão reagir a um conteúdo
                            </p>
                          </div>
                        </div>

                        <Toggle
                          enabled={preferences.notify_new_reactions}
                          onChange={(val) =>
                            handleToggle('notify_new_reactions', val)
                          }
                          disabled={!isPushActive || loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO: LEMBRETES */}
                <div>
                  <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
                    LEMBRETES
                  </h3>

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Clock size={24} className="text-orange-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-textPrimary">
                            Lembrete Diário
                          </h4>
                          <p className="text-sm text-textSecondary">
                            Um lembrete para interagir com seu mozão
                          </p>
                        </div>
                      </div>

                      <Toggle
                        enabled={preferences.daily_reminder_enabled}
                        onChange={(val) =>
                          handleToggle('daily_reminder_enabled', val)
                        }
                        disabled={!isPushActive || loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Informativo */}
                <div className="bg-pink-50 rounded-2xl p-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info size={18} className="text-primary" />
                    </div>
                    <p className="text-sm text-textSecondary leading-relaxed">
                      As notificações ajudam você a ficar por dentro de tudo que
                      seu mozão compartilha no app. Você pode personalizar quais
                      notificações deseja receber.
                    </p>
                  </div>
                </div>
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
  );
}

/**
 * Toggle Switch Component
 */
function Toggle({ enabled, onChange, disabled = false }) {
  const handleClick = () => {
    if (disabled) return;
    onChange(!enabled);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-gray-300'
          : enabled
          ? 'bg-primary'
          : 'bg-gray-300'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

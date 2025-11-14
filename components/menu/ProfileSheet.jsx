'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AvatarPicker from '@/components/ui/AvatarPicker';

/**
 * ProfileSheet - Tela de edição de perfil
 */
export default function ProfileSheet({ isOpen, onClose }) {
  const { user, profile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    avatar_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  // Carregar dados do perfil
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const handleClose = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClose();
  };

  const handleSave = async () => {
    if (!user) return;

    // Validar nome
    if (!formData.full_name.trim()) {
      toast.error('O nome não pode estar vazio');
      return;
    }

    setIsSaving(true);

    try {
      // Atualizar perfil no Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          bio: formData.bio.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar contexto
      await refreshProfile();

      toast.success('Perfil atualizado com sucesso!');

      // Fechar sheet após 500ms
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil', {
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (newAvatarUrl) => {
    setFormData((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
    // Atualizar contexto em tempo real
    refreshProfile();
    // Dispatch event para outras páginas atualizarem
    window.dispatchEvent(new Event('profile-updated'));
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
                  Editar Perfil
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
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <AvatarPicker
                    avatarUrl={formData.avatar_url}
                    userId={user?.id}
                    onAvatarChange={handleAvatarChange}
                  />
                  <p className="text-sm text-textSecondary mt-3">
                    Toque para alterar a foto
                  </p>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {/* Email (não editável) */}
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-textSecondary cursor-not-allowed"
                  />
                  <p className="text-xs text-textSecondary mt-1.5">
                    O email não pode ser alterado
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-textPrimary mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    placeholder="Conte um pouco sobre você..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-textSecondary mt-1.5 text-right">
                    {formData.bio.length}/500
                  </p>
                </div>

                {/* Botão Salvar */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-soft-lg hover:shadow-soft-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      <span>Salvar Alterações</span>
                    </>
                  )}
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
  );
}

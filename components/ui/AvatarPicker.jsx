'use client';

import { useState } from 'react';
import { Camera, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { compressImage } from '@/lib/utils/imageCompression';

/**
 * AvatarPicker - Componente reutilizável para foto de perfil
 * com opções de alterar/remover
 */
export default function AvatarPicker({ avatarUrl, userId, onAvatarChange }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const handleAvatarClick = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setIsMenuOpen(true);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 10MB)');
      return;
    }

    setIsUploading(true);
    setIsMenuOpen(false);

    try {
      // Comprimir imagem
      const compressed = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
      });

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, compressed, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-pictures').getPublicUrl(filePath);

      // Atualizar perfil no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Callback para atualizar UI
      if (onAvatarChange) {
        onAvatarChange(publicUrl);
      }

      toast.success('Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao enviar foto', {
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsMenuOpen(false);

    try {
      // Atualizar perfil removendo avatar
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      // Callback para atualizar UI
      if (onAvatarChange) {
        onAvatarChange(null);
      }

      toast.success('Foto removida');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Erro ao remover foto');
    }
  };

  return (
    <>
      {/* Avatar com ícone de câmera */}
      <div className="relative inline-block">
        <button
          onClick={handleAvatarClick}
          disabled={isUploading}
          className="relative group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
        >
          {/* Avatar circular */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 border-4 border-primary shadow-soft-xl">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-textSecondary">
                <User size={48} />
              </div>
            )}

            {/* Overlay de loading */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Ícone de câmera */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-soft-lg border-3 border-white"
          >
            <Camera size={20} className="text-white" />
          </motion.div>
        </button>
      </div>

      {/* Menu de opções */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-2xl shadow-soft-2xl z-50 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-textPrimary text-center mb-4">
                  Foto do Perfil
                </h3>

                <div className="space-y-2">
                  {/* Alterar foto */}
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-3 px-4 text-center font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-xl cursor-pointer transition-colors"
                    >
                      Alterar foto
                    </motion.div>
                  </label>

                  {/* Remover foto */}
                  {avatarUrl && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRemoveAvatar}
                      className="w-full py-3 px-4 text-center font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      Remover foto
                    </motion.button>
                  )}

                  {/* Cancelar */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-3 px-4 text-center font-medium text-textSecondary bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancelar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

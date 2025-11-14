'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Users,
  ChevronRight,
  X,
  Bug,
  LogOut as LogOutIcon,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AvatarPicker from '@/components/ui/AvatarPicker';
import WorkspaceSheet from '@/components/workspace/WorkspaceSheet';

interface DesktopMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DesktopMenu({ isOpen, onClose }: DesktopMenuProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [showWorkspaceSheet, setShowWorkspaceSheet] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleAvatarChange = () => {
    // O AvatarPicker já atualiza o contexto automaticamente
  };

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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 hidden lg:block"
              onClick={onClose}
            />

            {/* Desktop Menu Panel */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
              }}
              className="fixed left-[88px] top-0 bottom-0 w-[320px] bg-white shadow-2xl z-50 overflow-hidden hidden lg:flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-textPrimary">Menu</h2>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={24} className="text-textSecondary" />
                  </button>
                </div>

                {/* Avatar e Nome */}
                <div className="flex flex-col items-center py-4">
                  <div className="scale-75">
                    <AvatarPicker
                      avatarUrl={profile?.avatar_url}
                      userId={user?.id}
                      onAvatarChange={handleAvatarChange}
                    />
                  </div>
                  <h2 className="text-xl font-bold text-textPrimary mt-2">
                    {profile?.full_name || 'Usuário'}
                  </h2>
                  <p className="text-sm text-textSecondary">{profile?.email || user?.email}</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {/* SEÇÃO: RECURSOS */}
                <div>
                  <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
                    Recursos
                  </h3>

                  <div className="space-y-3">
                    {/* Burocracias a Dois */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        router.push('/burocracias');
                        onClose();
                      }}
                      className="w-full bg-gradient-to-r from-primary/10 to-lavender/10 rounded-xl p-4 hover:from-primary/20 hover:to-lavender/20 transition-colors border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-lavender/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-semibold text-textPrimary text-sm">
                            Burocracias a Dois
                          </h4>
                          <p className="text-xs text-textSecondary">
                            Discussões documentadas
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-textSecondary flex-shrink-0" />
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* SEÇÃO: CONFIGURAÇÕES */}
                <div>
                  <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">
                    Configurações
                  </h3>

                  <div className="space-y-2">
                    {/* Espaços */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowWorkspaceSheet(true)}
                      className="w-full bg-gradient-to-r from-primary/10 to-lavender/10 rounded-xl p-3 hover:from-primary/20 hover:to-lavender/20 transition-colors border border-primary/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users size={20} className="text-primary" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-textPrimary text-sm">
                              Espaços
                            </h4>
                            <p className="text-xs text-textSecondary">
                              Gerenciar espaços
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-textSecondary" />
                      </div>
                    </motion.button>

                    {/* Perfil */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/perfil')}
                      className="w-full bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User size={20} className="text-primary" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-textPrimary text-sm">
                              Perfil
                            </h4>
                            <p className="text-xs text-textSecondary">
                              Editar informações
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-textSecondary" />
                      </div>
                    </motion.button>

                    {/* Notificações */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/notificacoes')}
                      className="w-full bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Bell size={20} className="text-primary" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-textPrimary text-sm">
                              Notificações
                            </h4>
                            <p className="text-xs text-textSecondary">
                              Gerenciar notificações
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-textSecondary" />
                      </div>
                    </motion.button>

                    {/* Debug */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/debug')}
                      className="w-full bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 hover:from-purple-100 hover:to-pink-100 transition-colors border border-purple-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                            <Bug size={20} className="text-purple-600" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-textPrimary text-sm flex items-center gap-2">
                              Debug
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                                DEV
                              </span>
                            </h4>
                            <p className="text-xs text-textSecondary">
                              Ferramentas de diagnóstico
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-textSecondary" />
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Footer - Botão Sair */}
              <div className="px-6 py-4 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full py-3 border-2 border-red-500 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOutIcon size={20} />
                  <span>Sair</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Workspace Sheet */}
      <WorkspaceSheet
        isOpen={showWorkspaceSheet}
        onClose={() => setShowWorkspaceSheet(false)}
      />
    </>
  );
}

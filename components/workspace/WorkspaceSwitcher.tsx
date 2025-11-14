'use client';

import { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Users, ChevronDown, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspaceSwitcher() {
  const { currentWorkspace, availableWorkspaces, switchWorkspace, loading } =
    useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  if (loading || !currentWorkspace) {
    return null;
  }

  const hasMultipleWorkspaces = availableWorkspaces.length > 1;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-soft-sm hover:shadow-soft-md transition-shadow w-full"
      >
        <Users size={18} className="text-primary flex-shrink-0" />
        <span className="font-medium text-textPrimary text-sm md:text-base truncate flex-1 text-left">
          {currentWorkspace.name}
        </span>
        {currentWorkspace.status === 'disabled' && (
          <Lock size={14} className="text-orange-600 flex-shrink-0" />
        )}
        <ChevronDown
          size={16}
          className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para fechar ao clicar fora */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-soft-lg overflow-hidden z-50 border border-white/20"
            >
              {hasMultipleWorkspaces && (
                <div className="p-2 space-y-1">
                  {availableWorkspaces.map((workspace) => {
                    const isActive = workspace.id === currentWorkspace?.id;
                    const isDisabled = workspace.status === 'disabled';

                    return (
                      <button
                        key={workspace.id}
                        onClick={() => {
                          if (!isActive) {
                            switchWorkspace(workspace.id);
                          }
                          setIsOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left rounded-xl transition-all ${
                          isActive
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-surfaceAlt border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${
                                  isActive ? 'text-primary' : 'text-textPrimary'
                                }`}
                              >
                                {workspace.name}
                              </span>
                              {isDisabled && (
                                <Lock size={12} className="text-orange-600" />
                              )}
                            </div>
                            <div className="text-xs text-textSecondary mt-0.5">
                              {workspace.member_count}{' '}
                              {workspace.member_count === 1 ? 'membro' : 'membros'}
                              {isDisabled && ' • Desativado'}
                            </div>
                          </div>
                          {isActive && (
                            <Check size={18} className="text-primary flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className={`p-2 ${hasMultipleWorkspaces ? 'border-t border-gray-200' : ''}`}>
                {!hasMultipleWorkspaces && (
                  <div className="px-4 py-3 text-sm text-textSecondary text-center">
                    Você tem apenas um espaço.
                    <br />
                    Crie novos ou entre em outros!
                  </div>
                )}
                <a
                  href="/espacos"
                  className="block w-full px-4 py-2 text-center text-sm text-primary font-medium hover:bg-primary/5 rounded-xl transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Gerenciar Espaços
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

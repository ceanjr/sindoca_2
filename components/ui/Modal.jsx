'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const modalRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detectar abertura do teclado e ajustar altura do modal
  // IMPORTANTE: Altura fixa para evitar mudanças ao abrir/fechar teclado
  useEffect(() => {
    if (!isOpen || !isMobile) return;

    // Capturar altura máxima inicial (sem teclado)
    const initialHeight = window.innerHeight;
    setViewportHeight(initialHeight);

    // Não ajustar altura quando teclado abre - manter fixa
    // Isso previne o modal de "pular" e o scroll de travar

    return () => {
      setViewportHeight(0);
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevenir scroll da página de fundo
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          />

          {/* Modal - Bottom Sheet on Mobile, Centered on Desktop */}
          <div className={`fixed z-[60] ${isMobile ? 'inset-x-0 bottom-0' : 'inset-0 flex items-center justify-center p-4'}`}>
            <motion.div
              ref={modalRef}
              initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
              animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              drag={isMobile ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              dragMomentum={false}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (isMobile && (offset.y > 150 || velocity.y > 800)) {
                  onClose();
                }
              }}
              style={isMobile && viewportHeight ? {
                height: `${viewportHeight * 0.85}px`, // 85% da altura da tela (fixo)
                maxHeight: `${viewportHeight * 0.85}px`,
              } : undefined}
              className={`bg-surface shadow-soft-lg w-full flex flex-col ${
                isMobile
                  ? 'rounded-t-3xl'
                  : `rounded-3xl ${sizeClasses[size]} max-h-[90vh]`
              }`}
            >
              {/* Drag Handle - Mobile Only */}
              {isMobile && (
                <div
                  className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'none' }} // Drag handle pode arrastar
                >
                  <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                </div>
              )}

              {/* Header */}
              <div
                className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0"
                style={{ touchAction: 'none' }} // Header pode arrastar
              >
                <h3 className="text-2xl font-bold text-textPrimary">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={24} className="text-textSecondary" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div
                className={`p-6 overflow-y-auto flex-1 ${isMobile ? 'pb-24' : ''}`}
                style={{
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y', // Permite scroll vertical
                }}
                onTouchStart={(e) => {
                  // Permitir scroll no conteúdo sem interferir no drag do modal
                  e.stopPropagation();
                }}
              >
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

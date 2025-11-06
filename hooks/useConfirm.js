/**
 * Hook to use ConfirmDialog easily
 */
'use client';

import { useState } from 'react';

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger',
    onConfirm: null,
  });
  const [loading, setLoading] = useState(false);

  const confirm = ({
    title = 'Confirmar ação?',
    message = 'Tem certeza que deseja continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
  }) => {
    return new Promise((resolve) => {
      setConfig({
        title,
        message,
        confirmText,
        cancelText,
        variant,
        onConfirm: () => {
          setLoading(false);
          setIsOpen(false);
          resolve(true);
        },
      });
      setIsOpen(true);
    });
  };

  const handleConfirm = async () => {
    setLoading(true);
    if (config.onConfirm) {
      await config.onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      setIsOpen(false);
      setLoading(false);
    }
  };

  return {
    isOpen,
    loading,
    config,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

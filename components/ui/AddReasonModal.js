'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Image from 'next/image';

export default function AddReasonModal({
  isOpen,
  onClose,
  onAdd,
  editingReason,
}) {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjects = [
    { id: 'junior', name: 'Júnior', image: '/images/eu.png' },
    { id: 'sindy', name: 'Sindy', image: '/images/sindy.png' },
  ];

  // Load editing data when modal opens
  useEffect(() => {
    if (isOpen && editingReason) {
      setSelectedSubject(editingReason.subject);
      setReason(editingReason.reason);
      setDescription(editingReason.description || '');
    } else if (!isOpen) {
      // Reset when modal closes
      setSelectedSubject(null);
      setReason('');
      setDescription('');
    }
  }, [isOpen, editingReason]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSubject || !reason.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAdd({
        subject: selectedSubject,
        reason: reason.trim(),
        description: description.trim() || null,
      });

      // Reset form
      setSelectedSubject(null);
      setReason('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error adding/updating reason:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedSubject(null);
      setReason('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingReason ? 'Editar Razão' : 'Adicionar Razão'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-semibold text-textPrimary mb-3">
            Quem é o Corno(a)?{' '}
            <span className="text-textTertiary font-normal text-xs">
              (Quem está escrevendo)
            </span>
          </label>
          <div className="flex gap-4 justify-center">
            {subjects.map((subject) => (
              <motion.button
                key={subject.id}
                type="button"
                onClick={() => setSelectedSubject(subject.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all ${
                  selectedSubject === subject.id
                    ? 'border-primary shadow-lg'
                    : 'border-gray-300 dark:border-gray-700 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={subject.image}
                  alt={subject.name}
                  fill
                  className="object-cover"
                />
                {selectedSubject === subject.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.3332 4L5.99984 11.3333L2.6665 8"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          {selectedSubject && (
            <p className="text-center text-sm text-textSecondary mt-2">
              {subjects.find((s) => s.id === selectedSubject)?.name}
            </p>
          )}
        </div>

        {/* Reason Input */}
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-semibold text-textPrimary mb-2"
          >
            Eu amo...
          </label>
          <input
            id="reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Um breve texto sobre o que você ama"
            className="w-full px-4 py-3 bg-background border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-textPrimary placeholder:text-textTertiary"
            required
          />
        </div>

        {/* Description Input */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-textPrimary mb-2"
          >
            Porque?{' '}
            <span className="text-textTertiary font-normal">(opcional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os motivos..."
            rows={4}
            className="w-full px-4 py-3 bg-background border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:border-primary focus:outline-none transition-colors text-textPrimary placeholder:text-textTertiary resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-800 text-textPrimary font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!selectedSubject || !reason.trim() || isSubmitting}
            className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? editingReason
                ? 'Salvando...'
                : 'Adicionando...'
              : editingReason
              ? 'Salvar'
              : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

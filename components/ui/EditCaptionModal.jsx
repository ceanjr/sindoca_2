'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Edit3 } from 'lucide-react'

export default function EditCaptionModal({ isOpen, onClose, currentCaption, onSave }) {
  const [caption, setCaption] = useState(currentCaption || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(caption)
      onClose()
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false)
    }
  }

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-surface rounded-3xl p-6 md:p-8 shadow-soft-2xl max-w-lg w-full mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Edit3 size={20} className="text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-textPrimary">Editar Legenda</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-textPrimary/5 rounded-full transition-colors"
              >
                <X size={20} className="text-textSecondary" />
              </button>
            </div>

            {/* Input */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione uma legenda para esta foto..."
              className="w-full px-4 py-3 bg-background border border-textPrimary/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-textPrimary placeholder:text-textTertiary"
              rows={4}
              maxLength={500}
            />

            {/* Character count */}
            <div className="text-right mt-2">
              <span className="text-xs text-textTertiary">
                {caption.length}/500
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-surfaceAlt text-textPrimary font-semibold rounded-xl hover:bg-textPrimary/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

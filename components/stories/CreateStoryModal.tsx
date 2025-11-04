'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image as ImageIcon, Type, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface CreateStoryModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onStoryCreated?: () => void
}

export default function CreateStoryModal({
  isOpen,
  onClose,
  workspaceId,
  onStoryCreated,
}: CreateStoryModalProps) {
  const { user, profile } = useAuth()
  const [type, setType] = useState<'image' | 'text'>('image')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')
  const [bgColor, setBgColor] = useState('#ff6b9d')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande', {
          description: 'Tamanho máximo: 5MB',
        })
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    if (type === 'image' && !imageFile) {
      toast.error('Selecione uma imagem')
      return
    }

    if (type === 'text' && !textContent.trim()) {
      toast.error('Digite um texto')
      return
    }

    setLoading(true)

    try {
      // TODO: Upload to Supabase Storage and create story in database
      // For now, just show success

      // Calculate expiration (24h from now)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      toast.success('Story publicada! 🎉', {
        description: 'Expira em 24 horas',
      })

      onStoryCreated?.()
      onClose()
      resetForm()
    } catch (error: any) {
      toast.error('Erro ao publicar story', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setImagePreview('')
    setImageFile(null)
    setTextContent('')
    setBgColor('#ff6b9d')
    setType('image')
  }

  const bgColors = [
    '#ff6b9d',
    '#ff9a9e',
    '#fad0c4',
    '#a18cd1',
    '#fbc2eb',
    '#667eea',
    '#764ba2',
    '#f093fb',
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-surface rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-textPrimary/10">
              <h2 className="text-2xl font-bold text-textPrimary">Criar Story</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-surfaceAlt flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Type Selector */}
            <div className="p-6 flex gap-4">
              <button
                onClick={() => setType('image')}
                className={`flex-1 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  type === 'image'
                    ? 'bg-primary text-white shadow-soft-md'
                    : 'bg-surfaceAlt text-textPrimary'
                }`}
              >
                <ImageIcon size={20} />
                Imagem
              </button>
              <button
                onClick={() => setType('text')}
                className={`flex-1 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  type === 'text'
                    ? 'bg-primary text-white shadow-soft-md'
                    : 'bg-surfaceAlt text-textPrimary'
                }`}
              >
                <Type size={20} />
                Texto
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {type === 'image' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative aspect-[9/16] max-h-[400px] rounded-2xl overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl font-semibold text-sm"
                      >
                        Trocar Imagem
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-[9/16] max-h-[400px] rounded-2xl border-2 border-dashed border-textPrimary/20 hover:border-primary transition-colors flex flex-col items-center justify-center gap-4"
                    >
                      <Upload size={48} className="text-textSecondary" />
                      <div>
                        <p className="text-textPrimary font-semibold">
                          Clique para selecionar
                        </p>
                        <p className="text-textSecondary text-sm">
                          Tamanho máximo: 5MB
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {/* Background Color Picker */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Cor de Fundo
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {bgColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setBgColor(color)}
                          className={`w-12 h-12 rounded-full transition-all ${
                            bgColor === color ? 'ring-4 ring-primary ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Text Preview */}
                  <div
                    className="aspect-[9/16] max-h-[400px] rounded-2xl flex items-center justify-center p-8"
                    style={{
                      background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%)`,
                    }}
                  >
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      maxLength={200}
                      className="w-full text-center text-white text-2xl font-medium bg-transparent border-none outline-none placeholder-white/50 resize-none"
                      rows={4}
                    />
                  </div>

                  <p className="text-sm text-textSecondary mt-2 text-right">
                    {textContent.length}/200
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-textPrimary/10">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <span>⏰</span>
                  Esta story expirará automaticamente em 24 horas
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-soft-md hover:shadow-soft-md-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publicando...' : 'Publicar Story'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

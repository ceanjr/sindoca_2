'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Flame, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BottomSheet from '@/components/ui/BottomSheet';
import { compressImage } from '@/lib/utils/imageCompression';

/**
 * Categorias disponíveis
 */
const categories = [
  { value: 'financeiro', label: 'Financeiro', icon: '💰' },
  { value: 'casa', label: 'Casa/Tarefas', icon: '🏠' },
  { value: 'planejamento', label: 'Planejamento', icon: '📅' },
  { value: 'dr', label: 'DR', icon: '💔' },
  { value: 'diversao', label: 'Diversão', icon: '🎮' },
  { value: 'importante', label: 'Importante', icon: '📌' },
];

/**
 * Modal/Sheet para criar ou editar discussão
 */
export default function DiscussionSheet({
  isOpen,
  onClose,
  onSubmit,
  discussion = null, // Se fornecido, é edição
  uploadImage,
}) {
  const [formData, setFormData] = useState({
    title: discussion?.title || '',
    description: discussion?.description || '',
    treta_reason: discussion?.treta_reason || '',
    category: discussion?.category || 'financeiro',
    image_url: discussion?.image_url || null,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(discussion?.image_url || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isEditing = !!discussion;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Comprimir imagem
      const compressed = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
      });

      setImageFile(compressed);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast.error('Erro ao processar imagem');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.title.trim()) {
      toast.error('Por favor, adicione um assunto');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Por favor, adicione uma dissertação');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = formData.image_url;

      // Upload da imagem se houver uma nova
      if (imageFile && uploadImage) {
        const { url, error } = await uploadImage(imageFile);
        if (error) {
          toast.error('Erro ao fazer upload da imagem');
          setLoading(false);
          return;
        }
        imageUrl = url;
      }

      // Submeter dados
      await onSubmit({
        ...formData,
        image_url: imageUrl,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        treta_reason: '',
        category: 'financeiro',
        image_url: null,
      });
      setImageFile(null);
      setImagePreview(null);

      toast.success(isEditing ? 'Discussão atualizada!' : 'Discussão criada!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar discussão:', error);
      toast.error('Erro ao salvar discussão');
    } finally {
      setLoading(false);
    }
  };

  const handleVibration = (duration = 30) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Discussão' : 'Nova Discussão'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload de Imagem */}
        <div>
          <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
            📸 Adicionar imagem (opcional)
          </label>

          {imagePreview ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden group">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  handleVibration();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleVibration();
                fileInputRef.current?.click();
              }}
              className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm">Clique para adicionar</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
            📂 Categoria *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-textPrimary dark:text-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assunto */}
        <div>
          <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
            📝 Assunto *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ex: Divisão das contas do mês"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-textPrimary dark:text-gray-200 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.title.length}/100 caracteres
          </p>
        </div>

        {/* Dissertação */}
        <div>
          <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2">
            📄 Dissertação *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Explique o contexto da discussão..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-textPrimary dark:text-gray-200 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.description.length}/1000 caracteres
          </p>
        </div>

        {/* Motivo da Treta */}
        <div>
          <label className="block text-sm font-medium text-textPrimary dark:text-gray-200 mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Motivo da Treta (opcional)
          </label>
          <input
            type="text"
            value={formData.treta_reason}
            onChange={(e) => handleChange('treta_reason', e.target.value)}
            placeholder="Ex: Desequilíbrio nos gastos"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-textPrimary dark:text-gray-200 placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            maxLength={100}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <motion.button
            type="button"
            onClick={() => {
              handleVibration();
              onClose();
            }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-textPrimary dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            disabled={loading}
          >
            Cancelar
          </motion.button>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Atualizar' : 'Criar Discussão'}</span>
            )}
          </motion.button>
        </div>
      </form>
    </BottomSheet>
  );
}

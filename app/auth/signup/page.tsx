'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Key, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/auth/FormInput';
import { signUp } from '@/lib/api/auth';
import { getFriendlyAuthError, successMessages } from '@/lib/utils/friendlyMessages';

function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasInviteCode, setHasInviteCode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome é obrigatório';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Nome muito curto';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (hasInviteCode && !formData.inviteCode.trim()) {
      newErrors.inviteCode = 'Código de convite é obrigatório';
    } else if (hasInviteCode && formData.inviteCode.trim().length !== 6) {
      newErrors.inviteCode = 'Código deve ter 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('🎨 Iniciando cadastro...');

      await signUp({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        inviteCode: hasInviteCode
          ? formData.inviteCode.trim().toUpperCase()
          : undefined,
      });

      console.log('✅ Cadastro bem-sucedido!');

      // Mensagem de sucesso apropriada
      const message = hasInviteCode
        ? successMessages.signupWithInvite
        : successMessages.signupSuccess;

      toast.success(message.title, {
        description: message.description,
      });

      // Redirecionar para home com hard reload para garantir que sessão seja carregada
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error: any) {
      setLoading(false);
      const friendlyError = getFriendlyAuthError(error);
      toast.error(friendlyError.title, {
        description: friendlyError.description,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'inviteCode' ? value.toUpperCase() : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <AuthCard
      title="Bem-vindo(a)!"
      subtitle="Crie sua conta e comece sua história"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome Completo */}
        <FormInput
          label="Nome Completo"
          name="fullName"
          type="text"
          placeholder="Seu nome"
          icon={<User size={20} />}
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          disabled={loading}
        />

        {/* Email */}
        <FormInput
          label="Email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          icon={<Mail size={20} />}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          disabled={loading}
        />

        {/* Senha */}
        <FormInput
          label="Senha"
          name="password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={20} />}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={loading}
        />

        {/* Confirmar Senha */}
        <FormInput
          label="Confirmar Senha"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={20} />}
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          disabled={loading}
        />

        {/* Toggle: Tenho código de convite */}
        <div className="bg-surfaceAlt rounded-xl p-4">
          <button
            type="button"
            onClick={() => {
              setHasInviteCode(!hasInviteCode);
              if (hasInviteCode) {
                setFormData((prev) => ({ ...prev, inviteCode: '' }));
                setErrors((prev) => ({ ...prev, inviteCode: '' }));
              }
            }}
            className="w-full flex items-center justify-between gap-3 text-left"
            disabled={loading}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  hasInviteCode
                    ? 'bg-primary border-primary'
                    : 'border-gray-300'
                }`}
              >
                {hasInviteCode && <Check size={14} className="text-white" />}
              </div>
              <span className="font-medium text-textPrimary">
                Tenho um código de convite
              </span>
            </div>
            {hasInviteCode && <Sparkles size={18} className="text-primary" />}
          </button>

          <AnimatePresence>
            {hasInviteCode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4">
                  <FormInput
                    label="Código de Convite"
                    name="inviteCode"
                    type="text"
                    placeholder="ABC123"
                    icon={<Key size={20} />}
                    value={formData.inviteCode}
                    onChange={handleChange}
                    error={errors.inviteCode}
                    disabled={loading}
                    maxLength={6}
                    className="uppercase"
                  />
                  <p className="text-xs text-textSecondary mt-2">
                    Digite o código de 6 caracteres que você recebeu para entrar
                    em um espaço existente.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-soft-md hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </motion.button>
      </form>

      {/* Link para Login */}
      <div className="mt-6 text-center">
        <p className="text-sm text-textSecondary">
          Já tem uma conta?{' '}
          <Link
            href="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}

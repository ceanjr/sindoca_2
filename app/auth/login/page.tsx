'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/auth/FormInput';
import { signIn, signInWithGoogle, sendMagicLink } from '@/lib/api/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Show error message from URL params (e.g., from callback)
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      if (error === 'otp_expired') {
        toast.error('Link expirado', {
          description: 'O link de confirmação expirou. Solicite um novo email.',
        });
      } else if (error === 'access_denied') {
        toast.error('Acesso negado', {
          description: message || 'Link inválido ou expirado.',
        });
      } else {
        toast.error('Erro de autenticação', {
          description: message || 'Tente novamente.',
        });
      }
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!useMagicLink && !formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (useMagicLink) {
        // Send magic link
        await sendMagicLink(formData.email);

        toast.success('Link mágico enviado! ✨', {
          description: 'Verifique seu email para fazer login.',
        });
      } else {
        // Regular password login
        await signIn(formData.email, formData.password);

        toast.success('Bem-vindo de volta! 💕');

        // Redirect to home
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(
        useMagicLink ? 'Erro ao enviar link' : 'Erro ao fazer login',
        {
          description: error.message || 'Verifique suas credenciais',
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error('Erro ao fazer login com Google', {
        description: error.message,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <AuthCard
      title="Chega mais!"
      subtitle="Entre para acessar seus maiores segredos"
    >
      {/* Toggle entre senha e magic link */}
      <div className="flex gap-2 mb-6 p-1 bg-surfaceAlt rounded-xl">
        <button
          type="button"
          onClick={() => setUseMagicLink(false)}
          className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${
            !useMagicLink
              ? 'bg-primary text-white shadow-soft-sm'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Lock size={18} className="inline mr-2" />
          Com Senha
        </button>
        <button
          type="button"
          onClick={() => setUseMagicLink(true)}
          className={`flex-1 py-3 rounded-lg font-medium transition-all duration-300 ${
            useMagicLink
              ? 'bg-primary text-white shadow-soft-sm'
              : 'text-textSecondary hover:text-textPrimary'
          }`}
        >
          <Sparkles size={18} className="inline mr-2" />
          Link Mágico
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {!useMagicLink && (
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
        )}

        {useMagicLink && (
          <div className="bg-surfaceAlt rounded-xl p-4">
            <p className="text-sm text-textSecondary text-center">
              Enviaremos um link mágico para seu email. Clique nele para fazer
              login sem senha! ✨
            </p>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-soft-md hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? useMagicLink
              ? 'Enviando...'
              : 'Entrando...'
            : useMagicLink
            ? 'Enviar Link Mágico'
            : 'Entrar'}
        </motion.button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import AuthCard from '@/components/auth/AuthCard'
import FormInput from '@/components/auth/FormInput'
import { signIn, signInWithGoogle, sendMagicLink } from '@/lib/api/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Show error message from URL params (e.g., from callback)
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error) {
      if (error === 'otp_expired') {
        toast.error('Link expirado', {
          description: 'O link de confirmação expirou. Solicite um novo email.',
        })
      } else if (error === 'access_denied') {
        toast.error('Acesso negado', {
          description: message || 'Link inválido ou expirado.',
        })
      } else {
        toast.error('Erro de autenticação', {
          description: message || 'Tente novamente.',
        })
      }
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!useMagicLink && !formData.password) {
      newErrors.password = 'Senha é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      if (useMagicLink) {
        // Send magic link
        await sendMagicLink(formData.email)

        toast.success('Link mágico enviado! ✨', {
          description: 'Verifique seu email para fazer login.',
        })
      } else {
        // Regular password login
        await signIn(formData.email, formData.password)

        toast.success('Bem-vindo de volta! 💕')

        // Redirect to home
        router.push('/')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(useMagicLink ? 'Erro ao enviar link' : 'Erro ao fazer login', {
        description: error.message || 'Verifique suas credenciais',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      console.error('Google sign in error:', error)
      toast.error('Erro ao fazer login com Google', {
        description: error.message,
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <AuthCard title="Bem-vindo de Volta" subtitle="Entre para acessar suas memórias">
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
              Enviaremos um link mágico para seu email. Clique nele para fazer login sem senha! ✨
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

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-600">Ou continue com</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full mt-4 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-primary transition-all duration-300 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </motion.button>
      </div>


    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Key, Heart } from 'lucide-react'
import { toast } from 'sonner'
import AuthCard from '@/components/auth/AuthCard'
import FormInput from '@/components/auth/FormInput'
import { createClient } from '@/lib/supabase/client'

export default function JoinWorkspacePage() {
  const router = useRouter()
  const params = useParams()
  const inviteCode = params.code as string
  
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is already logged in, redirect to home
        router.push('/')
      }
    }
    
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!answer.trim()) {
      toast.error('Digite a palavra-chave')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Verify invite via server API
      const response = await fetch('/api/auth/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: answer.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Palavra-chave incorreta')
      }

      // Sign in with partner credentials returned from server
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.credentials.email,
        password: data.credentials.password,
      })

      if (signInError) throw signInError

      setAuthenticated(true)
      toast.success('Bem-vinda! 💕', {
        description: 'Redirecionando para home...',
      })

      // Redirect to home
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1500)
    } catch (error: any) {
      toast.error('Erro ao entrar', {
        description: error.message || 'Palavra-chave incorreta',
      })
    } finally {
      setLoading(false)
    }
  }

  if (authenticated) {
    return (
      <AuthCard title="Bem-vinda!" subtitle="Acesso liberado com sucesso">
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
            className="inline-block mb-6"
          >
            <Heart size={64} className="text-primary" fill="currentColor" />
          </motion.div>
          <p className="text-gray-600">
            Redirecionando para a home...
          </p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Convite Especial"
      subtitle="Digite a palavra-chave para entrar"
    >
      <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
        <p className="text-center text-gray-700">
          💕 Digite a palavra mágica que só você sabe 💕
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Palavra-chave"
          type="password"
          placeholder="Digite a palavra secreta..."
          icon={<Key size={20} />}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={loading}
        />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-soft-md hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-primary font-semibold hover:underline"
          >
            ← Voltar para login
          </button>
        </p>
      </div>
    </AuthCard>
  )
}

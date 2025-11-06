'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Key, Heart } from 'lucide-react';
import { toast } from 'sonner';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/auth/FormInput';
import { createClient } from '@/lib/supabase/client';

export default function JoinWorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.code as string;

  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      if (error) setError('');
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [error]);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim()) {
      setError('Digite a palavra-chave');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      // Verify invite via server API
      const response = await fetch('/api/auth/verify-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: answer.trim() }),
      });

      const data = await response.json();

      console.log('🔍 API Response:', { status: response.status, data });

      if (!response.ok) {
        console.error('❌ API Error:', data.error);
        throw new Error(data.error || 'Palavra-chave incorreta');
      }

      console.log('✅ Credentials received, attempting sign in...');

      // Sign in with partner credentials returned from server
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.credentials.email,
        password: data.credentials.password,
      });

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        throw signInError;
      }

      console.log('✅ Sign in successful!');

      setAuthenticated(true);
      toast.success('Bem-vinda! 💕', {
        description: 'Acertou! Redirecionando...',
      });

      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error('❌ Full error:', error);
      setError('Dica: você deve estar fazendo essa cara agora...');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-gray-600">Redirecionando para a home...</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Bem-vinda ao Sindoca!"
      subtitle="Acerte a resposta para entrar"
    >
      <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
        <p className="text-center text-gray-700">
          Vamos lá, para a pergunta que vale 2 mil reais!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-4">
        <FormInput
          label="Qual é a sua cara favorita?"
          type="text"
          placeholder="Se errar seu IP será bloquado..."
          icon={<Key size={20} />}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          error={error}
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
    </AuthCard>
  );
}

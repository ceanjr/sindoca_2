'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useRouter } from 'next/navigation'
import { Archive, Heart, Star, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { getUserWorkspaces } from '@/lib/api/workspace'

export default function LegacySection({ id }) {
  const router = useRouter()
  const { user } = useAuth()
  const [legacyItems, setLegacyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loveCount, setLoveCount] = useState(99)
  const [heartClicked, setHeartClicked] = useState(false)
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    if (user) {
      loadLegacyItems()
    }
  }, [user])

  const loadLegacyItems = async () => {
    try {
      const supabase = createClient()

      // Get user's workspace
      const workspacesData = await getUserWorkspaces(user.id)
      if (workspacesData.length === 0) {
        setLoading(false)
        return
      }

      const workspaceId = workspacesData[0].workspace_id

      // Load legacy items from content table
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('type', 'legacy')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedItems = data.map(item => ({
        id: item.id,
        title: item.data?.title || 'Memória',
        description: item.data?.description || '',
        color: item.data?.color || 'from-pink-500/20 to-purple-500/20',
      }))

      setLegacyItems(formattedItems)
    } catch (error) {
      console.error('Error loading legacy items:', error)
    } finally {
      setLoading(false)
    }
  }

  // Heart click handler
  const handleHeartClick = () => {
    setLoveCount((prev) => prev + 1)
    setHeartClicked(true)

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }

    // Create floating hearts
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const heart = document.createElement('div')
        heart.textContent = '❤️'
        heart.style.cssText = `
          position: fixed;
          left: ${window.innerWidth / 2 + (Math.random() - 0.5) * 200}px;
          bottom: -50px;
          font-size: ${1.5 + Math.random()}em;
          pointer-events: none;
          z-index: 1000;
          transition: all 3s ease-out;
        `
        document.body.appendChild(heart)

        setTimeout(() => {
          heart.style.bottom = '120vh'
          heart.style.opacity = '0'
          heart.style.transform = `rotate(${Math.random() * 360}deg)`
        }, 100)

        setTimeout(() => heart.remove(), 3100)
      }, i * 100)
    }

    setTimeout(() => setHeartClicked(false), 600)
  }

  return (
    <section id={id} className="min-h-screen px-4 py-20" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Archive className="text-primary" size={32} />
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-primary">
              Legado
            </h2>
            <Archive className="text-accent" size={32} />
          </div>
          <p className="text-lg md:text-xl opacity-80">
            Nossas Memórias Guardadas • Onde Tudo Começou
          </p>
        </motion.div>

        {/* Interactive Heart Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass rounded-3xl p-12 mb-12 text-center shadow-glow"
        >
          <h3 className="font-serif text-3xl font-bold mb-6 text-primary">
            Clique no Coração! ❤️
          </h3>

          <motion.button
            onClick={handleHeartClick}
            animate={heartClicked ? {
              scale: [1, 1.4, 1.1, 1.35, 1.05, 1],
            } : {}}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="text-8xl md:text-9xl cursor-pointer hover:drop-shadow-2xl transition-all duration-300 min-h-[120px] min-w-[120px] inline-flex items-center justify-center"
            aria-label="Click heart"
          >
            ❤️
          </motion.button>

          <p className="font-serif text-2xl md:text-3xl mt-6">
            Você foi amada <span className="text-primary font-bold">{loveCount}</span> vezes hoje!
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
            />
            <p className="text-textSecondary mt-4">Carregando memórias...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && legacyItems.length === 0 && (
          <div className="text-center py-20">
            <Archive className="mx-auto text-textTertiary mb-6" size={64} />
            <h3 className="text-2xl font-bold text-textPrimary mb-4">
              Nenhuma memória arquivada ainda
            </h3>
            <p className="text-textSecondary mb-8 max-w-md mx-auto">
              Guarde aqui as memórias especiais que você quer preservar para sempre
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/home')}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-soft-md inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Adicionar Primeira Memória
            </motion.button>
          </div>
        )}

        {/* Nostalgic Content Grid */}
        {!loading && legacyItems.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Original Messages */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="glass rounded-3xl p-8 shadow-glow"
            >
              <h3 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                <Star className="text-accent" />
                Memórias Especiais
              </h3>

              <div className="space-y-6">
                {legacyItems.slice(0, 3).map((item, index) => (
                  <div key={item.id} className="glass-strong rounded-2xl p-6">
                    <p className="font-serif text-lg leading-relaxed italic">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>

          {/* Starry Sky Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="glass rounded-3xl p-8 shadow-glow"
          >
            <h3 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2">
              <span className="text-2xl">🌌</span>
              Nosso Céu Estrelado
            </h3>

            <p className="mb-6 leading-relaxed opacity-90">
              Cada estrela no nosso céu representa um momento especial que vivemos juntos. Um universo de memórias brilhando eternamente.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '⭐', label: 'Estrelas', value: '∞' },
                { icon: '🌙', label: 'Luas', value: '∞' },
                { icon: '💫', label: 'Constelações', value: '∞' },
                { icon: '✨', label: 'Momentos', value: '∞' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass-strong rounded-xl p-4 text-center"
                >
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-2xl font-bold text-primary mb-1">
                    {item.value}
                  </div>
                  <div className="text-sm opacity-70">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
            </div>

            {/* Timeline Memories */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="glass rounded-3xl p-8 md:p-12"
            >
              <h3 className="font-serif text-3xl font-bold text-center text-primary mb-8">
                Álbum de Memórias 📖
              </h3>

              <div className="space-y-6">
                {legacyItems.map((memory, index) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 1 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 10 }}
                    className={`glass-strong rounded-2xl p-6 bg-gradient-to-r ${memory.color} border-l-4 border-primary cursor-pointer`}
                  >
                    <h4 className="text-xl font-bold mb-2">{memory.title}</h4>
                    <p className="opacity-80">{memory.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Closing Message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="mt-12 glass rounded-3xl p-12 text-center relative overflow-hidden"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-br bg-primary/5 blur-3xl"
              />

              <div className="relative z-10">
                <div className="text-6xl mb-6">💝</div>
                <p className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
                  Essas memórias são apenas o começo
                </p>
                <p className="text-xl opacity-90">
                  Nossa história continua sendo escrita, um momento especial por vez
                </p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  )
}

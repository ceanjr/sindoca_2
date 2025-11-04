'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Gift, Sparkles, Lock } from 'lucide-react'

export default function SandboxSection({ id }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [shakeCount, setShakeCount] = useState(0)
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  // Device shake detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    let lastX = 0
    let lastY = 0
    let lastZ = 0
    const threshold = 15

    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity || {}

      if (x === null || y === null || z === null) return

      const deltaX = Math.abs(x - lastX)
      const deltaY = Math.abs(y - lastY)
      const deltaZ = Math.abs(z - lastZ)

      if (deltaX + deltaY + deltaZ > threshold) {
        setShakeCount((prev) => prev + 1)
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }
      }

      lastX = x
      lastY = y
      lastZ = z
    }

    window.addEventListener('devicemotion', handleMotion)

    return () => {
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [])

  // Mouse/touch interaction for 3D effect
  const handleInteraction = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2
    const y = e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2

    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const rotateX = ((y - centerY) / rect.height) * -20
    const rotateY = ((x - centerX) / rect.width) * 20

    setRotation({ x: rotateX, y: rotateY })
  }

  const resetRotation = () => {
    setRotation({ x: 0, y: 0 })
  }

  return (
    <section id={id} className="min-h-screen px-4 py-20 flex items-center" ref={ref}>
      <div className="max-w-4xl mx-auto w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Gift className="text-primary animate-pulse" size={32} />
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-primary">
              Caixa de Surpresas
            </h2>
            <Gift className="text-accent animate-pulse" size={32} />
          </div>
          <p className="text-lg md:text-xl opacity-80">
            Algo especial está sendo preparado...
          </p>
        </motion.div>

        {/* Interactive Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="perspective-1000"
        >
          <motion.div
            onMouseMove={handleInteraction}
            onMouseLeave={resetRotation}
            onTouchMove={handleInteraction}
            onTouchEnd={resetRotation}
            animate={{
              rotateX: rotation.x,
              rotateY: rotation.y,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              transformStyle: 'preserve-3d',
            }}
            className="glass rounded-3xl p-12 md:p-16 shadow-glow-strong relative overflow-hidden cursor-pointer"
          >
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -100, 0],
                    x: [0, (i % 2 === 0 ? 20 : -20), 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="absolute text-2xl"
                  style={{
                    left: `${Math.random() * 100}%`,
                    bottom: 0,
                  }}
                >
                  {['✨', '💫', '⭐', '🌟'][i % 4]}
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="text-center relative z-10">
              {/* Gift Box Icon */}
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="mb-8"
              >
                <div className="inline-block relative">
                  <div className="text-8xl md:text-9xl">🎁</div>

                  {/* Lock Icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-4 -right-4 bg-primary rounded-full p-3"
                  >
                    <Lock size={24} />
                  </motion.div>
                </div>
              </motion.div>

              {/* Text */}
              <h3 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-6">
                Algo Especial Está Vindo...
              </h3>

              <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
                Uma surpresa especial está sendo preparada com muito carinho. Em breve, algo mágico acontecerá aqui! ✨
              </p>

              {/* Hints */}
              <div className="glass-strong rounded-2xl p-6 mb-6">
                <p className="text-sm opacity-70 mb-4">💡 Dicas:</p>
                <div className="space-y-2 text-left">
                  <p className="text-sm">🎯 Volte aqui em breve para descobrir</p>
                  <p className="text-sm">📱 Tente sacudir seu celular</p>
                  <p className="text-sm">🖱️ Mova o mouse sobre a caixa</p>
                </div>
              </div>

              {/* Shake Counter Easter Egg */}
              {shakeCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-strong rounded-2xl p-4"
                >
                  <p className="text-sm">
                    🎉 Você sacudiu {shakeCount} {shakeCount === 1 ? 'vez' : 'vezes'}!
                    {shakeCount >= 10 && ' Você é persistente! 💪'}
                    {shakeCount >= 20 && ' Continue assim! 🌟'}
                    {shakeCount >= 50 && ' WOW! Isso é dedicação! 🏆'}
                  </p>
                </motion.div>
              )}

              {/* Sparkles */}
              <div className="flex justify-center gap-6 mt-8 text-3xl">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                  >
                    <Sparkles className="text-accent" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Glow Effect */}
            <motion.div
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-br bg-primary/20 blur-3xl -z-10"
            />
          </motion.div>
        </motion.div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="font-script text-2xl text-primary">
            A antecipação faz parte da magia... 💫
          </p>
        </motion.div>
      </div>
    </section>
  )
}

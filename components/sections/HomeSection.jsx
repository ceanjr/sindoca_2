'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowDown } from 'lucide-react';
import DaysCounter from '../DaysCounter';

export default function HomeSection({ id }) {

  return (
    <section
      id={id}
      className="min-h-screen flex items-center justify-center px-4 py-20 relative"
    >
      <div className="max-w-5xl mx-auto w-full">
        {/* Hero Title - Minimalista */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-20 relative"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-6"
          >
            <Sparkles className="text-primary" size={40} />
          </motion.div>

          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-textPrimary leading-tight">
            Para a Pessoa Mais
            <br />
            <span className="text-primary">Incrível</span> do Mundo
          </h1>

          <p className="text-lg md:text-xl text-textSecondary font-body max-w-2xl mx-auto">
            Um cantinho especial feito com muito amor e carinho
          </p>
        </motion.div>

        {/* Counter with Quote */}
        <DaysCounter showQuote={true} />
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="text-textTertiary" size={24} />
        </motion.div>
      </motion.div>
    </section>
  );
}

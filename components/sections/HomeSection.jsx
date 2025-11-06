'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, ArrowDown } from 'lucide-react';
import Button from '../ui/Button';

const quotes = [
  'Como o sol que ilumina a manhã, você traz luz para todos os meus dias.',
  'Seu sorriso tem o poder de transformar o comum em extraordinário.',
  'Você é meu caminho. Meu vinho. Meu vício. Desde o inicio.',
  'Cada momento ao seu lado é uma memória preciosa sendo criada.',
  'Não me importo que ela não me olhe, pois eu sei muito bem quem ela é.',
];

export default function HomeSection({ id }) {
  const [timeData, setTimeData] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [quote, setQuote] = useState(quotes[0]);

  // Calculate time difference
  useEffect(() => {
    const startDate = new Date('2025-03-20T00:00:00');

    const updateCounter = () => {
      const now = new Date();
      const diff = now - startDate;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeData({ days, hours, minutes, seconds });
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Random quote on mount
  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

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

        {/* Counter - Minimalista */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-surface rounded-3xl p-8 md:p-12 mb-12 shadow-soft-lg"
        >
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-center mb-10 text-textPrimary">
            Juntos há...
          </h2>

          <div className="grid grid-cols-3 gap-6 md:gap-12 max-w-2xl mx-auto">
            {[
              { label: 'Dias', value: timeData.days, color: 'text-primary' },
              { label: 'Horas', value: timeData.hours, color: 'text-accent' },
              {
                label: 'Minutos',
                value: timeData.minutes,
                color: 'text-secondary',
              },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-center"
              >
                <div
                  className={`text-5xl md:text-6xl lg:text-7xl font-heading font-bold ${item.color} mb-3`}
                >
                  {item.value}
                </div>
                <div className="text-xs md:text-sm uppercase tracking-widest text-textSecondary font-semibold">
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-10 font-handwriting text-2xl md:text-3xl text-textSecondary"
          >
            E cada segundo vale ouro! {timeData.seconds}...
          </motion.p>
        </motion.div>

        {/* Quote - Minimalista */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-surface rounded-3xl p-8 md:p-10 text-center shadow-soft-md border-l-4 border-primary"
        >
          <Heart className="inline-block text-primary mb-4" size={28} />
          <p className="font-body text-lg md:text-2xl leading-relaxed text-textPrimary">
            &quot;{quote}&quot;
          </p>
        </motion.div>
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

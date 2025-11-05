'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import {
  RELATIONSHIP_START_DATE,
  ROMANTIC_QUOTES,
  COUNTER_COLORS,
} from '@/config/relationship';

export default function DaysCounter({
  startDate = RELATIONSHIP_START_DATE,
  showQuote = true,
}) {
  const [timeData, setTimeData] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [quote, setQuote] = useState(ROMANTIC_QUOTES[0]);

  // Calculate time difference
  useEffect(() => {
    const start = new Date(startDate);

    const updateCounter = () => {
      const now = new Date();
      const diff = now - start;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeData({ days, hours, minutes, seconds });
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  // Random quote on mount
  useEffect(() => {
    setQuote(
      ROMANTIC_QUOTES[Math.floor(Math.random() * ROMANTIC_QUOTES.length)]
    );
  }, []);

  return (
    <div className="w-full">
      {/* Counter */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl pt-8 md:pt-12 px-8 md:px-12 mb-8 shadow-soft-lg"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-4"
          >
            <Heart size={40} className="text-primary" fill="currentColor" />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-bold text-textPrimary">
            Juntos há...
          </h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
          {[
            { label: 'Dias', value: timeData.days, color: COUNTER_COLORS.days },
            {
              label: 'Horas',
              value: timeData.hours,
              color: COUNTER_COLORS.hours,
            },
            {
              label: 'Minutos',
              value: timeData.minutes,
              color: COUNTER_COLORS.minutes,
            },
            // { label: 'Segundos', value: timeData.seconds, color: COUNTER_COLORS.seconds },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div
                className={`text-4xl md:text-5xl lg:text-6xl font-bold ${item.color} mb-2`}
              >
                {item.value}
              </div>
              <div className="text-xs md:text-sm uppercase tracking-widest text-textSecondary font-semibold">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex text-center pt-8 pb-2 md:pt-12 font-['Patrick_Hand'] italic text-lg md:text-xl justify-center gap-1">
          <p className="">E cada segundo vale ouro... </p>
          <span className={`${COUNTER_COLORS.seconds} font-bold`}>
            {timeData.seconds}
          </span>
        </div>
      </motion.div>

      {/* Quote */}
      {showQuote && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-3xl p-8 md:p-10 text-center shadow-soft-md border-l-4 border-primary"
        >
          <Sparkles className="inline-block text-primary mb-4" size={28} />
          <p className="text-lg md:text-xl leading-relaxed text-textPrimary italic">
            &quot;{quote}&quot;
          </p>
        </motion.div>
      )}
    </div>
  );
}

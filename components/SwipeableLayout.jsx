'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';

const routes = [
  '/',
  '/galeria',
  '/razoes',
  '/musica',
  '/conquistas',
  '/mensagens',
  '/surpresas',
  '/legado',
];

export default function SwipeableLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentIndex = routes.indexOf(pathname);

  const navigateNext = () => {
    if (currentIndex < routes.length - 1) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      router.push(routes[currentIndex + 1]);
    }
  };

  const navigatePrev = () => {
    if (currentIndex > 0) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      router.push(routes[currentIndex - 1]);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => navigateNext(),
    onSwipedRight: () => navigatePrev(),
    trackMouse: false, // Desabilitar para mouse, apenas touch
    preventScrollOnSwipe: false,
    delta: 50, // Minimum swipe distance
  });

  return (
    <div {...handlers} className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

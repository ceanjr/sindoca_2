import { motion } from 'framer-motion';

/**
 * Componente Card minimalista
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Conteúdo do card
 * @param {boolean} props.hoverable - Efeito hover
 * @param {boolean} props.glass - Efeito glassmorphism
 * @param {string} props.padding - Tamanho do padding: 'sm', 'md', 'lg'
 */
export default function Card({
  children,
  hoverable = false,
  glass = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'rounded-2xl transition-all duration-300';

  const paddingSizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const styles = glass
    ? 'bg-white bg-opacity-70 backdrop-blur-md border border-white border-opacity-50 shadow-soft-lg'
    : 'bg-surface shadow-soft-md';

  const hoverStyles = hoverable
    ? 'hover:shadow-soft-md hover:-translate-y-1 cursor-pointer'
    : '';

  const cardClasses = `${baseStyles} ${styles} ${hoverStyles} ${paddingSizes[padding]} ${className}`;

  if (onClick) {
    return (
      <motion.div
        whileHover={hoverable ? { y: -4 } : {}}
        className={cardClasses}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
}

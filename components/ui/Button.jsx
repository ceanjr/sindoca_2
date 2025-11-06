import { motion } from 'framer-motion';

/**
 * Componente Button minimalista e moderno
 *
 * @param {Object} props
 * @param {string} props.variant - Variante do botão: 'primary', 'secondary', 'outline', 'ghost'
 * @param {string} props.size - Tamanho: 'sm', 'md', 'lg'
 * @param {ReactNode} props.children - Conteúdo do botão
 * @param {ReactNode} props.icon - Ícone (componente Lucide)
 * @param {string} props.iconPosition - Posição do ícone: 'left', 'right'
 * @param {boolean} props.fullWidth - Largura total
 * @param {boolean} props.disabled - Desabilitado
 * @param {Function} props.onClick - Função de click
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  // Estilos base
  const baseStyles = 'font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-soft-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none';

  // Variantes de estilo
  const variants = {
    primary: 'bg-primary text-white hover:bg-opacity-90 shadow-soft-sm',
    secondary: 'bg-secondary text-textPrimary hover:bg-opacity-90 shadow-soft-sm',
    accent: 'bg-accent text-white hover:bg-opacity-90 shadow-soft-sm',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-primary hover:bg-primary hover:bg-opacity-10',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-soft-sm',
  };

  // Tamanhos
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const buttonClasses = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
    </motion.button>
  );
}

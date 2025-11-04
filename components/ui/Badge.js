/**
 * Componente Badge minimalista
 *
 * @param {Object} props
 * @param {string} props.variant - Variante: 'primary', 'secondary', 'accent', 'success', 'warning'
 * @param {ReactNode} props.children - Conteúdo
 */
export default function Badge({
  variant = 'primary',
  children,
  className = '',
}) {
  const variants = {
    primary: 'bg-primary bg-opacity-10 text-primary',
    secondary: 'bg-secondary bg-opacity-20 text-textPrimary',
    accent: 'bg-accent bg-opacity-10 text-accent',
    success: 'bg-accent bg-opacity-10 text-accent',
    warning: 'bg-secondary bg-opacity-20 text-textPrimary',
    lavender: 'bg-lavender bg-opacity-10 text-lavender',
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        text-xs font-semibold
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

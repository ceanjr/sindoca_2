/**
 * Componente Input minimalista
 *
 * @param {Object} props
 * @param {string} props.label - Label do input
 * @param {string} props.type - Tipo do input
 * @param {string} props.placeholder - Placeholder
 * @param {ReactNode} props.icon - Ícone (componente Lucide)
 * @param {string} props.error - Mensagem de erro
 */
export default function Input({
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-textSecondary mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-textTertiary">
            <Icon size={20} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`
            w-full rounded-xl border-2 border-surfaceAlt
            bg-surface px-4 py-3
            ${Icon ? 'pl-12' : ''}
            text-textPrimary placeholder-textTertiary
            transition-all duration-200
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20
            hover:border-textTertiary
            ${error ? 'border-red-400 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

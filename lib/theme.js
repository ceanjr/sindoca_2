// Design System - Tema Minimalista Moderno
// Inspirado no Material Design 3 e Apple Human Interface Guidelines

export const theme = {
  // Paleta de Cores Minimalista
  colors: {
    // Cores Principais
    primary: '#FF6B9D',        // Rosa vibrante
    secondary: '#FFD93D',      // Amarelo suave
    accent: '#6BCF7F',         // Verde menta
    lavender: '#7B68EE',       // Lavanda (alternativa)

    // Backgrounds
    background: '#FAFAFA',     // Off-white suave
    surface: '#FFFFFF',        // Branco puro
    surfaceAlt: '#F5F5F5',     // Alternativa

    // Text
    text: {
      primary: '#2D2D2D',      // Cinza escuro quase preto
      secondary: '#666666',    // Cinza médio
      tertiary: '#999999',     // Cinza claro
      disabled: '#AAAAAA',     // Desabilitado
      inverse: '#FFFFFF',      // Texto em fundos escuros
    },

    // Status
    success: '#6BCF7F',
    warning: '#FFD93D',
    error: '#FF6B6B',
    info: '#7B68EE',

    // Overlays
    overlay: 'rgba(45, 45, 45, 0.5)',
    overlayLight: 'rgba(255, 255, 255, 0.9)',

    // Dark Mode
    dark: {
      background: '#1A1A1A',
      surface: '#2D2D2D',
      surfaceAlt: '#3D3D3D',
      text: {
        primary: '#FAFAFA',
        secondary: '#CCCCCC',
        tertiary: '#999999',
      },
    },
  },

  // Espaçamento (escala consistente)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
    '5xl': '128px',
  },

  // Tipografia
  typography: {
    // Font Families
    fontFamily: {
      heading: "'Poppins', 'Inter', sans-serif",
      body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      handwriting: "'Caveat', 'Patrick Hand', cursive",
      mono: "'Fira Code', 'Consolas', monospace",
    },

    // Font Sizes (escala modular)
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
      '7xl': '4.5rem',    // 72px
    },

    // Font Weights
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },

    // Letter Spacing
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
      wider: '0.05em',
    },
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },

  // Sombras (suaves e sutis)
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04)',
    md: '0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px rgba(0, 0, 0, 0.07), 0 8px 24px rgba(0, 0, 0, 0.07)',
    xl: '0 8px 12px rgba(0, 0, 0, 0.08), 0 16px 48px rgba(0, 0, 0, 0.08)',
    '2xl': '0 12px 24px rgba(0, 0, 0, 0.1), 0 24px 64px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(255, 107, 157, 0.3)',
    glowAccent: '0 0 20px rgba(107, 207, 127, 0.3)',
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },

  // Breakpoints (mobile-first)
  breakpoints: {
    xs: '375px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Grid
  grid: {
    columns: 12,
    gutter: '24px',
    maxWidth: '1280px',
  },

  // Animações
  animations: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    slideDown: {
      from: { opacity: 0, transform: 'translateY(-20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    scaleIn: {
      from: { opacity: 0, transform: 'scale(0.9)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
    float: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
  },
};

// Utilitários para acessar o tema
export const getColor = (path) => {
  const keys = path.split('.');
  let value = theme.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getSpacing = (size) => theme.spacing[size] || size;

// Presets de estilos comuns
export const presets = {
  // Card minimalista
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    boxShadow: theme.shadows.md,
    padding: theme.spacing.lg,
    transition: theme.transitions.base,
  },

  // Botão primário
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.inverse,
    borderRadius: theme.borderRadius.lg,
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    fontWeight: theme.typography.fontWeight.semibold,
    transition: theme.transitions.base,
    boxShadow: theme.shadows.sm,
  },

  // Input field
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    border: `1px solid ${theme.colors.text.tertiary}`,
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    fontSize: theme.typography.fontSize.base,
    transition: theme.transitions.base,
  },

  // Glassmorphism
  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: theme.shadows.lg,
  },
};

export default theme;

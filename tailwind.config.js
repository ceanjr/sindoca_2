/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Paleta de cores minimalista moderna
      colors: {
        primary: '#FF6B9D',
        secondary: '#FFD93D',
        accent: '#6BCF7F',
        lavender: '#7B68EE',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        surfaceAlt: '#F5F5F5',
        textPrimary: '#2D2D2D',
        textSecondary: '#666666',
        textTertiary: '#999999',
        textDisabled: '#AAAAAA',
        // Dark mode
        darkBg: '#1A1A1A',
        darkSurface: '#2D2D2D',
        darkSurfaceAlt: '#3D3D3D',
      },

      // Tipografia moderna
      fontFamily: {
        heading: ['Poppins', 'Inter', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        handwriting: ['Caveat', 'Patrick Hand', 'cursive'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },

      // Espaçamento consistente
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },

      // Border radius arredondados
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // Sombras suaves e sutis
      boxShadow: {
        'soft-xs': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04)',
        'soft-sm': '0 2px 4px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.06)',
        'soft-md': '0 4px 6px rgba(0, 0, 0, 0.07), 0 8px 24px rgba(0, 0, 0, 0.07)',
        'soft-lg': '0 8px 12px rgba(0, 0, 0, 0.08), 0 16px 48px rgba(0, 0, 0, 0.08)',
        'soft-xl': '0 12px 24px rgba(0, 0, 0, 0.1), 0 24px 64px rgba(0, 0, 0, 0.1)',
        'glow-primary': '0 0 20px rgba(255, 107, 157, 0.3)',
        'glow-accent': '0 0 20px rgba(107, 207, 127, 0.3)',
      },

      // Animações modernas e suaves
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },

      // Transições suaves
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // Backdrop blur para glassmorphism
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

import './globals.css'
import AppProvider from '@/components/AppProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import ConditionalLayout from '@/components/ConditionalLayout'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Para a Pessoa Mais Incrível do Mundo',
  description: 'Um cantinho especial feito com muito carinho',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nossa História',
  },
  applicationName: 'Nossa História de Amor',
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ff6b9d',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </head>
      <body className="antialiased">
        <AuthProvider>
          <AppProvider>
            {/* Toast Notifications */}
            <Toaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: 'var(--surface)',
                  color: 'var(--textPrimary)',
                  border: '1px solid rgba(255, 107, 157, 0.2)',
                },
                className: 'glass-strong',
              }}
            />

            {/* Conditional Layout - hides sidebar/footer on auth pages */}
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

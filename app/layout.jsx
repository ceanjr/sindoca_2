import './globals.css';
import AppProvider from '@/components/AppProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import ConditionalLayout from '@/components/ConditionalLayout';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Uma Sindoca para a Todos Governar',
  description: 'Pra mostrar que eu presto',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lula apoia o Amor',
  },
  favicons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    android: '/android-chrome-192x192.png',
  },
  applicationName: 'Lula apoia o Amor',
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ff6b9d',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          rel="icon"
          href="/favicon-16x16.png"
          type="image/x-icon"
          sizes="16x16"
        />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          type="image/x-icon"
          sizes="180x180"
        />
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
            <ConditionalLayout>{children}</ConditionalLayout>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

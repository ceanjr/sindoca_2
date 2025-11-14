import './globals.css';
import AppProvider from '@/components/AppProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { PageConfigProvider } from '@/contexts/PageConfigContext';
import ConditionalLayout from '@/components/ConditionalLayout';
import { Toaster } from 'sonner';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import InstallPWABanner from '@/components/InstallPWABanner';

export const metadata = {
  title: 'Uma Sindoca para a Todos Governar',
  description: 'Pra mostrar que eu presto',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sindoca',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  applicationName: 'Sindoca',
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'theme-color': '#ff6b9d',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ff6b9d',
  viewportFit: 'cover', // Essential for safe area support on iOS devices with notches
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
        {/* PWA Configuration */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Sindoca" />
        <meta name="application-name" content="Sindoca" />
        {/* Android Chrome PWA */}
        <meta name="theme-color" content="#ff6b9d" />
        <meta name="color-scheme" content="light" />
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
      <body className="antialiased" suppressHydrationWarning>
        <GlobalErrorBoundary>
          <AuthProvider>
            <PageConfigProvider>
              <AppProvider>
                {/* Toast Notifications */}
                <Toaster
                  position="top-center"
                  richColors
                  closeButton
                  toastOptions={{
                    style: {
                      background: '#FFFFFF',
                      color: '#2D2D2D',
                      border: '1px solid rgba(255, 107, 157, 0.2)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                    className: 'backdrop-blur-xl',
                  }}
                />

                {/* Conditional Layout - hides sidebar/footer on auth pages */}
                <ConditionalLayout>{children}</ConditionalLayout>

                {/* Install PWA Banner */}
                <InstallPWABanner />
              </AppProvider>
            </PageConfigProvider>
          </AuthProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}

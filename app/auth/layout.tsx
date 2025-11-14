import { Toaster } from 'sonner'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background dark:bg-darkBg">
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
      
      {children}
    </div>
  )
}

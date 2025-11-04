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
            background: 'var(--surface)',
            color: 'var(--textPrimary)',
            border: '1px solid rgba(255, 107, 157, 0.2)',
          },
        }}
      />
      
      {children}
    </div>
  )
}

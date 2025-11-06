'use client'

import MessagesSection from '@/components/sections/MessagesSection'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function MensagensPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen">
          <MessagesSection />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}

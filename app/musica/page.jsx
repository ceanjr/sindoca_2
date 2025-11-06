'use client'

import MusicSection from '@/components/sections/MusicSection'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function MusicaPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen">
          <MusicSection />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}

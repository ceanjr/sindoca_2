'use client'

import LegacySection from '@/components/sections/LegacySection'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function LegadoPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen">
          <LegacySection />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}

'use client'

import SandboxSection from '@/components/sections/SandboxSection'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function SurpresasPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen">
          <SandboxSection />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}

'use client'

import AchievementsSection from '@/components/sections/AchievementsSection'
import ErrorBoundary from '@/components/ErrorBoundary'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function ConquistasPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen">
          <AchievementsSection />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}

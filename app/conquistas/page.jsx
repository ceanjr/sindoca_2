'use client'

import AchievementsSection from '@/components/sections/AchievementsSection'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageAccessGuard from '@/components/auth/PageAccessGuard'

export default function ConquistasPage() {
  return (
    <PageAccessGuard pageId="conquistas">
      <ErrorBoundary>
        <div className="min-h-screen">
          <AchievementsSection />
        </div>
      </ErrorBoundary>
    </PageAccessGuard>
  )
}

'use client'

import LegacySection from '@/components/sections/LegacySection'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageAccessGuard from '@/components/auth/PageAccessGuard'

export default function LegadoPage() {
  return (
    <PageAccessGuard pageId="legado">
      <ErrorBoundary>
        <div className="min-h-screen">
          <LegacySection />
        </div>
      </ErrorBoundary>
    </PageAccessGuard>
  )
}

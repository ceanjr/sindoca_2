'use client'

import SandboxSection from '@/components/sections/SandboxSection'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageAccessGuard from '@/components/auth/PageAccessGuard'

export default function SurpresasPage() {
  return (
    <PageAccessGuard pageId="surpresas">
      <ErrorBoundary>
        <div className="min-h-screen">
          <SandboxSection />
        </div>
      </ErrorBoundary>
    </PageAccessGuard>
  )
}

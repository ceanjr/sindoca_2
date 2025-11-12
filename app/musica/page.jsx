'use client'

import MusicSection from '@/components/sections/MusicSection'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageAccessGuard from '@/components/auth/PageAccessGuard'

export default function MusicaPage() {
  return (
    <PageAccessGuard pageId="musica">
      <ErrorBoundary>
        <div className="min-h-screen overflow-x-hidden w-full">
          <MusicSection />
        </div>
      </ErrorBoundary>
    </PageAccessGuard>
  )
}

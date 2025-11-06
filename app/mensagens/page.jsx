'use client'

import MessagesSection from '@/components/sections/MessagesSection'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageAccessGuard from '@/components/auth/PageAccessGuard'

export default function MensagensPage() {
  return (
    <PageAccessGuard pageId="mensagens">
      <ErrorBoundary>
        <div className="min-h-screen">
          <MessagesSection />
        </div>
      </ErrorBoundary>
    </PageAccessGuard>
  )
}

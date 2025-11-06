'use client';

import LoveReasonsSection from '@/components/sections/LoveReasonsSection';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageAccessGuard from '@/components/auth/PageAccessGuard';

export default function RazoesPage() {
  return (
    <PageAccessGuard pageId="razoes">
      <ErrorBoundary>
        <div className="min-h-screen">
          <LoveReasonsSection />
        </div>
      </ErrorBoundary>
    </PageAccessGuard>
  );
}

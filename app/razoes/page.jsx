'use client';

import LoveReasonsSection from '@/components/sections/LoveReasonsSection';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function RazoesPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <div className="min-h-screen">
          <LoveReasonsSection />
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

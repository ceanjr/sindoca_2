'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageConfig } from '@/hooks/usePageConfig';
import { motion } from 'framer-motion';

/**
 * Component to protect pages based on page_config table
 * Prevents direct URL access to disabled pages for non-admin users
 */
export default function PageAccessGuard({ pageId, children }) {
  const router = useRouter();
  const { isPageActive, isAdmin, loading } = usePageConfig();

  useEffect(() => {
    // Wait for loading to complete
    if (loading) {
      return;
    }

    // Admin can access everything
    if (isAdmin) {
      return;
    }

    // Check if page is active
    const canAccess = isPageActive(pageId);

    if (!canAccess) {
      router.push('/');
    }
  }, [pageId, isAdmin, isPageActive, loading, router]);

  // Show loading state while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          suppressHydrationWarning
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Admin can see everything
  if (isAdmin) {
    return <>{children}</>;
  }

  // Non-admin can only see active pages
  if (!isPageActive(pageId)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

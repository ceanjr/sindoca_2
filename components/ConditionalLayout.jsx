'use client';

import { usePathname } from 'next/navigation';
import NavigationSidebar from './NavigationSidebar';
import BottomTabBar from './BottomTabBar';
import PWAActions from './PWAActions';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    // Render only children for auth pages
    return <>{children}</>;
  }

  // Render full layout for other pages
  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <NavigationSidebar />

      {/* Main Content with Swipe Support */}
      <main className="relative z-10 pb-20 lg:pb-0 lg:pl-[72px] overflow-x-hidden w-full">
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />

      {/* PWA Actions - Install & Notifications */}
      <PWAActions />
    </>
  );
}

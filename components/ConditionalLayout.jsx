'use client';

import { usePathname } from 'next/navigation';
import NavigationSidebar from './NavigationSidebar';
import BottomTabBar from './BottomTabBar';
import SwipeableLayout from './SwipeableLayout';
import PushNotificationSetup from './PushNotificationSetup';
import InstallPrompt from './InstallPrompt';

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
      <main className="relative z-10 pb-20 lg:pb-0 lg:pl-[72px]">
        <SwipeableLayout>{children}</SwipeableLayout>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />

      {/* Push Notification Setup Banner */}
      <PushNotificationSetup />

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </>
  );
}

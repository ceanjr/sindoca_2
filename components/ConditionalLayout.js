'use client'

import { usePathname } from 'next/navigation'
import NavigationSidebar from './NavigationSidebar'
import BottomTabBar from './BottomTabBar'
import ThemeToggle from './ThemeToggle'
import SwipeableLayout from './SwipeableLayout'

export default function ConditionalLayout({ children }) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) {
    // Render only children for auth pages
    return <>{children}</>
  }

  // Render full layout for other pages
  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <NavigationSidebar />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Main Content with Swipe Support */}
      <main className="relative z-10 pb-20 lg:pb-0">
        <SwipeableLayout>
          {children}
        </SwipeableLayout>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 px-4 pb-24 lg:pb-12">
        <div className="bg-surface rounded-3xl max-w-4xl mx-auto p-8 shadow-soft-md">
          <p className="text-lg text-textPrimary font-medium">
            Feito com muito ❤️ e carinho
          </p>
          <p className="text-sm text-textSecondary mt-2">
            {new Date().getFullYear()} • Todos os momentos são especiais
          </p>
        </div>
      </footer>
    </>
  )
}

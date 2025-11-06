'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Image,
  Heart,
  Music,
  Trophy,
  MessageCircle,
  Gift,
  Archive,
  Settings,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageConfig } from '@/hooks/usePageConfig';
import { createClient } from '@/lib/supabase/client';
import AdminModal from './AdminModal';

const navItems = [
  { id: 'inicio', path: '/', label: 'Início', icon: Home },
  { id: 'galeria', path: '/galeria', label: 'Galeria', icon: Image },
  { id: 'razoes', path: '/razoes', label: 'Razões', icon: Heart },
  { id: 'musica', path: '/musica', label: 'Música', icon: Music },
  // { id: 'conquistas', path: '/conquistas', label: 'Conquistas', icon: Trophy },
  // {
  //   id: 'mensagens',
  //   path: '/mensagens',
  //   label: 'Mensagens',
  //   icon: MessageCircle,
  // },
  // { id: 'surpresas', path: '/surpresas', label: 'Surpresas', icon: Gift },
  // { id: 'legado', path: '/legado', label: 'Legado', icon: Archive },
];

export default function NavigationSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isPageActive, isAdmin, user } = usePageConfig();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Debug: Log admin status
  useEffect(() => {
    console.log('🔍 NavigationSidebar - Admin Status:', {
      isAdmin,
      userEmail: user?.email,
    });
  }, [isAdmin, user]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleNavClick = (path, pageId) => {
    console.log('🔍 Click attempt:', {
      path,
      pageId,
      isAdmin,
      isPageActive: isPageActive(pageId),
    });

    // Admin can access all pages, even disabled ones
    if (isAdmin) {
      console.log('✅ Admin access granted, navigating to:', path);
      router.push(path);
      return;
    }

    // Check if page is active for non-admin users
    if (!isPageActive(pageId)) {
      console.log('❌ Page is disabled for non-admin');
      return; // Don't navigate if page is disabled
    }

    console.log('✅ Regular user access granted, navigating to:', path);
    router.push(path);
  };

  return (
    <>
      <motion.nav
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen w-[72px] bg-white shadow-soft-lg z-40 flex-col py-8"
      >
        <div className="flex flex-col items-center gap-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            const pageIsActive = isPageActive(item.id);
            // Admin can access all pages
            const canAccess = isAdmin || pageIsActive;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavClick(item.path, item.id)}
                whileHover={canAccess ? { scale: 1.1 } : {}}
                whileTap={canAccess ? { scale: 0.95 } : {}}
                disabled={!canAccess}
                className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                  !canAccess
                    ? 'opacity-40 cursor-not-allowed text-gray-400'
                    : isActive
                    ? 'bg-primary text-white shadow-soft-md'
                    : 'text-textSecondary hover:bg-surfaceAlt hover:text-textPrimary'
                }`}
                title={canAccess ? item.label : `${item.label} (Desativada)`}
              >
                <Icon size={24} />

                {/* Tooltip - show for admin always, for others only if active */}
                {canAccess && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                    {item.label}
                    {isAdmin && !pageIsActive && (
                      <span className="ml-2 text-yellow-300">⚠️</span>
                    )}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}

                {isActive && canAccess && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 rounded-xl border-2 border-primary/30"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center pt-4 border-t border-gray-200 gap-2">
          {/* Admin Button */}
          {isAdmin && (
            <motion.button
              onClick={() => setIsAdminModalOpen(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex items-center justify-center w-12 h-12 rounded-xl text-white hover:bg-surfaceAlt hover:text-textPrimary"
              title="Configurações Admin"
            >
              <Settings size={24} className=" text-textSecondary" />

              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                Configurações Admin
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            </motion.button>
          )}

          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 text-white hover:bg-surfaceAlt hover:text-textPrimary"
            title="Sair"
          >
            <LogOut className="text-red-600" size={24} />

            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
              Sair
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
            </div>
          </motion.button>
        </div>
      </motion.nav>

      {/* Admin Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </>
  );
}

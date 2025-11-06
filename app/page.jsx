'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import DaysCounter from '@/components/DaysCounter';
import ErrorBoundary from '@/components/ErrorBoundary';
// import ThinkingOfYouWidget from '@/components/widgets/ThinkingOfYouWidget'; // DESATIVADO
// import { getUserWorkspaces } from '@/lib/api/workspace'; // DESATIVADO

function HomeContent() {
  const router = useRouter();
  const { user, loading, profile } = useAuth();
  // const [workspaceId, setWorkspaceId] = useState(null); // DESATIVADO

  useEffect(() => {
    // Only redirect if not loading and no user
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Load workspace - DESATIVADO
  // useEffect(() => {
  //   const loadWorkspace = async () => {
  //     if (user) {
  //       try {
  //         const workspaces = await getUserWorkspaces(user.id);
  //         if (workspaces && workspaces.length > 0) {
  //           setWorkspaceId(workspaces[0].workspaces.id);
  //         }
  //       } catch (error) {
  //         // console.error('Error loading workspace:', error);
  //       }
  //     }
  //   };
  //   loadWorkspace();
  // }, [user]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // If user is authenticated, show home page
  if (user) {
    const isSindy = user.email === 'sindyguimaraes.a@gmail.com';

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-20">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-6"
            >
              <Heart
                size={64}
                className="text-primary mx-auto"
                fill="currentColor"
              />
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-textPrimary mb-6 leading-tight">
              Bem-vinda,
              <br />
              <span className="text-primary">Sindoca!</span>
            </h1>

            <p className="text-lg md:text-xl text-textSecondary max-w-2xl mx-auto">
              Gratidão!
            </p>
          </motion.div>

          {/* Days Counter */}
          <DaysCounter showQuote={true} />

          {/* Credentials Card - Only for Sindy */}
          {isSindy && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full mt-8"
            >
              <div className="bg-primary/10 rounded-3xl border border-primary/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-textPrimary">
                    Suas Credenciais
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-textSecondary mb-1">
                      Email
                    </label>
                    <div className="bg-white/50 rounded-lg px-3 py-2 font-mono text-sm text-textPrimary">
                      sindyguimaraes.a@gmail.com
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-textSecondary mb-1">
                      Senha
                    </label>
                    <div className="bg-white/50 rounded-lg px-3 py-2 font-mono text-sm text-textPrimary">
                      feitopelomozao
                    </div>
                  </div>
                </div>

                <p className="text-xs text-textSecondary mt-4 text-center">
                  💡 Guarde essas informações com carinho (para fazer login)
                </p>
              </div>
            </motion.div>
          )}

          {/* Thinking of You Widget - Floating Button (DESATIVADO) */}
          {/* {workspaceId && user && (
            <ThinkingOfYouWidget
              workspaceId={workspaceId}
              partnerId={user.id}
              compact={true}
            />
          )} */}
        </div>
      </div>
    );
  }

  return null;
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
    </ErrorBoundary>
  );
}

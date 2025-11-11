'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  email: string
  full_name: string
  nickname?: string
  avatar_url?: string
  bio?: string
  birthday?: string
  favorite_color?: string
  theme?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabaseRef = useRef(createClient()) // ✅ Instância única
  const supabase = supabaseRef.current
  const fetchingProfileRef = useRef(false) // ✅ Prevenir chamadas duplicadas

  // ✅ Fetch user profile com timeout
  const fetchProfile = async (userId: string) => {
    // Prevenir múltiplas chamadas simultâneas
    if (fetchingProfileRef.current) {
      console.log('⏳ Profile fetch already in progress, skipping...');
      return;
    }

    fetchingProfileRef.current = true;

    try {
      // ✅ Timeout de 5 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .abortSignal(controller.signal)
        .single()

      clearTimeout(timeoutId);

      if (error) {
        // ✅ Tratar erro de token expirado
        if (error.message?.includes('JWT') || error.code === 'PGRST301') {
          console.error('❌ Auth: Token expired, signing out...');
          await handleSignOut();
          return;
        }
        
        console.log('Profile not found or error:', error.message)
        setProfile(null)
        return
      }

      setProfile(data)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('❌ Profile fetch timed out');
        setProfile(null);
      } else {
        console.error('Error fetching profile:', error)
        setProfile(null)
      }
    } finally {
      fetchingProfileRef.current = false;
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // ✅ Initialize auth state (apenas uma vez)
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Auth: Initializing...');
        
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!mounted) return;

        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error: any) {
        console.error('Error initializing auth:', error)
        if (error?.code === 'refresh_token_not_found') {
          await supabase.auth.signOut()
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // ✅ Listen for auth changes com debounce
    let debounceTimer: NodeJS.Timeout | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔐 Auth state changed:', event)

      // ✅ Debounce para evitar processamento duplicado
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token refreshed successfully')
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
          
          setLoading(false)
        }
      }, 300); // 300ms debounce
    })

    return () => {
      mounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      subscription.unsubscribe()
    }
  }, []) // ✅ Sem dependências - executa apenas uma vez

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

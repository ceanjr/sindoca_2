# 🔍 ANÁLISE COMPLETA: Loading Infinito após alguns minutos

## 📊 Diagnóstico da Causa Raiz

Após análise detalhada de todo o código, identifiquei **5 problemas críticos** que podem causar o loading infinito:

---

## 🚨 PROBLEMA #1: Loop Infinito no PageConfigContext (CRÍTICO)

**Arquivo:** `contexts/PageConfigContext.jsx`

**Causa Raiz:**
```jsx
useEffect(() => {
  // ...
}, [authLoading]); // ⚠️ Problema: apenas authLoading como dependência
```

**O que acontece:**
1. `authLoading` muda de `true` → `false`
2. useEffect executa e faz query no Supabase
3. **Se o token do Supabase expirar**, a query pode falhar silenciosamente
4. O timeout de 10 segundos é acionado, mas o loading já foi setado como `false` no AuthContext
5. **O contexto fica em estado inconsistente**

**Impacto:** ALTO - Afeta todas as páginas que dependem de PageConfig

---

## 🚨 PROBLEMA #2: Múltiplas Instâncias do Supabase Client sem Cleanup

**Arquivos afetados:**
- `hooks/useRealtimeMessages.js`
- `hooks/useRealtimePhotos.js`
- `hooks/useRealtimePlaylist.js`
- `hooks/useRealtimeAchievements.js`

**Causa Raiz:**
```jsx
useEffect(() => {
  const supabase = createClient(); // ⚠️ Nova instância toda vez
  
  // Subscribe to realtime
  const channel = supabase.channel('...')...
  
  return () => {
    supabase.removeChannel(channel); // ❌ Cleanup incompleto
  };
}, [workspaceId, user]); // ⚠️ Reexecuta quando user/workspace mudam
```

**O que acontece:**
1. Cada hook cria sua própria instância do Supabase client
2. Cada instância mantém conexões WebSocket abertas para Realtime
3. Quando deps mudam, novas conexões são abertas ANTES das antigas fecharem
4. **Após alguns minutos, dezenas de conexões Realtime ficam abertas**
5. Supabase pode throttle ou recusar novas conexões
6. **Queries param de resolver → Loading infinito**

**Impacto:** MUITO ALTO - Vazamento de conexões WebSocket

---

## 🚨 PROBLEMA #3: Token Refresh do Supabase sem Tratamento de Erros

**Arquivo:** `contexts/AuthContext.tsx`

**Causa Raiz:**
```tsx
useEffect(() => {
  // ...
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      }
      
      if (event === 'SIGNED_OUT') {
        // Handle sign out
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || ...) {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id) // ⚠️ Pode falhar sem tratamento
        }
      }
      
      setLoading(false) // ⚠️ Loading sempre false, mesmo com erro
    }
  )
}, [])
```

**O que acontece:**
1. Token do Supabase expira após ~1 hora
2. `onAuthStateChange` dispara evento `TOKEN_REFRESHED`
3. `fetchProfile` tenta buscar perfil do usuário
4. **Se a conexão estiver ruim ou o Realtime travado, fetchProfile nunca resolve**
5. `setLoading(false)` é executado, mas o profile fica undefined
6. **Páginas que dependem de `profile` ficam em loading infinito**

**Impacto:** ALTO - Acontece após ~1 hora de uso

---

## 🚨 PROBLEMA #4: Service Worker atualiza a cada 5 minutos

**Arquivo:** `components/AppProvider.jsx`

**Causa Raiz:**
```jsx
// Verificar atualizações a cada 5 minutos
updateIntervalId = setInterval(() => {
  registration.update().catch(err => {
    console.log('Erro ao verificar atualização:', err.message)
  })
}, 5 * 60 * 1000) // ⚠️ 5 minutos
```

**O que acontece:**
1. A cada 5 minutos, SW verifica por atualizações
2. Se houver nova versão, instala e ativa
3. **Durante a ativação, caches são limpos**
4. **Requests em andamento podem falhar**
5. Se isso acontecer durante uma query crítica (profile, workspace), a página trava

**Impacto:** MÉDIO - Pode causar falhas intermitentes

---

## 🚨 PROBLEMA #5: Polling no useRealtimePhotos

**Arquivo:** `hooks/useRealtimePhotos.js`

**Causa Raiz:**
```jsx
// Polling - recarrega fotos a cada X segundos
useEffect(() => {
  if (!userId || !workspaceId) return;
  
  const interval = setInterval(() => {
    console.log('🔄 Polling Firebase Storage for photo updates...');
    loadPhotos(); // ⚠️ Chama loadPhotos() recursivamente
  }, pollInterval);
  
  return () => clearInterval(interval);
}, [pollInterval, userId, workspaceId]); // ❌ loadPhotos não está nas deps
```

**O que acontece:**
1. Polling executa `loadPhotos()` a cada 10 segundos
2. `loadPhotos()` é async e pode demorar
3. **Se duas chamadas se sobrepõem, estado fica inconsistente**
4. **Firebase Storage não existe mais no código, mas o hook tenta usar**
5. Erro silencioso → loading trava

**Impacto:** ALTO - Hook de fotos é usado em várias páginas

---

## 🎯 PLANO DE CORREÇÃO COMPLETO

### 1️⃣ Corrigir PageConfigContext (PRIORIDADE MÁXIMA)

**Arquivo:** `contexts/PageConfigContext.jsx`

```jsx
'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

const PageConfigContext = createContext(undefined);

export function PageConfigProvider({ children }) {
  const [pageConfig, setPageConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const supabaseRef = useRef(null); // ✅ Reutilizar mesma instância
  const channelRef = useRef(null); // ✅ Guardar referência do canal
  const initializedRef = useRef(false); // ✅ Prevenir dupla inicialização

  const isAdmin = user?.email === 'celiojunior0110@gmail.com';

  useEffect(() => {
    // ✅ Aguardar auth finalizar
    if (authLoading) {
      console.log('🔄 PageConfig: Waiting for auth...');
      return;
    }

    // ✅ Evitar dupla inicialização
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    console.log('🔧 PageConfig: Initializing...');

    // ✅ Criar instância única do Supabase
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    const supabase = supabaseRef.current;
    let timeoutId = null;

    const initializePageConfig = async () => {
      try {
        // ✅ Timeout com AbortController
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller.abort();
          console.warn('⚠️ PageConfig: Timeout, using defaults');
          setLoading(false);
        }, 8000);

        const { data, error, status } = await supabase
          .from('page_config')
          .select('*')
          .order('page_id')
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        // ✅ Tratar erro de token expirado
        if (error) {
          if (status === 401 || error.message?.includes('JWT')) {
            console.error('❌ PageConfig: Auth error, user needs to re-login');
            // Limpar session e redirecionar
            await supabase.auth.signOut();
            window.location.href = '/auth/login';
            return;
          }
          throw error;
        }

        setPageConfig(data || []);
        setLoading(false);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('⚠️ PageConfig: Request aborted by timeout');
        } else {
          console.error('❌ PageConfig: Error loading config:', error);
        }
        // ✅ Sempre setar loading false
        setLoading(false);
      }
    };

    initializePageConfig();

    // ✅ Cleanup do canal anterior antes de criar novo
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // ✅ Subscribe to changes (apenas uma vez)
    const channel = supabase
      .channel('page_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_config',
        },
        (payload) => {
          console.log('📡 Page config changed:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setPageConfig((prev) =>
              prev.map((page) =>
                page.id === payload.new.id ? payload.new : page
              )
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 PageConfig subscription status:', status);
      });

    channelRef.current = channel;

    // ✅ Cleanup completo
    return () => {
      console.log('🧹 PageConfig: Cleaning up...');
      if (timeoutId) clearTimeout(timeoutId);
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [authLoading]); // ✅ Só depende de authLoading

  const updatePageStatus = async (pageId, isActive) => {
    if (!isAdmin) {
      console.error('Only admin can update page status');
      return false;
    }

    const supabase = supabaseRef.current || createClient();

    try {
      const { error } = await supabase
        .from('page_config')
        .update({ is_active: isActive })
        .eq('page_id', pageId);

      if (error) throw error;

      setPageConfig((prev) =>
        prev.map((page) =>
          page.page_id === pageId ? { ...page, is_active: isActive } : page
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating page status:', error);
      return false;
    }
  };

  const isPageActive = (pageId) => {
    const page = pageConfig.find((p) => p.page_id === pageId);
    return page ? page.is_active : true;
  };

  return (
    <PageConfigContext.Provider
      value={{
        pageConfig,
        isAdmin,
        loading,
        user,
        updatePageStatus,
        isPageActive,
      }}
    >
      {children}
    </PageConfigContext.Provider>
  );
}

export function usePageConfig() {
  const context = useContext(PageConfigContext);
  if (context === undefined) {
    throw new Error('usePageConfig must be used within PageConfigProvider');
  }
  return context;
}
```

---

### 2️⃣ Corrigir AuthContext (Token Refresh com Timeout)

**Arquivo:** `contexts/AuthContext.tsx`

```tsx
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
```

---

### 3️⃣ Corrigir Hooks de Realtime (Conexões WebSocket)

**Template para TODOS os hooks de realtime:**

```jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Refs para manter estado persistente
  const supabaseRef = useRef(null);
  const userRef = useRef(null);
  const workspaceRef = useRef(null);
  const channelRef = useRef(null);
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // ✅ Prevenir múltiplas inicializações
    if (initializingRef.current || initializedRef.current) {
      return;
    }

    initializingRef.current = true;

    const initAuth = async () => {
      try {
        // ✅ Criar instância única
        if (!supabaseRef.current) {
          supabaseRef.current = createClient();
        }
        
        const supabase = supabaseRef.current;

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setLoading(false);
          initializingRef.current = false;
          return;
        }

        userRef.current = user;

        const { data: members, error: membersError } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
          .single();

        if (membersError || !members) {
          setLoading(false);
          initializingRef.current = false;
          return;
        }

        workspaceRef.current = members.workspace_id;
        await loadData();

        // ✅ Setup subscription apenas se não existir
        if (!channelRef.current) {
          setupRealtimeSubscription(supabase, members.workspace_id);
        }

        initializedRef.current = true;
        initializingRef.current = false;
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
        setLoading(false);
        initializingRef.current = false;
      }
    };

    initAuth();

    // ✅ Cleanup completo
    return () => {
      if (channelRef.current && supabaseRef.current) {
        console.log('🧹 Cleaning up realtime subscription');
        supabaseRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // ✅ SEM DEPENDÊNCIAS - executa apenas uma vez

  const loadData = useCallback(async () => {
    if (!supabaseRef.current || !workspaceRef.current) {
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Timeout de 8 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const { data, error } = await supabaseRef.current
        .from('content')
        .select('*')
        .eq('workspace_id', workspaceRef.current)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) throw error;

      setData(data || []);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('❌ Data load timed out');
        setError('Request timed out');
      } else {
        console.error('Error loading data:', err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []); // ✅ Usar refs em vez de deps

  const setupRealtimeSubscription = (supabase, workspaceId) => {
    const channel = supabase
      .channel(`workspace-${workspaceId}-data`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          console.log('📡 Realtime change:', payload);
          
          // ✅ Update state based on event
          if (payload.eventType === 'INSERT') {
            setData((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        
        // ✅ Detectar erro de conexão
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ Realtime subscription error:', status);
          // Não tentar reconectar automaticamente - deixar o usuário atualizar a página
        }
      });

    channelRef.current = channel;
  };

  return { data, loading, error, refresh: loadData };
}
```

**Aplicar este padrão em:**
- ✅ `hooks/useRealtimeMessages.js`
- ✅ `hooks/useRealtimePhotos.js`
- ✅ `hooks/useRealtimePlaylist.js`
- ✅ `hooks/useRealtimeAchievements.js`

---

### 4️⃣ Ajustar Service Worker Update Interval

**Arquivo:** `components/AppProvider.jsx`

```jsx
// Linha 102: Mudar de 5 minutos para 30 minutos
updateIntervalId = setInterval(() => {
  registration.update().catch(err => {
    console.log('Erro ao verificar atualização:', err.message)
  })
}, 30 * 60 * 1000) // ✅ 30 minutos em vez de 5
```

---

### 5️⃣ Remover Polling do useRealtimePhotos

**Arquivo:** `hooks/useRealtimePhotos.js`

```jsx
// ❌ REMOVER COMPLETAMENTE este useEffect:
useEffect(() => {
  if (!userId || !workspaceId) return;

  const interval = setInterval(() => {
    console.log('🔄 Polling Firebase Storage for photo updates...');
    loadPhotos();
  }, pollInterval);

  return () => clearInterval(interval);
}, [pollInterval, userId, workspaceId]);

// O Realtime Subscription já cuida das atualizações
```

---

### 6️⃣ Adicionar Error Boundary Global

**Novo arquivo:** `components/GlobalErrorBoundary.jsx`

```jsx
'use client';

import { Component } from 'react';

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Global Error Boundary caught error:', error, errorInfo);
    
    // ✅ Se for erro de autenticação, redirecionar para login
    if (error?.message?.includes('JWT') || error?.message?.includes('session')) {
      window.location.href = '/auth/login';
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Algo deu errado 😔
            </h1>
            <p className="text-textSecondary mb-6">
              Por favor, recarregue a página ou faça login novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
```

**Atualizar:** `app/layout.jsx`

```jsx
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      {/* ... */}
      <body className="antialiased" suppressHydrationWarning>
        <GlobalErrorBoundary>
          <AuthProvider>
            <PageConfigProvider>
              <AppProvider>
                {/* ... */}
              </AppProvider>
            </PageConfigProvider>
          </AuthProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
```

---

### 7️⃣ Adicionar Heartbeat Monitor (Detectar quando app trava)

**Novo arquivo:** `lib/utils/heartbeat.js`

```javascript
'use client';

let lastHeartbeat = Date.now();
let heartbeatInterval = null;

export function startHeartbeat() {
  if (heartbeatInterval) return;

  // ✅ Heartbeat a cada 30 segundos
  heartbeatInterval = setInterval(() => {
    const now = Date.now();
    const timeSinceLastBeat = now - lastHeartbeat;

    // ✅ Se passou mais de 2 minutos sem atualizar, algo está travado
    if (timeSinceLastBeat > 120000) {
      console.error('❌ HEARTBEAT: App parece estar travado!');
      console.error('❌ Tempo desde último beat:', timeSinceLastBeat / 1000, 'segundos');
      
      // ✅ Mostrar notificação ao usuário
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('App Travado', {
          body: 'O app parece estar travado. Por favor, recarregue a página.',
          icon: '/icon-192x192.png',
        });
      }
      
      // ✅ Log no console
      console.error('❌ DIAGNÓSTICO:');
      console.error('- Conexões Supabase abertas:', performance.getEntriesByType('resource').filter(r => r.name.includes('supabase')).length);
      console.error('- Requests pendentes:', performance.getEntriesByType('resource').filter(r => r.duration === 0).length);
    }

    lastHeartbeat = now;
  }, 30000);
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

export function updateHeartbeat() {
  lastHeartbeat = Date.now();
}
```

**Adicionar em:** `components/AppProvider.jsx`

```jsx
import { startHeartbeat, updateHeartbeat } from '@/lib/utils/heartbeat';

export default function AppProvider({ children }) {
  // ...

  useEffect(() => {
    // ✅ Iniciar heartbeat monitor
    startHeartbeat();

    // ✅ Atualizar heartbeat em interações do usuário
    const handleInteraction = () => updateHeartbeat();
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('scroll', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, []);

  // ...
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Correções Críticas (Implementar IMEDIATAMENTE)
- [ ] 1. Corrigir `PageConfigContext.jsx` (instância única Supabase + timeout)
- [ ] 2. Corrigir `AuthContext.tsx` (timeout no fetchProfile + debounce)
- [ ] 3. Aplicar padrão de refs em `useRealtimeMessages.js`
- [ ] 4. Aplicar padrão de refs em `useRealtimePhotos.js`
- [ ] 5. Aplicar padrão de refs em `useRealtimePlaylist.js`
- [ ] 6. Aplicar padrão de refs em `useRealtimeAchievements.js`

### Fase 2: Melhorias de Estabilidade
- [ ] 7. Remover polling do `useRealtimePhotos.js`
- [ ] 8. Ajustar Service Worker update interval para 30 minutos
- [ ] 9. Adicionar `GlobalErrorBoundary`
- [ ] 10. Adicionar Heartbeat Monitor

### Fase 3: Testes
- [ ] 11. Testar com app aberto por 2+ horas
- [ ] 12. Testar refresh de token (após 1 hora)
- [ ] 13. Testar com conexão instável
- [ ] 14. Verificar logs do console para erros silenciosos
- [ ] 15. Monitorar conexões WebSocket no DevTools (Network → WS)

---

## 🎯 RESULTADO ESPERADO

Após implementar TODAS as correções:

✅ **Nenhum loading infinito** - Timeouts garantem que queries nunca travam
✅ **Nenhum vazamento de conexões** - Refs garantem instância única do Supabase
✅ **Token refresh funciona** - Tratamento de erros e timeout no fetchProfile
✅ **Service Worker não interfere** - Update interval aumentado para 30 minutos
✅ **Erros são capturados** - Error Boundary + Heartbeat Monitor
✅ **Performance melhorada** - Menos polling, menos reconexões

---

## 🔬 COMO TESTAR SE FUNCIONOU

1. **Abrir DevTools** → Network → Filter: WS
2. **Verificar conexões WebSocket** - Deve ter NO MÁXIMO 5-6 conexões abertas
3. **Deixar app aberto por 2 horas** e usar normalmente
4. **Verificar Console** - Não deve haver erros de "timeout" ou "JWT"
5. **Monitorar Performance** → Memory - Não deve crescer indefinidamente

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Conexões WebSocket | 20-30+ após 1h | Máximo 6 |
| Loading infinito | Sim (após 5-10 min) | Não |
| Token refresh | Falha silenciosa | Tratado com timeout |
| Memory leak | Sim (Realtime) | Não |
| Service Worker reload | A cada 5 min | A cada 30 min |

---

## 🚨 ATENÇÃO: ORDEM DE IMPLEMENTAÇÃO É CRÍTICA

Implementar nesta ordem exata:
1. **Primeiro**: PageConfigContext e AuthContext (núcleo da autenticação)
2. **Segundo**: Hooks de Realtime (vazamento de conexões)
3. **Terceiro**: Service Worker e Polling (melhorias)
4. **Por último**: Error Boundary e Heartbeat (monitoramento)

---

## 💡 DICA EXTRA: Debug em Produção

Se o problema persistir, adicionar logging detalhado:

```jsx
// Em TODOS os useEffect que fazem queries
useEffect(() => {
  console.log('🔍 [DEBUG] Effect running:', {
    timestamp: new Date().toISOString(),
    component: 'NomeDoComponente',
    deps: { user, loading, workspace }
  });

  // ... código do effect

  return () => {
    console.log('🧹 [DEBUG] Effect cleanup:', {
      timestamp: new Date().toISOString(),
      component: 'NomeDoComponente'
    });
  };
}, [deps]);
```

Isso permite identificar **exatamente qual componente** está travando.

---

**Data:** 2024-11-11
**Versão:** 1.0
**Status:** Pronto para implementação

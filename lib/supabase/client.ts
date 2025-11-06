import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // NOTE: Do NOT set global Content-Type header as it breaks file uploads
      // The SDK will set the correct Content-Type for each request type
      global: {
        headers: {
          'Accept': 'application/json',
          // 'Content-Type': 'application/json', // ❌ REMOVED - breaks file uploads!
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }
  )
}

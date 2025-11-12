/**
 * Public configuration values that are safe to expose to the client
 * These are embedded at build time by Next.js
 */

export const config = {
  // VAPID public key for push notifications
  // This is safe to expose as it's only used for subscribing
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJ7_jdvbDffFpqbFYzR6v3W0oOWuQQupXDN8_hIgbzcL2wcHn78m9YGxf-mUXUtOuVVdEQ-v3JufIcRK-yMnzxw',

  // Site URL for server-to-server calls
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://sindoca.vercel.app',

  // Supabase public config
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wpgaxoqbrdyfihwzoxlc.supabase.co',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

// Validate that required config values are present
if (typeof window !== 'undefined') {
  if (!config.vapidPublicKey) {
    console.error('[Config] VAPID public key is missing!');
  }
}

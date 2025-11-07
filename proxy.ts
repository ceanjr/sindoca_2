import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // PWA files must be publicly accessible without authentication
  const pwaFiles = [
    '/manifest.json',
    '/sw.js',
    '/icon-',
    '/apple-touch-icon',
    '/favicon',
    '/.well-known/',
  ]

  // Check if request is for PWA file
  const isPWAFile = pwaFiles.some(file => request.nextUrl.pathname.startsWith(file))

  if (isPWAFile) {
    return NextResponse.next()
  }

  // For non-PWA files, apply auth middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getSession()

  const { data: { user } } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/join',
    '/api/auth/verify-invite',
    '/api/spotify/callback',
    '/clear-cache',
    '/pwa-debug'
  ]
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Onboarding is accessible to authenticated users only
  const isOnboarding = request.nextUrl.pathname === '/auth/onboarding'

  // Redirect to login if not authenticated and trying to access protected route
  if (!user && !isPublicRoute && !isOnboarding) {
    const redirectUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to onboarding if not authenticated and trying to access onboarding
  if (!user && isOnboarding) {
    const redirectUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to home if authenticated and trying to access auth pages (except callback and onboarding)
  if (user && isPublicRoute && request.nextUrl.pathname !== '/auth/callback') {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - Static assets (images, fonts, etc)
     */
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}

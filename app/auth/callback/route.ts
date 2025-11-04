import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle errors from email confirmation
  if (error) {
    console.error('Auth callback error:', error, error_description)

    // Redirect to login with error message
    return NextResponse.redirect(
      new URL(`/auth/login?error=${error}&message=${error_description || 'Authentication failed'}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(
        new URL(`/auth/login?error=exchange_failed&message=${exchangeError.message}`, requestUrl.origin)
      )
    }

    // Redirect directly to home after successful authentication
    if (data.user) {
      console.log('User authenticated, redirecting to home')
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
  }

  // Default: redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}

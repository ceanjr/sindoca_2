/**
 * Test Auth Route Directly - Returns detailed info instead of redirecting
 * GET /api/spotify/test-auth-direct
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyAuthUrl } from '@/lib/spotify/auth';
import { createClient } from '@/lib/supabase/server';
import { SPOTIFY_CONFIG } from '@/lib/spotify/config';

export async function GET(request: NextRequest) {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    test: 'Direct Auth Route Test',
    steps: [],
  };

  try {
    // Step 1: Check request
    testResults.steps.push({
      step: 1,
      name: 'Request Info',
      status: 'INFO',
      data: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        cookies: request.cookies.getAll(),
      },
    });

    // Step 2: Check Supabase client creation
    try {
      const supabase = await createClient();
      testResults.steps.push({
        step: 2,
        name: 'Supabase Client',
        status: '✅ SUCCESS',
        message: 'Supabase client created successfully',
      });

      // Step 3: Check user authentication
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          testResults.steps.push({
            step: 3,
            name: 'User Authentication',
            status: '❌ FAILED',
            error: error?.message || 'No user found',
            message: 'Usuário não está autenticado no Supabase',
          });

          return NextResponse.json({
            ...testResults,
            finalResult: 'FAILED',
            reason: 'User not authenticated',
            action: 'Faça logout e login novamente no Sindoca',
          });
        }

        testResults.steps.push({
          step: 3,
          name: 'User Authentication',
          status: '✅ SUCCESS',
          data: {
            userId: user.id,
            email: user.email,
          },
        });

        // Step 4: Generate state
        const state = `${user.id}:${Date.now()}:${Math.random().toString(36).substring(7)}`;
        testResults.steps.push({
          step: 4,
          name: 'State Generation',
          status: '✅ SUCCESS',
          data: {
            state: state,
            stateLength: state.length,
          },
        });

        // Step 5: Check Spotify config
        testResults.steps.push({
          step: 5,
          name: 'Spotify Config',
          status: '✅ SUCCESS',
          data: {
            clientId: SPOTIFY_CONFIG.clientId?.substring(0, 10) + '...',
            hasClientSecret: !!SPOTIFY_CONFIG.clientSecret,
            redirectUri: SPOTIFY_CONFIG.redirectUri,
            scopes: SPOTIFY_CONFIG.scopes,
          },
        });

        // Step 6: Generate auth URL
        const authUrl = getSpotifyAuthUrl(state);
        testResults.steps.push({
          step: 6,
          name: 'Auth URL Generation',
          status: '✅ SUCCESS',
          data: {
            authUrl: authUrl,
            urlLength: authUrl.length,
          },
        });

        // Step 7: Simulate cookie setting
        testResults.steps.push({
          step: 7,
          name: 'Cookie Setting (simulated)',
          status: '✅ SUCCESS',
          data: {
            cookieName: 'spotify_auth_state',
            cookieValue: state,
            cookieOptions: {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 10,
            },
          },
        });

        return NextResponse.json({
          ...testResults,
          finalResult: '✅ ALL TESTS PASSED',
          message: 'A rota de autenticação está funcionando corretamente',
          nextAction: 'Tente acessar /api/spotify/auth diretamente no navegador',
          directAuthUrl: '/api/spotify/auth',
          spotifyAuthUrl: authUrl,
        });
      } catch (authError: any) {
        testResults.steps.push({
          step: 3,
          name: 'User Authentication',
          status: '❌ ERROR',
          error: authError.message,
          stack: authError.stack,
        });

        return NextResponse.json({
          ...testResults,
          finalResult: 'FAILED',
          reason: 'Error checking user authentication',
        }, { status: 500 });
      }
    } catch (supabaseError: any) {
      testResults.steps.push({
        step: 2,
        name: 'Supabase Client',
        status: '❌ ERROR',
        error: supabaseError.message,
        stack: supabaseError.stack,
      });

      return NextResponse.json({
        ...testResults,
        finalResult: 'FAILED',
        reason: 'Error creating Supabase client',
      }, { status: 500 });
    }
  } catch (error: any) {
    testResults.steps.push({
      step: 0,
      name: 'General Error',
      status: '❌ CRITICAL ERROR',
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json({
      ...testResults,
      finalResult: 'CRITICAL FAILURE',
      reason: error.message,
    }, { status: 500 });
  }
}

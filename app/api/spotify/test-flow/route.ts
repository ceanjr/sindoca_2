/**
 * Spotify OAuth - Test Flow
 * GET /api/spotify/test-flow
 *
 * Esta rota testa cada etapa do fluxo OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SPOTIFY_CONFIG } from '@/lib/spotify/config';

export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hostname: request.headers.get('host'),
    tests: [] as any[],
    config: {} as any,
    recommendations: [] as string[],
  };

  // Test 1: Environment Variables
  const envTest = {
    name: 'Environment Variables',
    status: 'checking',
    details: {} as any,
  };

  try {
    envTest.details = {
      SPOTIFY_CLIENT_ID: SPOTIFY_CONFIG.clientId ? '✅ Set' : '❌ Missing',
      SPOTIFY_CLIENT_SECRET: SPOTIFY_CONFIG.clientSecret ? '✅ Set' : '❌ Missing',
      SPOTIFY_REDIRECT_URI: SPOTIFY_CONFIG.redirectUri || '❌ Missing',
      SCOPES: SPOTIFY_CONFIG.scopes.join(', '),
    };

    const missingVars = [];
    if (!SPOTIFY_CONFIG.clientId) missingVars.push('SPOTIFY_CLIENT_ID');
    if (!SPOTIFY_CONFIG.clientSecret) missingVars.push('SPOTIFY_CLIENT_SECRET');
    if (!SPOTIFY_CONFIG.redirectUri) missingVars.push('SPOTIFY_REDIRECT_URI');

    if (missingVars.length > 0) {
      envTest.status = 'failed';
      diagnostics.recommendations.push(
        `Configure as variáveis de ambiente: ${missingVars.join(', ')}`
      );
    } else {
      envTest.status = 'passed';
    }
  } catch (error) {
    envTest.status = 'error';
    envTest.details.error = error instanceof Error ? error.message : String(error);
  }

  diagnostics.tests.push(envTest);

  // Test 2: Supabase Connection
  const supabaseTest = {
    name: 'Supabase Connection',
    status: 'checking',
    details: {} as any,
  };

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      supabaseTest.status = 'failed';
      supabaseTest.details = {
        error: error.message,
        authenticated: false,
      };
      diagnostics.recommendations.push('Faça login no sistema antes de conectar ao Spotify');
    } else if (user) {
      supabaseTest.status = 'passed';
      supabaseTest.details = {
        authenticated: true,
        userId: user.id,
        email: user.email,
      };

      // Check if user has Spotify tokens
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('spotify_tokens, spotify_user_id, spotify_display_name')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        supabaseTest.details.currentConnection = {
          hasTokens: !!profile.spotify_tokens,
          spotifyUserId: profile.spotify_user_id,
          spotifyDisplayName: profile.spotify_display_name,
        };
      }
    } else {
      supabaseTest.status = 'failed';
      supabaseTest.details = {
        error: 'No user found',
        authenticated: false,
      };
    }
  } catch (error) {
    supabaseTest.status = 'error';
    supabaseTest.details.error = error instanceof Error ? error.message : String(error);
  }

  diagnostics.tests.push(supabaseTest);

  // Test 3: Redirect URI Configuration
  const redirectTest = {
    name: 'Redirect URI Configuration',
    status: 'checking',
    details: {} as any,
  };

  try {
    const currentHost = request.headers.get('host');
    const protocol = currentHost?.includes('localhost') ? 'http' : 'https';
    const expectedUri = `${protocol}://${currentHost}/api/spotify/callback`;
    const configuredUri = SPOTIFY_CONFIG.redirectUri;

    redirectTest.details = {
      currentHost,
      expectedUri,
      configuredUri,
      matches: expectedUri === configuredUri,
    };

    if (expectedUri !== configuredUri) {
      redirectTest.status = 'warning';
      diagnostics.recommendations.push(
        `A Redirect URI configurada (${configuredUri}) não corresponde ao host atual (${expectedUri}). ` +
        `Certifique-se de que ambas as URLs estão registradas no Spotify Developer Dashboard.`
      );
    } else {
      redirectTest.status = 'passed';
    }
  } catch (error) {
    redirectTest.status = 'error';
    redirectTest.details.error = error instanceof Error ? error.message : String(error);
  }

  diagnostics.tests.push(redirectTest);

  // Test 4: Spotify API Connectivity
  const spotifyApiTest = {
    name: 'Spotify API Connectivity',
    status: 'checking',
    details: {} as any,
  };

  try {
    // Test if we can reach Spotify's API
    const response = await fetch('https://api.spotify.com/v1/', {
      method: 'GET',
    });

    spotifyApiTest.details = {
      statusCode: response.status,
      reachable: response.status === 401, // 401 is expected without auth, means API is reachable
    };

    if (response.status === 401) {
      spotifyApiTest.status = 'passed';
      spotifyApiTest.details.message = 'Spotify API is reachable (401 Unauthorized is expected)';
    } else {
      spotifyApiTest.status = 'warning';
      spotifyApiTest.details.message = `Unexpected status code: ${response.status}`;
    }
  } catch (error) {
    spotifyApiTest.status = 'failed';
    spotifyApiTest.details.error = error instanceof Error ? error.message : String(error);
    diagnostics.recommendations.push('Não foi possível alcançar a API do Spotify. Verifique sua conexão com a internet.');
  }

  diagnostics.tests.push(spotifyApiTest);

  // Test 5: Database Schema
  const schemaTest = {
    name: 'Database Schema',
    status: 'checking',
    details: {} as any,
  };

  try {
    const supabase = await createClient();

    // Check if the profiles table has the required columns
    const { data, error } = await supabase
      .from('profiles')
      .select('id, spotify_tokens, spotify_user_id, spotify_display_name')
      .limit(1);

    if (error) {
      schemaTest.status = 'failed';
      schemaTest.details = {
        error: error.message,
        code: error.code,
        hint: error.hint,
      };
      diagnostics.recommendations.push(
        'As colunas do Spotify não existem na tabela profiles. Execute a migration 011_add_spotify_integration.sql'
      );
    } else {
      schemaTest.status = 'passed';
      schemaTest.details = {
        message: 'Tabela profiles tem todas as colunas necessárias',
      };
    }
  } catch (error) {
    schemaTest.status = 'error';
    schemaTest.details.error = error instanceof Error ? error.message : String(error);
  }

  diagnostics.tests.push(schemaTest);

  // Overall Status
  const allPassed = diagnostics.tests.every(test => test.status === 'passed');
  const anyFailed = diagnostics.tests.some(test => test.status === 'failed' || test.status === 'error');

  // Config Info
  diagnostics.config = {
    clientIdLength: SPOTIFY_CONFIG.clientId?.length || 0,
    clientSecretLength: SPOTIFY_CONFIG.clientSecret?.length || 0,
    redirectUri: SPOTIFY_CONFIG.redirectUri,
    scopesCount: SPOTIFY_CONFIG.scopes.length,
  };

  return NextResponse.json({
    success: allPassed && !anyFailed,
    ...diagnostics,
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

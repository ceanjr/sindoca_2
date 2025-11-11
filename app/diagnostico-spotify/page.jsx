'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function DiagnosticoSpotify() {
  const { user } = useAuth();
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testFlow, setTestFlow] = useState(null);
  const [testFlowLoading, setTestFlowLoading] = useState(false);

  useEffect(() => {
    const runDiagnostico = async () => {
      const results = {
        timestamp: new Date().toISOString(),
        environment: {
          currentUrl: window.location.href,
          hostname: window.location.hostname,
          isProduction: window.location.hostname.includes('vercel.app'),
          isLocalhost: window.location.hostname === 'localhost',
        },
        auth: {
          isAuthenticated: !!user,
          userId: user?.id,
          userEmail: user?.email,
        },
        spotify: {
          connected: false,
          hasTokens: false,
          spotifyUserId: null,
          spotifyDisplayName: null,
        },
        config: {
          expectedRedirectUri: null,
          configuredRedirectUri: null,
        },
        recommendations: [],
      };

      // Check Spotify connection
      if (user) {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('profiles')
            .select('spotify_tokens, spotify_user_id, spotify_display_name')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            results.spotify.connected = !!(data.spotify_tokens && data.spotify_user_id);
            results.spotify.hasTokens = !!data.spotify_tokens;
            results.spotify.spotifyUserId = data.spotify_user_id;
            results.spotify.spotifyDisplayName = data.spotify_display_name;
          }
        } catch (error) {
          console.error('Error checking Spotify connection:', error);
        }
      }

      // Determine expected redirect URI
      if (results.environment.isProduction) {
        results.config.expectedRedirectUri = `https://${window.location.hostname}/api/spotify/callback`;
        results.config.configuredRedirectUri = 'Verifique se está configurado para: ' + results.config.expectedRedirectUri;
      } else if (results.environment.isLocalhost) {
        results.config.expectedRedirectUri = 'http://localhost:3000/api/spotify/callback';
        results.config.configuredRedirectUri = 'Verifique se está configurado para: ' + results.config.expectedRedirectUri;
      }

      // Generate recommendations
      if (!results.auth.isAuthenticated) {
        results.recommendations.push({
          severity: 'error',
          message: 'Você precisa estar autenticado para conectar ao Spotify',
          action: 'Faça login primeiro',
        });
      }

      if (results.environment.isProduction && !results.spotify.connected) {
        results.recommendations.push({
          severity: 'warning',
          message: 'Você está em produção. Certifique-se de que:',
          action: `
            1. No Spotify Developer Dashboard, adicione a URL de redirecionamento:
               ${results.config.expectedRedirectUri}
            2. No Vercel, configure a variável de ambiente:
               SPOTIFY_REDIRECT_URI=${results.config.expectedRedirectUri}
          `,
        });
      }

      if (results.environment.isLocalhost && !results.spotify.connected) {
        results.recommendations.push({
          severity: 'info',
          message: 'Você está em localhost. Certifique-se de que:',
          action: `
            1. No Spotify Developer Dashboard, adicione a URL de redirecionamento:
               ${results.config.expectedRedirectUri}
            2. No arquivo .env.local, configure:
               SPOTIFY_REDIRECT_URI=${results.config.expectedRedirectUri}
          `,
        });
      }

      if (results.spotify.connected) {
        results.recommendations.push({
          severity: 'success',
          message: 'Spotify conectado com sucesso!',
          action: `Conectado como: ${results.spotify.spotifyDisplayName || results.spotify.spotifyUserId}`,
        });
      }

      setDiagnostico(results);
      setLoading(false);
    };

    if (user !== undefined) {
      runDiagnostico();
    }
  }, [user]);

  const runTestFlow = async () => {
    setTestFlowLoading(true);
    try {
      const response = await fetch('/api/spotify/test-flow');
      const data = await response.json();
      setTestFlow(data);
    } catch (error) {
      console.error('Error running test flow:', error);
      setTestFlow({
        success: false,
        error: error.message,
      });
    } finally {
      setTestFlowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-textSecondary">Executando diagnóstico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-backgroundSecondary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-textPrimary mb-8">
          Diagnóstico Spotify
        </h1>

        {/* Test Flow Button */}
        <div className="mb-6">
          <button
            onClick={runTestFlow}
            disabled={testFlowLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {testFlowLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Testando...
              </>
            ) : (
              <>
                🔬 Testar Fluxo OAuth Completo
              </>
            )}
          </button>
          <p className="text-sm text-textSecondary mt-2">
            Este teste verifica todas as etapas do fluxo OAuth: variáveis de ambiente, conexão com Supabase, configuração de redirect URI, e mais.
          </p>
        </div>

        {/* Test Flow Results */}
        {testFlow && (
          <div className={`bg-white rounded-xl shadow-lg p-6 mb-6 border-2 ${
            testFlow.success ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">
                {testFlow.success ? '✅' : '❌'}
              </span>
              <h2 className="text-2xl font-semibold text-textPrimary">
                {testFlow.success ? 'Todos os Testes Passaram!' : 'Alguns Testes Falharam'}
              </h2>
            </div>

            {/* Individual Tests */}
            <div className="space-y-4">
              {testFlow.tests?.map((test, index) => (
                <TestResult key={index} test={test} />
              ))}
            </div>

            {/* Recommendations */}
            {testFlow.recommendations && testFlow.recommendations.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Recomendações:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                  {testFlow.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Config Details */}
            {testFlow.config && (
              <details className="mt-4">
                <summary className="cursor-pointer text-textSecondary hover:text-textPrimary transition-colors">
                  Ver detalhes de configuração
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(testFlow.config, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Environment */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-textPrimary mb-4">
            Ambiente
          </h2>
          <div className="space-y-2">
            <InfoRow label="URL Atual" value={diagnostico?.environment.currentUrl} />
            <InfoRow label="Hostname" value={diagnostico?.environment.hostname} />
            <InfoRow
              label="Ambiente"
              value={
                diagnostico?.environment.isProduction
                  ? '🌍 Produção'
                  : diagnostico?.environment.isLocalhost
                  ? '🏠 Localhost'
                  : '❓ Desconhecido'
              }
            />
          </div>
        </div>

        {/* Authentication */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-textPrimary mb-4">
            Autenticação
          </h2>
          <div className="space-y-2">
            <InfoRow
              label="Status"
              value={
                diagnostico?.auth.isAuthenticated
                  ? '✅ Autenticado'
                  : '❌ Não autenticado'
              }
            />
            {diagnostico?.auth.isAuthenticated && (
              <>
                <InfoRow label="Email" value={diagnostico.auth.userEmail} />
                <InfoRow
                  label="User ID"
                  value={diagnostico.auth.userId}
                  mono
                />
              </>
            )}
          </div>
        </div>

        {/* Spotify */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-textPrimary mb-4">
            Spotify
          </h2>
          <div className="space-y-2">
            <InfoRow
              label="Status"
              value={
                diagnostico?.spotify.connected
                  ? '✅ Conectado'
                  : '❌ Desconectado'
              }
            />
            <InfoRow
              label="Tokens"
              value={
                diagnostico?.spotify.hasTokens
                  ? '✅ Presentes'
                  : '❌ Ausentes'
              }
            />
            {diagnostico?.spotify.spotifyUserId && (
              <>
                <InfoRow
                  label="Spotify User ID"
                  value={diagnostico.spotify.spotifyUserId}
                  mono
                />
                <InfoRow
                  label="Nome de Exibição"
                  value={diagnostico.spotify.spotifyDisplayName || 'N/A'}
                />
              </>
            )}
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-textPrimary mb-4">
            Configuração
          </h2>
          <div className="space-y-2">
            <InfoRow
              label="Redirect URI Esperada"
              value={diagnostico?.config.expectedRedirectUri}
              mono
            />
          </div>
        </div>

        {/* Recommendations */}
        {diagnostico?.recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-textPrimary mb-4">
              Recomendações
            </h2>
            <div className="space-y-4">
              {diagnostico.recommendations.map((rec, index) => (
                <Recommendation key={index} {...rec} />
              ))}
            </div>
          </div>
        )}

        {/* Debug JSON */}
        <details className="mt-6">
          <summary className="cursor-pointer text-textSecondary hover:text-textPrimary transition-colors">
            Ver dados brutos (JSON)
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(diagnostico, null, 2)}
          </pre>
        </details>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <a
            href="/musica"
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            Voltar para Música
          </a>
          {diagnostico?.auth.isAuthenticated && !diagnostico?.spotify.connected && (
            <a
              href="/api/spotify/auth"
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              Conectar Spotify
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function TestResult({ test }) {
  const statusColors = {
    passed: 'bg-green-50 border-green-200 text-green-800',
    failed: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    checking: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const statusIcons = {
    passed: '✅',
    failed: '❌',
    warning: '⚠️',
    error: '💥',
    checking: '🔍',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${statusColors[test.status]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{statusIcons[test.status]}</span>
        <div className="flex-1">
          <h4 className="font-semibold mb-2">{test.name}</h4>
          {test.details && (
            <div className="text-sm space-y-1">
              {typeof test.details === 'object' && !Array.isArray(test.details) ? (
                Object.entries(test.details).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium">{key}:</span>
                    <span className="font-mono">{
                      typeof value === 'object'
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                    }</span>
                  </div>
                ))
              ) : (
                <pre className="font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(test.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
      <span className="text-textSecondary font-medium">{label}:</span>
      <span
        className={`text-textPrimary ${
          mono ? 'font-mono text-sm' : ''
        } break-all`}
      >
        {value || 'N/A'}
      </span>
    </div>
  );
}

function Recommendation({ severity, message, action }) {
  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  const icons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅',
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colors[severity]}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[severity]}</span>
        <div className="flex-1">
          <p className="font-semibold mb-2">{message}</p>
          <pre className="text-sm whitespace-pre-wrap font-mono bg-white/50 p-2 rounded">
            {action}
          </pre>
        </div>
      </div>
    </div>
  );
}

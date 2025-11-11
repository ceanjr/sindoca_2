'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function DiagnosticoSpotify() {
  const { user } = useAuth();
  const [diagnostico, setDiagnostico] = useState(null);
  const [loading, setLoading] = useState(true);

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

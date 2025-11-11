'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { Loader, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function SpotifyDiagnosticoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [testingAuth, setTestingAuth] = useState(false);
  const [authTestResult, setAuthTestResult] = useState(null);

  useEffect(() => {
    if (user) {
      loadDebugInfo();
    }
  }, [user]);

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/spotify/debug-user');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error('Erro ao carregar diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAuthFlow = async () => {
    setTestingAuth(true);
    setAuthTestResult(null);

    try {
      console.log('🧪 TESTE 1: Verificando se /api/spotify/auth responde...');

      // Não redirecionar, apenas fazer fetch para ver se a rota responde
      const response = await fetch('/api/spotify/auth', {
        method: 'GET',
        redirect: 'manual', // Não seguir redirect automaticamente
      });

      console.log('📊 Status da resposta:', response.status);
      console.log('📊 Type:', response.type);

      if (response.type === 'opaqueredirect' || response.status === 0) {
        setAuthTestResult({
          success: true,
          message: '✅ Rota /api/spotify/auth está funcionando e tentando redirecionar!',
          details: 'A rota está respondendo corretamente. O problema pode estar no Spotify Dashboard.',
        });
      } else if (response.status === 401) {
        setAuthTestResult({
          success: false,
          message: '❌ Você não está autenticado no Sindoca',
          details: 'Faça logout e login novamente',
        });
      } else {
        const text = await response.text();
        setAuthTestResult({
          success: false,
          message: `⚠️ Resposta inesperada: ${response.status}`,
          details: text,
        });
      }
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      setAuthTestResult({
        success: false,
        message: '❌ Erro ao testar rota',
        details: error.message,
      });
    } finally {
      setTestingAuth(false);
    }
  };

  const tryActualAuth = () => {
    console.log('🚀 Redirecionando para /api/spotify/auth...');
    window.location.href = '/api/spotify/auth';
  };

  const StatusIcon = ({ status }) => {
    if (status?.includes('✅')) return <CheckCircle className="text-green-500" size={20} />;
    if (status?.includes('❌')) return <XCircle className="text-red-500" size={20} />;
    return <AlertCircle className="text-yellow-500" size={20} />;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <XCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-2xl font-bold mb-4">Não autenticado</h1>
          <p className="text-gray-600 mb-6">Você precisa estar logado para ver o diagnóstico.</p>
          <Button variant="primary" onClick={() => (window.location.href = '/login')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2">🔍 Diagnóstico Spotify</h1>
          <p className="text-gray-600">
            Use esta página para diagnosticar problemas de conexão com o Spotify
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" size="sm" onClick={loadDebugInfo} disabled={loading}>
              {loading ? <Loader className="animate-spin" size={16} /> : 'Atualizar'}
            </Button>
            <Button variant="outline" size="sm" onClick={testAuthFlow} disabled={testingAuth}>
              {testingAuth ? <Loader className="animate-spin" size={16} /> : 'Testar Rota Auth'}
            </Button>
            <Button variant="primary" size="sm" onClick={tryActualAuth}>
              Tentar Conectar Agora
            </Button>
          </div>
        </div>

        {/* Auth Test Result */}
        {authTestResult && (
          <div
            className={`rounded-2xl shadow-lg p-6 mb-6 ${
              authTestResult.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            <h3 className="font-bold text-lg mb-2">{authTestResult.message}</h3>
            <p className="text-sm text-gray-700">{authTestResult.details}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Loader className="animate-spin mx-auto mb-4 text-primary" size={48} />
            <p className="text-gray-600">Carregando diagnóstico...</p>
          </div>
        )}

        {/* Debug Info */}
        {!loading && debugInfo && (
          <>
            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold mb-4">📊 Resumo</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {debugInfo.summary?.isFullyConnected ? (
                    <CheckCircle className="text-green-500" size={24} />
                  ) : (
                    <XCircle className="text-red-500" size={24} />
                  )}
                  <div>
                    <div className="font-semibold">
                      {debugInfo.summary?.isFullyConnected
                        ? '✅ Conectado ao Spotify'
                        : '❌ Não conectado ao Spotify'}
                    </div>
                    <div className="text-sm text-gray-600">{debugInfo.summary?.mainIssue}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {debugInfo.summary?.canAddMusic ? (
                    <CheckCircle className="text-green-500" size={24} />
                  ) : (
                    <XCircle className="text-red-500" size={24} />
                  )}
                  <div>
                    <div className="font-semibold">
                      {debugInfo.summary?.canAddMusic
                        ? '✅ Pode adicionar músicas'
                        : '❌ Não pode adicionar músicas'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Authentication */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <StatusIcon status={debugInfo.step1_authentication?.status} />
                <h2 className="text-2xl font-bold">1. Autenticação Sindoca</h2>
              </div>
              <div className="ml-8 space-y-2">
                <div>
                  <strong>Status:</strong> {debugInfo.step1_authentication?.status}
                </div>
                <div>
                  <strong>Email:</strong> {debugInfo.step1_authentication?.userEmail}
                </div>
                <div>
                  <strong>User ID:</strong>{' '}
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {debugInfo.step1_authentication?.userId}
                  </code>
                </div>
              </div>
            </div>

            {/* Step 2: Profile */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <StatusIcon status={debugInfo.step2_profile?.status} />
                <h2 className="text-2xl font-bold">2. Perfil Spotify</h2>
              </div>
              <div className="ml-8 space-y-2">
                <div>
                  <strong>Status:</strong> {debugInfo.step2_profile?.status}
                </div>
                <div>
                  <strong>Tem Tokens:</strong>{' '}
                  {debugInfo.step2_profile?.hasSpotifyTokens ? '✅ Sim' : '❌ Não'}
                </div>
                <div>
                  <strong>Tem Spotify User ID:</strong>{' '}
                  {debugInfo.step2_profile?.hasSpotifyUserId ? '✅ Sim' : '❌ Não'}
                </div>
                {debugInfo.step2_profile?.spotifyUserId && (
                  <div>
                    <strong>Spotify User ID:</strong>{' '}
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {debugInfo.step2_profile.spotifyUserId}
                    </code>
                  </div>
                )}
                {debugInfo.step2_profile?.spotifyDisplayName && (
                  <div>
                    <strong>Nome no Spotify:</strong> {debugInfo.step2_profile.spotifyDisplayName}
                  </div>
                )}
                {debugInfo.step2_profile?.tokenDetails && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <div className="font-semibold mb-2">Detalhes dos Tokens:</div>
                    <div className="text-sm space-y-1">
                      <div>
                        Access Token:{' '}
                        {debugInfo.step2_profile.tokenDetails.hasAccessToken ? '✅' : '❌'}
                      </div>
                      <div>
                        Refresh Token:{' '}
                        {debugInfo.step2_profile.tokenDetails.hasRefreshToken ? '✅' : '❌'}
                      </div>
                      <div>
                        Expirado:{' '}
                        {debugInfo.step2_profile.tokenDetails.isExpired ? '❌ Sim' : '✅ Não'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Workspace */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <StatusIcon status={debugInfo.step3_workspace?.status} />
                <h2 className="text-2xl font-bold">3. Workspace</h2>
              </div>
              <div className="ml-8 space-y-2">
                <div>
                  <strong>Status:</strong> {debugInfo.step3_workspace?.status}
                </div>
                {debugInfo.step3_workspace?.workspaceName && (
                  <>
                    <div>
                      <strong>Nome:</strong> {debugInfo.step3_workspace.workspaceName}
                    </div>
                    <div>
                      <strong>Papel:</strong> {debugInfo.step3_workspace.role}
                    </div>
                    <div>
                      <strong>Tem Playlist:</strong>{' '}
                      {debugInfo.step3_workspace.hasSpotifyPlaylist ? '✅ Sim' : '❌ Não'}
                    </div>
                    {debugInfo.step3_workspace.spotifyPlaylistUrl && (
                      <div>
                        <a
                          href={debugInfo.step3_workspace.spotifyPlaylistUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
                        >
                          <ExternalLink size={16} />
                          Abrir Playlist no Spotify
                        </a>
                      </div>
                    )}
                    <div>
                      <strong>Playlist Colaborativa:</strong>{' '}
                      {debugInfo.step3_workspace.playlistIsCollaborative ? '✅ Sim' : '❌ Não'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step 4: Spotify Config */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-blue-500" size={20} />
                <h2 className="text-2xl font-bold">4. Configuração Spotify API</h2>
              </div>
              <div className="ml-8 space-y-2">
                <div>
                  <strong>Client ID:</strong>{' '}
                  {debugInfo.step4_spotify_config?.hasClientId ? '✅ Configurado' : '❌ Faltando'}
                </div>
                <div>
                  <strong>Client Secret:</strong>{' '}
                  {debugInfo.step4_spotify_config?.hasClientSecret ? '✅ Configurado' : '❌ Faltando'}
                </div>
                <div>
                  <strong>Redirect URI:</strong>{' '}
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {debugInfo.step4_spotify_config?.redirectUri}
                  </code>
                </div>
                <div>
                  <strong>Redirect URI Correto:</strong>{' '}
                  {debugInfo.step4_spotify_config?.redirectUriIsCorrect ? '✅ Sim' : '⚠️ Verificar'}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4">💡 Recomendações</h2>
                <ul className="space-y-3 ml-4">
                  {debugInfo.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw JSON */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Ver JSON completo
              </summary>
              <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto text-xs">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

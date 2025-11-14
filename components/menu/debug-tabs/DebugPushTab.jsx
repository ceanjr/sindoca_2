'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createClient } from '@/lib/supabase/client';
import MobileLogsViewer from './MobileLogsViewer';

/**
 * DebugPushTab - Tab de debug para Push Notifications
 */
export default function DebugPushTab() {
  const { user } = useAuth();
  const { isSupported, permission, subscription, dbSubscription, isPushActive, subscribeToPush } =
    usePushNotifications();
  const [dbSubscriptions, setDbSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [healthCheckResult, setHealthCheckResult] = useState(null);

  // Carregar subscriptions do banco
  useEffect(() => {
    loadSubscriptions();
  }, [user]);

  async function loadSubscriptions() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar subscriptions:', error);
    } else {
      setDbSubscriptions(data || []);
    }
    setLoading(false);
  }

  async function testSubscribe() {
    setTestResult({ loading: true });

    try {
      // 1. Solicitar permissão primeiro se ainda não foi concedida
      if (permission !== 'granted') {
        console.log('[Debug] Solicitando permissão...');
        const granted = await Notification.requestPermission();

        if (granted !== 'granted') {
          setTestResult({
            success: false,
            message: `Permissão: ${granted}. Você precisa permitir!`,
          });
          return;
        }

        // Aguardar um pouco para o estado atualizar
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // 2. Tentar criar subscription via hook
      console.log('[Debug] Criando subscription...');
      const sub = await subscribeToPush();

      if (sub) {
        setTestResult({
          success: true,
          message: 'Subscription criada! Aguardando salvar no banco...',
          subscription: sub.toJSON(),
        });

        // 3. Recarregar do banco após 2 segundos
        setTimeout(loadSubscriptions, 2000);
      } else {
        setTestResult({
          success: false,
          message: 'Falha ao criar subscription. Veja o console.',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message,
      });
    }
  }

  async function checkSubscriptionHealth() {
    setHealthCheckResult({ loading: true });

    if (!isPushActive) {
      setHealthCheckResult({
        success: false,
        message: 'Push não está ativo. Ative as notificações primeiro.',
      });
      return;
    }

    try {
      console.log('[Debug] Enviando notificação de teste para si mesmo...');

      // Enviar notificação de teste para o próprio usuário
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: user.id,
          title: '✅ Teste de Saúde',
          body: 'Sua subscription está funcionando! Esta notificação foi enviada pelo sistema de diagnóstico.',
          url: '/',
          notificationType: 'test',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setHealthCheckResult({
          success: true,
          message: `✅ Notificação enviada com sucesso! Enviada para ${result.sent}/${result.total} subscription(s). Verifique se recebeu a notificação.`,
          details: result,
        });
      } else {
        setHealthCheckResult({
          success: false,
          message: result.error || 'Falha ao enviar notificação de teste',
          details: result,
        });
      }
    } catch (error) {
      console.error('[Debug] Erro no health check:', error);
      setHealthCheckResult({
        success: false,
        message: error.message,
      });
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">❌ Não autenticado</p>
          <p className="text-red-700 text-sm mt-1">
            Você precisa estar logado para usar o debug.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Status Geral */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h3 className="font-semibold text-textPrimary mb-3 flex items-center gap-2">
          📊 Status Geral
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-textSecondary">Usuário:</span>
            <span className="font-semibold text-textPrimary truncate ml-2 max-w-[200px]">
              {user.email}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Suporte Push:</span>
            <span className={isSupported ? 'text-green-600' : 'text-red-600'}>
              {isSupported ? '✅ Sim' : '❌ Não'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Permissão:</span>
            <span
              className={
                permission === 'granted'
                  ? 'text-green-600'
                  : permission === 'denied'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }
            >
              {permission === 'granted' && '✅ Concedida'}
              {permission === 'denied' && '❌ Negada'}
              {permission === 'default' && '⏳ Não solicitada'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Subscription navegador:</span>
            <span className={subscription ? 'text-green-600' : 'text-yellow-600'}>
              {subscription ? '✅ Sim' : '⏳ Não'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Subscription banco:</span>
            <span className={dbSubscription ? 'text-green-600' : 'text-yellow-600'}>
              {dbSubscription ? '✅ Sim' : '⏳ Não'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-textSecondary">Push ativo (completo):</span>
            <span className={isPushActive ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              {isPushActive ? '✅ SIM' : '❌ NÃO'}
            </span>
          </div>
        </div>

        {/* Aviso se há divergência */}
        {subscription && !dbSubscription && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-medium">
              ⚠️ Subscription no navegador mas não no banco!
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Clique em "Testar Subscription" para sincronizar
            </p>
          </div>
        )}

        {!subscription && dbSubscription && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-medium">
              ⚠️ Subscription no banco mas não no navegador!
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              O navegador perdeu a subscription. Use o botão abaixo para recriar
            </p>
            <button
              onClick={async () => {
                setTestResult({ loading: true });
                try {
                  const sub = await subscribeToPush();
                  if (sub) {
                    setTestResult({
                      success: true,
                      message: 'Subscription recriada com sucesso!',
                    });
                    setTimeout(loadSubscriptions, 1000);
                  } else {
                    setTestResult({
                      success: false,
                      message: 'Falha ao recriar subscription',
                    });
                  }
                } catch (error) {
                  setTestResult({
                    success: false,
                    message: error.message,
                  });
                }
              }}
              className="mt-2 w-full px-3 py-2 bg-yellow-600 text-white rounded-lg text-xs font-semibold hover:bg-yellow-700 transition-colors"
            >
              🔄 Reativar Notificações
            </button>
          </div>
        )}
      </div>

      {/* Subscription do Navegador */}
      {subscription && (
        <div className="bg-gray-50 rounded-2xl p-4">
          <h3 className="font-semibold text-textPrimary mb-3 flex items-center gap-2">
            📱 Subscription Navegador
          </h3>
          <pre className="bg-white p-3 rounded-lg overflow-x-auto text-xs font-mono border border-gray-200">
            {JSON.stringify(subscription.toJSON(), null, 2)}
          </pre>
        </div>
      )}

      {/* Teste Manual */}
      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20">
        <h3 className="font-semibold text-textPrimary mb-3 flex items-center gap-2">
          🧪 Teste Manual
        </h3>
        <button
          onClick={testSubscribe}
          disabled={!isSupported || testResult?.loading}
          className="w-full px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testResult?.loading ? 'Testando...' : '▶️ Testar Subscription'}
        </button>

        {testResult && !testResult.loading && (
          <div
            className={`mt-3 p-3 rounded-lg ${
              testResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {testResult.success ? '✅' : '❌'} {testResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Health Check - Testar se notificação é recebida */}
      {isPushActive && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
          <h3 className="font-semibold text-textPrimary mb-3 flex items-center gap-2">
            🩺 Verificar Saúde da Subscription
          </h3>
          <p className="text-sm text-textSecondary mb-3">
            Envie uma notificação de teste para você mesmo para verificar se está recebendo corretamente.
          </p>
          <button
            onClick={checkSubscriptionHealth}
            disabled={healthCheckResult?.loading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {healthCheckResult?.loading ? 'Enviando...' : '🚀 Testar Notificação Real'}
          </button>

          {healthCheckResult && !healthCheckResult.loading && (
            <div
              className={`mt-3 p-3 rounded-lg ${
                healthCheckResult.success
                  ? 'bg-green-100 border border-green-300'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  healthCheckResult.success ? 'text-green-900' : 'text-red-800'
                }`}
              >
                {healthCheckResult.success ? '✅' : '❌'} {healthCheckResult.message}
              </p>
              {healthCheckResult.success && (
                <p className="text-xs text-green-700 mt-2">
                  ⚠️ Se você NÃO recebeu a notificação, abra o DevTools (F12) → Console e procure por logs com [SW].
                  Isso indica que a subscription está salva mas o Service Worker não está exibindo a notificação.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subscriptions no Banco */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-textPrimary flex items-center gap-2">
            💾 Banco de Dados
          </h3>
          <button
            onClick={loadSubscriptions}
            disabled={loading}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`text-textSecondary ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-textSecondary mt-2">Carregando...</p>
          </div>
        ) : dbSubscriptions.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 font-semibold text-sm">
              ⚠️ Nenhuma subscription no banco!
            </p>
            <p className="text-yellow-700 text-xs mt-1">
              As subscriptions não estão sendo salvas. Verifique:
            </p>
            <ul className="text-yellow-700 text-xs mt-2 ml-4 list-disc space-y-1">
              <li>Logs do servidor Next.js</li>
              <li>Console do navegador (F12)</li>
              <li>Política RLS no Supabase</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-textSecondary">
              Total: {dbSubscriptions.length} subscription(s)
            </p>
            {dbSubscriptions.map((sub, index) => (
              <div
                key={sub.id}
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-textPrimary">
                    #{index + 1}
                  </span>
                  {sub.user_id === user.id && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Sua
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="truncate">
                    <span className="text-gray-500">User:</span>{' '}
                    {sub.user_id.substring(0, 12)}...
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Endpoint:</span>{' '}
                    {sub.endpoint.substring(0, 35)}...
                  </div>
                  <div>
                    <span className="text-gray-500">Criada:</span>{' '}
                    {new Date(sub.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          💡 Como usar
        </h3>
        <ol className="text-xs text-blue-800 space-y-2 ml-4 list-decimal">
          <li>Abra o DevTools (F12) → Console</li>
          <li>Clique em "Testar Subscription"</li>
          <li>Permita notificações quando solicitado</li>
          <li>
            Observe logs com <code className="bg-blue-100 px-1">[Push]</code> e{' '}
            <code className="bg-blue-100 px-1">[Subscribe]</code>
          </li>
          <li>Clique no ícone de reload para atualizar o banco</li>
        </ol>
      </div>

      {/* Mobile Logs Viewer - Para PWAs em mobile sem DevTools */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <MobileLogsViewer />
      </div>
    </div>
  );
}

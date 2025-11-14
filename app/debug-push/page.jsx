'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createClient } from '@/lib/supabase/client';

export default function DebugPushPage() {
  const { user } = useAuth();
  const { isSupported, permission, subscription, subscribeToPush } =
    usePushNotifications();
  const [dbSubscriptions, setDbSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);

  // Carregar subscriptions do banco
  useEffect(() => {
    loadSubscriptions();
  }, [user]);

  async function loadSubscriptions() {
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
            message: `Permissão negada: ${granted}. Você precisa permitir notificações!`,
          });
          return;
        }

        // Aguardar um pouco para o estado atualizar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 2. Tentar criar subscription via hook
      console.log('[Debug] Criando subscription...');
      const sub = await subscribeToPush();

      if (sub) {
        setTestResult({
          success: true,
          message: 'Subscription criada no navegador! Aguardando salvamento no banco...',
          subscription: sub.toJSON(),
        });

        // 3. Recarregar do banco após 2 segundos
        setTimeout(loadSubscriptions, 2000);
      } else {
        setTestResult({
          success: false,
          message: 'Falha ao criar subscription no navegador. Verifique o console.',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message,
      });
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Debug Push Notifications</h1>
          <p className="text-red-500">Você precisa estar autenticado!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            🐛 Debug Push Notifications
          </h1>
          <p className="text-gray-600">
            Diagnóstico completo do sistema de notificações push
          </p>
        </div>

        {/* Status Geral */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">📊 Status Geral</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span>Usuário:</span>
              <span className="font-bold">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span>User ID:</span>
              <span className="text-xs">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Navegador suporta Push:</span>
              <span className={isSupported ? 'text-green-600' : 'text-red-600'}>
                {isSupported ? '✅ Sim' : '❌ Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Permissão:</span>
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
              <span>Subscription ativa no navegador:</span>
              <span
                className={subscription ? 'text-green-600' : 'text-yellow-600'}
              >
                {subscription ? '✅ Sim' : '⏳ Não'}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription do Navegador */}
        {subscription && (
          <div className="bg-white rounded-lg p-6 shadow">
            <h2 className="text-lg font-semibold mb-4">
              📱 Subscription do Navegador
            </h2>
            <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(subscription.toJSON(), null, 2)}
            </pre>
          </div>
        )}

        {/* Teste Manual */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">🧪 Teste Manual</h2>
          <button
            onClick={testSubscribe}
            disabled={!isSupported || testResult?.loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testResult?.loading
              ? 'Testando...'
              : 'Testar Criação de Subscription'}
          </button>

          {testResult && !testResult.loading && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                testResult.success ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <p
                className={`font-semibold ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {testResult.success ? '✅' : '❌'} {testResult.message}
              </p>
              {testResult.subscription && (
                <pre className="mt-2 text-xs overflow-x-auto">
                  {JSON.stringify(testResult.subscription, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Subscriptions no Banco */}
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">💾 Banco de Dados</h2>
            <button
              onClick={loadSubscriptions}
              disabled={loading}
              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : '🔄 Recarregar'}
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : dbSubscriptions.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-semibold">
                ⚠️ Nenhuma subscription encontrada no banco!
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Isso significa que as subscriptions não estão sendo salvas.
                Verifique:
              </p>
              <ul className="text-yellow-700 text-sm mt-2 ml-4 list-disc">
                <li>Logs do servidor Next.js</li>
                <li>Erros no console do navegador</li>
                <li>Política RLS no Supabase</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Total: {dbSubscriptions.length} subscription(s)
              </p>
              {dbSubscriptions.map((sub, index) => (
                <div
                  key={sub.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">Subscription #{index + 1}</h3>
                    {sub.user_id === user.id && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Sua
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div>
                      <span className="text-gray-500">User ID:</span>{' '}
                      {sub.user_id.substring(0, 20)}...
                    </div>
                    <div>
                      <span className="text-gray-500">Endpoint:</span>{' '}
                      {sub.endpoint.substring(0, 50)}...
                    </div>
                    <div>
                      <span className="text-gray-500">Criada:</span>{' '}
                      {new Date(sub.created_at).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-500">Atualizada:</span>{' '}
                      {new Date(sub.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Console Logs */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">📋 Instruções</h2>
          <div className="prose prose-sm">
            <ol className="space-y-2 text-sm">
              <li>
                Abra o <strong>DevTools</strong> (F12) e vá para a aba{' '}
                <strong>Console</strong>
              </li>
              <li>
                Clique em <strong>"Testar Criação de Subscription"</strong>{' '}
                acima
              </li>
              <li>
                Observe os logs no console que começam com{' '}
                <code className="bg-gray-100 px-1">[Push]</code> e{' '}
                <code className="bg-gray-100 px-1">[Subscribe]</code>
              </li>
              <li>
                Verifique se há algum erro na requisição para{' '}
                <code className="bg-gray-100 px-1">/api/push/subscribe</code>
              </li>
              <li>
                Depois de alguns segundos, clique em <strong>"Recarregar"</strong>{' '}
                na seção "Banco de Dados" para ver se foi salva
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

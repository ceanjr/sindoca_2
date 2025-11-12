'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/lib/config';

export default function DebugPushPage() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState({
    permission: 'checking...',
    serviceWorker: 'checking...',
    subscription: 'checking...',
    vapidKey: 'checking...',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    addLog('🔍 Verificando status...');

    // Check notification permission
    if ('Notification' in window) {
      setStatus((prev) => ({ ...prev, permission: Notification.permission }));
      addLog(`Permissão: ${Notification.permission}`);
    } else {
      setStatus((prev) => ({ ...prev, permission: 'not supported' }));
      addLog('❌ Notification API não suportada');
    }

    // Check service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          setStatus((prev) => ({ ...prev, serviceWorker: 'registered' }));
          addLog('✅ Service Worker registrado');
        } else {
          setStatus((prev) => ({ ...prev, serviceWorker: 'not registered' }));
          addLog('⚠️  Service Worker não registrado');
        }
      } catch (error: any) {
        setStatus((prev) => ({ ...prev, serviceWorker: 'error' }));
        addLog(`❌ Erro ao verificar SW: ${error.message}`);
      }
    } else {
      setStatus((prev) => ({ ...prev, serviceWorker: 'not supported' }));
      addLog('❌ Service Worker não suportado');
    }

    // Check push subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setStatus((prev) => ({ ...prev, subscription: 'active' }));
          addLog('✅ Push subscription ativa');
          addLog(`   Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
        } else {
          setStatus((prev) => ({ ...prev, subscription: 'none' }));
          addLog('⚠️  Nenhuma push subscription');
        }
      } catch (error: any) {
        setStatus((prev) => ({ ...prev, subscription: 'error' }));
        addLog(`❌ Erro ao verificar subscription: ${error.message}`);
      }
    } else {
      setStatus((prev) => ({ ...prev, subscription: 'not supported' }));
      addLog('❌ Push API não suportada');
    }

    // Check VAPID key
    if (config.vapidPublicKey) {
      setStatus((prev) => ({ ...prev, vapidKey: 'configured' }));
      addLog(`✅ VAPID key: ${config.vapidPublicKey.substring(0, 20)}...`);
    } else {
      setStatus((prev) => ({ ...prev, vapidKey: 'missing' }));
      addLog('❌ VAPID key não configurada');
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      addLog('❌ Notification API não suportada');
      return false;
    }

    addLog('🔔 Solicitando permissão...');
    const permission = await Notification.requestPermission();
    setStatus((prev) => ({ ...prev, permission }));

    if (permission === 'granted') {
      addLog('✅ Permissão concedida!');
      return true;
    } else if (permission === 'denied') {
      addLog('❌ Permissão negada');
      return false;
    } else {
      addLog('⚠️  Permissão não concedida');
      return false;
    }
  };

  const forceSubscribe = async () => {
    setIsProcessing(true);
    addLog('');
    addLog('🔧 Iniciando registro forçado...');

    try {
      // Step 1: Check/request permission
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          addLog('❌ Não foi possível prosseguir sem permissão');
          setIsProcessing(false);
          return;
        }
      } else {
        addLog('✅ Permissão já concedida');
      }

      // Step 2: Wait for service worker
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        addLog('❌ Push notifications não suportado neste navegador');
        setIsProcessing(false);
        return;
      }

      addLog('⏳ Aguardando Service Worker...');
      const registration = await navigator.serviceWorker.ready;
      addLog('✅ Service Worker pronto');

      // Step 3: Check existing subscription
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        addLog('⚠️  Subscription antiga encontrada. Removendo...');
        await subscription.unsubscribe();
        addLog('✅ Subscription antiga removida');
      }

      // Step 4: Create new subscription
      addLog('📝 Criando nova subscription...');

      function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
      });

      addLog('✅ Subscription criada no navegador!');
      addLog(`   Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      setStatus((prev) => ({ ...prev, subscription: 'active' }));

      // Step 5: Save to database
      addLog('💾 Salvando no banco de dados...');

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        addLog('✅ SUCESSO! Subscription salva no banco');
        addLog('🎉 Push notifications configuradas com sucesso!');
        addLog('');
        addLog('Agora você deve receber notificações quando:');
        addLog('  • Alguém enviar "Pensando em você"');
        addLog('  • Alguém adicionar fotos');
        addLog('  • Alguém adicionar love reasons');
        addLog('  • Alguém adicionar músicas');
        addLog('  • Alguém reagir com emoji');
      } else {
        addLog(`❌ Erro ao salvar no banco: ${result.error}`);
        if (result.details) {
          addLog(`   Detalhes: ${result.details}`);
        }
        addLog('   Status: ' + response.status);
      }
    } catch (error: any) {
      addLog(`❌ Erro: ${error.message}`);
      console.error('Error in forceSubscribe:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">🔔 Debug Push Notifications</h1>
          <p className="text-textSecondary">Você precisa estar logado para usar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">🔔 Debug Push Notifications</h1>
        <p className="text-sm text-textSecondary mb-6">
          Usuário: {profile?.full_name || profile?.email || user.email}
        </p>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatusCard title="Permissão" value={status.permission} />
          <StatusCard title="Service Worker" value={status.serviceWorker} />
          <StatusCard title="Subscription" value={status.subscription} />
          <StatusCard title="VAPID Key" value={status.vapidKey} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={forceSubscribe}
            disabled={isProcessing}
            className="flex-1 bg-pink-500 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors"
          >
            {isProcessing ? '⏳ Processando...' : '🔧 Forçar Registro'}
          </button>
          <button
            onClick={checkStatus}
            disabled={isProcessing}
            className="px-6 py-3 bg-gray-200 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            🔄
          </button>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-soft-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">📋 Logs</h2>
            <button
              onClick={clearLogs}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpar
            </button>
          </div>
          <div className="bg-gray-50 rounded p-4 font-mono text-xs max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400">Nenhum log ainda...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold mb-2">📖 Instruções:</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Clique em "Forçar Registro" para criar uma nova subscription</li>
            <li>Se pedir permissão, aceite as notificações</li>
            <li>Aguarde até ver "SUCESSO!" nos logs</li>
            <li>Peça para alguém testar enviando uma notificação</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, value }: { title: string; value: string }) {
  const getColor = () => {
    if (value.includes('error') || value === 'denied' || value === 'missing' || value === 'none') {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (value === 'granted' || value === 'active' || value === 'registered' || value === 'configured') {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className={`border rounded-lg p-3 ${getColor()}`}>
      <div className="text-xs font-semibold opacity-70 mb-1">{title}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

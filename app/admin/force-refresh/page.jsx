'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Página de administração para forçar refresh em todos os clientes
 * Acesse: /admin/force-refresh
 */
export default function ForceRefreshPage() {
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const router = useRouter();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const forceRefreshAll = async () => {
    setStatus('running');
    setLogs([]);

    try {
      // 1. Limpar Service Worker e Cache
      addLog('🔄 Limpando Service Worker...', 'info');

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          addLog(`✅ Service Worker desregistrado: ${registration.scope}`, 'success');
        }
      }

      // 2. Limpar todos os caches
      addLog('🗑️ Limpando caches...', 'info');
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          addLog(`✅ Cache deletado: ${cacheName}`, 'success');
        }
      }

      // 3. Limpar localStorage
      addLog('📦 Limpando localStorage...', 'info');
      localStorage.clear();
      addLog('✅ localStorage limpo', 'success');

      // 4. Limpar sessionStorage
      addLog('📦 Limpando sessionStorage...', 'info');
      sessionStorage.clear();
      addLog('✅ sessionStorage limpo', 'success');

      // 5. Dessubscrever de notificações
      addLog('🔕 Removendo subscriptions push...', 'info');
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            addLog('✅ Push subscription removida', 'success');
          }
        } catch (error) {
          addLog(`⚠️ Erro ao remover subscription: ${error.message}`, 'warning');
        }
      }

      // 6. Fazer logout
      addLog('🚪 Fazendo logout...', 'info');
      const supabase = createClient();
      await supabase.auth.signOut();
      addLog('✅ Logout realizado', 'success');

      // 7. Finalizar
      setStatus('success');
      addLog('', 'info');
      addLog('🎉 TUDO LIMPO! Redirecionando para login em 3 segundos...', 'success');

      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 3000);

    } catch (error) {
      setStatus('error');
      addLog(`❌ ERRO: ${error.message}`, 'error');
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
            ⚠️ Área de Administração
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Force Refresh - Limpa TUDO e força re-login
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-600 p-6 rounded-lg mb-6">
          <div className="flex items-start">
            <span className="text-3xl mr-4">⚠️</span>
            <div>
              <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                ATENÇÃO: Esta ação é IRREVERSÍVEL
              </h3>
              <ul className="text-yellow-700 dark:text-yellow-300 space-y-1 text-sm">
                <li>• Vai desregistrar o Service Worker</li>
                <li>• Vai limpar TODOS os caches</li>
                <li>• Vai remover subscription de push</li>
                <li>• Vai fazer LOGOUT</li>
                <li>• Você precisará fazer login novamente</li>
                <li>• Precisará permitir notificações novamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600 p-6 rounded-lg mb-6">
          <div className="flex items-start">
            <span className="text-3xl mr-4">💡</span>
            <div>
              <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">
                Instruções
              </h3>
              <ol className="text-blue-700 dark:text-blue-300 space-y-1 text-sm list-decimal list-inside">
                <li>Execute o SQL no Supabase (force-logout-all.sql)</li>
                <li>Clique no botão abaixo</li>
                <li>Aguarde a limpeza completar</li>
                <li>Será redirecionado para login</li>
                <li>Faça login novamente</li>
                <li>Permita notificações quando solicitado</li>
                <li>Repita em TODOS os dispositivos/navegadores</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Botão de Ação */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <button
            onClick={forceRefreshAll}
            disabled={status === 'running'}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              status === 'running'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {status === 'running' ? '⏳ Executando...' : '🧹 LIMPAR TUDO E FORÇAR REFRESH'}
          </button>
        </div>

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-2xl shadow-xl p-6 font-mono text-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">📝 Logs de Execução</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                status === 'running' ? 'bg-yellow-500 text-black' :
                status === 'success' ? 'bg-green-500 text-white' :
                status === 'error' ? 'bg-red-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {status === 'running' ? 'EXECUTANDO' :
                 status === 'success' ? 'SUCESSO' :
                 status === 'error' ? 'ERRO' : 'IDLE'}
              </span>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-white">
                  <span className="text-gray-400">[{log.timestamp}]</span>{' '}
                  <span className={getLogColor(log.type)}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Voltar para Home
          </button>
        </div>
      </div>
    </div>
  );
}

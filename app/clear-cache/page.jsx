'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function ClearCachePage() {
  const [clearing, setClearing] = useState(false);
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);

  const addResult = (message, success = true) => {
    setResults(prev => [...prev, { message, success, timestamp: Date.now() }]);
  };

  const clearEverything = async () => {
    setClearing(true);
    setResults([]);
    setCompleted(false);

    try {
      // 1. Limpar Service Workers
      addResult('🔄 Desregistrando Service Workers...');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
          addResult(`✅ Service Worker desregistrado: ${registration.scope}`);
        }
      }

      // 2. Limpar todos os caches
      addResult('🔄 Limpando Cache Storage...');
      const cacheNames = await caches.keys();
      for (let cacheName of cacheNames) {
        await caches.delete(cacheName);
        addResult(`✅ Cache deletado: ${cacheName}`);
      }

      // 3. Limpar LocalStorage (incluindo dados do Supabase)
      addResult('🔄 Limpando LocalStorage...');
      const localStorageKeys = Object.keys(localStorage);

      // Log chaves específicas do Supabase para debug
      const supabaseKeys = localStorageKeys.filter(k => k.includes('supabase'));
      if (supabaseKeys.length > 0) {
        addResult(`  📋 Encontradas ${supabaseKeys.length} chaves do Supabase`);
      }

      localStorage.clear();
      addResult(`✅ LocalStorage limpo (${localStorageKeys.length} itens removidos)`);

      // 4. Limpar SessionStorage
      addResult('🔄 Limpando SessionStorage...');
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorage.clear();
      addResult(`✅ SessionStorage limpo (${sessionStorageKeys.length} itens removidos)`);

      // 5. Limpar IndexedDB (incluindo databases do Supabase)
      addResult('🔄 Limpando IndexedDB...');
      const knownDatabases = [
        'supabase-cache',
        'supabase-auth',
        'supabase-db',
        'keyval-store',
        'firebaseLocalStorageDb',
        'workbox-expiration',
        'workbox-precache-v2'
      ];

      if (window.indexedDB && window.indexedDB.databases) {
        try {
          const databases = await window.indexedDB.databases();
          for (let db of databases) {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
              addResult(`✅ IndexedDB deletado: ${db.name}`);
            }
          }
        } catch (e) {
          // Se databases() falhar, usar lista conhecida
          for (let dbName of knownDatabases) {
            window.indexedDB.deleteDatabase(dbName);
            addResult(`✅ IndexedDB deletado (fallback): ${dbName}`);
          }
        }
      } else {
        // Fallback para navegadores que não suportam databases()
        for (let dbName of knownDatabases) {
          window.indexedDB.deleteDatabase(dbName);
          addResult(`✅ IndexedDB deletado (tentativa): ${dbName}`);
        }
      }

      // 6. Limpar Cookies (apenas do domínio atual)
      addResult('🔄 Limpando Cookies...');
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name] = cookie.split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
      addResult(`✅ Cookies limpos (${cookies.length} cookies removidos)`);

      // 7. Sucesso final
      addResult('🎉 LIMPEZA COMPLETA! Todos os dados foram removidos.', true);
      setCompleted(true);

      // Auto-reload após 2 segundos
      setTimeout(() => {
        addResult('🔄 Recarregando página em 2 segundos...', true);
        setTimeout(() => {
          // Redirect with force_reload flag to ensure hard reload after login
          window.location.href = '/auth/login?force_reload=true';
        }, 2000);
      }, 1000);

    } catch (error) {
      console.error('Erro ao limpar:', error);
      addResult(`❌ Erro: ${error.message}`, false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={clearing ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: clearing ? Infinity : 0, ease: 'linear' }}
              className="inline-block mb-4"
            >
              <Trash2 size={64} className="text-red-500" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Limpeza Total de Cache
            </h1>
            <p className="text-gray-600">
              Esta página remove TODOS os dados armazenados no navegador
            </p>
          </div>

          {/* Warning */}
          {!completed && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">
                    Atenção!
                  </h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    Isso irá remover: Service Workers, Cache, LocalStorage, SessionStorage,
                    IndexedDB (incluindo dados do Supabase), Cookies. Você será deslogado e redirecionado para a página de login.
                  </p>
                  <p className="text-xs text-yellow-600 font-medium">
                    💡 Recomendado especialmente para usuários do Microsoft Edge com problemas de login
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="mb-6 max-h-96 overflow-y-auto bg-gray-50 rounded-2xl p-4">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <motion.div
                    key={result.timestamp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-start gap-2 text-sm ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    )}
                    <span className="font-mono">{result.message}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!completed && (
            <button
              onClick={clearEverything}
              disabled={clearing}
              className="w-full py-4 bg-red-500 text-white font-semibold rounded-xl shadow-lg hover:bg-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {clearing ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 size={20} />
                  Limpar TUDO e Reiniciar
                </>
              )}
            </button>
          )}

          {completed && (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block mb-4"
              >
                <CheckCircle size={64} className="text-green-500" />
              </motion.div>
              <p className="text-xl font-semibold text-green-700">
                Limpeza Concluída!
              </p>
              <p className="text-gray-600 mt-2">
                Redirecionando para login...
              </p>
            </div>
          )}

          {/* Manual Navigation */}
          {!clearing && !completed && (
            <div className="mt-6 text-center">
              <a
                href="/auth/login"
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Voltar para Login sem limpar
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

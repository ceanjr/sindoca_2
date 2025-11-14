'use client';

import { useState, useEffect } from 'react';
import { Copy, Trash2, Download, Filter, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import mobileLogger from '@/lib/utils/mobileLogger';

/**
 * MobileLogsViewer - Visualizador de logs para debugging em mobile
 */
export default function MobileLogsViewer() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Carregar logs iniciais
  useEffect(() => {
    loadLogs();

    // Auto-refresh a cada 2 segundos se ativado
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Escutar mensagens do Service Worker
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, []);

  // Handler para mensagens do Service Worker
  function handleSWMessage(event) {
    if (event.data && event.data.type === 'SW_LOG') {
      const logEntry = event.data.log;
      // Salvar no mobileLogger
      mobileLogger.log(
        logEntry.level,
        logEntry.category,
        logEntry.message,
        logEntry.data
      );
      // Recarregar logs
      loadLogs();
    }
  }

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [logs, levelFilter, categoryFilter]);

  function loadLogs() {
    const allLogs = mobileLogger.getLogs();
    setLogs(allLogs);
  }

  function applyFilters() {
    let filtered = [...logs];

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    setFilteredLogs(filtered);
  }

  function clearLogs() {
    if (confirm('Tem certeza que deseja limpar todos os logs?')) {
      mobileLogger.clearLogs();
      setLogs([]);
      toast.success('Logs limpos');
    }
  }

  async function copyLogs() {
    const success = await mobileLogger.copyToClipboard();
    if (success) {
      toast.success('Logs copiados!', {
        description: 'Cole em um app de mensagens e envie para análise',
      });
    } else {
      toast.error('Erro ao copiar logs');
    }
  }

  function downloadLogs() {
    const text = mobileLogger.exportAsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sindoca-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs baixados');
  }

  // Obter níveis e categorias únicos
  const levels = ['all', ...new Set(logs.map(log => log.level))];
  const categories = ['all', ...new Set(logs.map(log => log.category))];

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-textPrimary flex items-center gap-2">
          📱 Logs do App (Mobile Debug)
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLogs}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copiar logs"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={downloadLogs}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Baixar logs"
          >
            <Download size={16} />
          </button>
          <button
            onClick={clearLogs}
            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            title="Limpar logs"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Para Android PWA:</strong> Use o botão de copiar (
          <Copy size={12} className="inline" />) para copiar todos os logs e
          enviar via WhatsApp/Telegram para análise.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-textSecondary" />

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          {levels.map((level) => (
            <option key={level} value={level}>
              {level === 'all' ? 'Todos os níveis' : level.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 rounded"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Todas categorias' : cat}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1 text-xs text-textSecondary">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>

        <span className="text-xs text-textSecondary ml-auto">
          {filteredLogs.length} de {logs.length} logs
        </span>
      </div>

      {/* Lista de logs */}
      <div className="bg-gray-900 rounded-lg p-3 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-4">
            Nenhum log ainda. Logs do Service Worker aparecerão aqui automaticamente.
          </p>
        ) : (
          <div className="space-y-1 font-mono text-xs">
            {filteredLogs.map((log, index) => {
              const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');

              const levelColors = {
                info: 'text-blue-400',
                warn: 'text-yellow-400',
                error: 'text-red-400',
                debug: 'text-gray-400',
              };

              const levelColor = levelColors[log.level] || 'text-gray-400';

              return (
                <div key={index} className="border-b border-gray-700 pb-1">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500">{time}</span>
                    <span className={`${levelColor} font-bold uppercase`}>
                      {log.level}
                    </span>
                    <span className="text-purple-400">[{log.category}]</span>
                    <span className="text-gray-200 flex-1">{log.message}</span>
                  </div>
                  {log.data && (
                    <div className="ml-20 mt-1">
                      <pre className="text-gray-400 text-[10px] whitespace-pre-wrap break-all">
                        {typeof log.data === 'string'
                          ? log.data
                          : JSON.stringify(JSON.parse(log.data), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instruções para testar */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <h4 className="font-semibold text-green-900 text-sm mb-2">
          🧪 Como testar (Android PWA):
        </h4>
        <ol className="text-xs text-green-800 space-y-1 ml-4 list-decimal">
          <li>Deixe esta tela aberta</li>
          <li>Peça para alguém enviar uma notificação de teste para você</li>
          <li>Aguarde 10 segundos</li>
          <li>
            Você verá logs <code className="bg-green-100 px-1">[SW]</code>{' '}
            aparecerem aqui automaticamente
          </li>
          <li>
            Se ver "✅ Notification displayed" mas NÃO recebeu, o problema é
            do sistema (modo silencioso, etc)
          </li>
          <li>
            Se NÃO ver nenhum log <code className="bg-green-100 px-1">[SW]</code>,
            o Service Worker não está recebendo push
          </li>
          <li>
            Copie os logs e envie para análise usando o botão{' '}
            <Copy size={12} className="inline" />
          </li>
        </ol>
      </div>
    </div>
  );
}

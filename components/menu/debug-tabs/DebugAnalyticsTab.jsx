'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Send, CheckCircle, XCircle, MousePointerClick } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

/**
 * DebugAnalyticsTab - Tab para visualizar analytics de push notifications
 */
export default function DebugAnalyticsTab() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(7);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, daysBack]);

  async function loadAnalytics() {
    setLoading(true);
    const supabase = createClient();

    try {
      // Get user's workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        setLoading(false);
        return;
      }

      // Get stats using the SQL function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_push_stats', {
          workspace_uuid: membership.workspace_id,
          days_back: daysBack,
        })
        .single();

      if (!statsError && statsData) {
        setStats(statsData);
      }

      // Get recent notifications
      const { data: recent } = await supabase
        .from('push_notification_analytics')
        .select('*')
        .eq('workspace_id', membership.workspace_id)
        .order('sent_at', { ascending: false })
        .limit(10);

      setRecentNotifications(recent || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">❌ Não autenticado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com filtro de período */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-textPrimary flex items-center gap-2">
          📊 Analytics de Notificações
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value={1}>Últimas 24h</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
          </select>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`text-textSecondary ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-textSecondary mt-2">Carregando analytics...</p>
        </div>
      ) : stats ? (
        <>
          {/* Cards de métricas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Enviadas */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send size={18} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-900">Enviadas</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.total_sent || 0}</p>
            </div>

            {/* Taxa de Entrega */}
            <div className="bg-green-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-green-600" />
                <span className="text-xs font-medium text-green-900">Taxa Entrega</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {stats.delivery_rate || 0}%
              </p>
              <p className="text-xs text-green-700 mt-1">
                {stats.total_delivered || 0} entregues
              </p>
            </div>

            {/* Falhas */}
            <div className="bg-red-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={18} className="text-red-600" />
                <span className="text-xs font-medium text-red-900">Falhas</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{stats.total_failed || 0}</p>
            </div>

            {/* Taxa de Cliques */}
            <div className="bg-purple-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick size={18} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-900">Taxa Cliques</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {stats.click_rate || 0}%
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {stats.total_clicked || 0} cliques
              </p>
            </div>
          </div>

          {/* Por Tipo de Notificação */}
          {stats.by_type && Object.keys(stats.by_type).length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <h4 className="font-semibold text-textPrimary mb-3 flex items-center gap-2">
                <TrendingUp size={18} />
                Por Tipo de Notificação
              </h4>
              <div className="space-y-2">
                {Object.entries(stats.by_type).map(([type, data]) => (
                  <div key={type} className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-textPrimary capitalize">
                        {type === 'photo' && '📸 Fotos'}
                        {type === 'reason' && '❤️ Razões'}
                        {type === 'music' && '🎵 Músicas'}
                        {type === 'reaction' && '😊 Reações'}
                        {type === 'unknown' && '❓ Outros'}
                        {!['photo', 'reason', 'music', 'reaction', 'unknown'].includes(type) && `📌 ${type}`}
                      </span>
                      <span className="text-xs text-textSecondary">
                        {data.sent} enviadas
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-600">
                        ✓ {data.delivered} entregues
                      </span>
                      {data.failed > 0 && (
                        <span className="text-red-600">
                          ✗ {data.failed} falhas
                        </span>
                      )}
                      {data.clicked > 0 && (
                        <span className="text-purple-600">
                          🖱️ {data.clicked} cliques
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notificações Recentes */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <h4 className="font-semibold text-textPrimary mb-3">
              📋 Notificações Recentes
            </h4>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-textSecondary text-center py-4">
                Nenhuma notificação registrada ainda
              </p>
            ) : (
              <div className="space-y-2">
                {recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-textPrimary">
                        {notif.title}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          notif.delivery_status === 'sent'
                            ? 'bg-green-100 text-green-700'
                            : notif.delivery_status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {notif.delivery_status}
                      </span>
                    </div>
                    {notif.body && (
                      <p className="text-xs text-textSecondary mb-2">{notif.body}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-textSecondary">
                      <span className="capitalize">{notif.notification_type}</span>
                      <span>
                        {new Date(notif.sent_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Nenhum dado de analytics disponível ainda
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          💡 Sobre Analytics
        </h3>
        <ul className="text-xs text-blue-800 space-y-2 ml-4 list-disc">
          <li>
            <strong>Taxa de Entrega:</strong> Porcentagem de notificações enviadas
            com sucesso
          </li>
          <li>
            <strong>Taxa de Cliques:</strong> Porcentagem de notificações que foram
            clicadas
          </li>
          <li>
            <strong>Falhas:</strong> Notificações que não puderam ser entregues
            (subscriptions inválidas)
          </li>
          <li>
            Analytics são registradas automaticamente quando você usa funcionalidades
            do app
          </li>
        </ul>
      </div>
    </div>
  );
}

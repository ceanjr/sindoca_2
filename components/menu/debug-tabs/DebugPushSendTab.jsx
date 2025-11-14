'use client';

import { useState, useEffect } from 'react';
import { Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

/**
 * DebugPushSendTab - Tab para testar envio de notificações push
 */
export default function DebugPushSendTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState({
    title: '🎉 Notificação de Teste',
    body: 'Esta é uma notificação push de teste do Sindoca!',
    url: '/',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const supabase = createClient();

    // Buscar workspace do usuário atual
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user?.id)
      .single();

    if (!membership) {
      setLoading(false);
      return;
    }

    // Buscar todos os membros do workspace
    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', membership.workspace_id);

    if (!members) {
      setLoading(false);
      return;
    }

    const userIds = members.map((m) => m.user_id);

    // Buscar profiles dos membros
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds);

    // Buscar subscriptions ativas de cada usuário
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .in('user_id', userIds);

    // Combinar dados
    const usersWithSubs = (profiles || []).map((profile) => ({
      ...profile,
      hasSubscription: subscriptions?.some((s) => s.user_id === profile.id),
      isCurrentUser: profile.id === user?.id,
    }));

    setUsers(usersWithSubs);
    setLoading(false);
  }

  async function sendNotification() {
    if (!selectedUser) {
      toast.error('Selecione um destinatário');
      return;
    }

    if (!notification.title.trim()) {
      toast.error('Digite um título');
      return;
    }

    setSending(true);

    try {
      console.log('📤 [Debug] Enviando notificação:', {
        recipientUserId: selectedUser,
        title: notification.title,
        body: notification.body,
        url: notification.url,
      });

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUserId: selectedUser,
          title: notification.title,
          body: notification.body,
          url: notification.url,
          notificationType: 'test',
        }),
      });

      console.log('📥 [Debug] Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const result = await response.json();
      console.log('📊 [Debug] Resultado:', result);

      if (response.ok) {
        toast.success('Notificação enviada!', {
          description: `✅ Enviada para ${
            users.find((u) => u.id === selectedUser)?.full_name || 'usuário'
          } - ${result.sent || 0} subscriptions`,
        });
        console.log('✅ [Debug] Notificação enviada com sucesso');
      } else {
        console.error('❌ [Debug] Erro na resposta:', result);
        toast.error('Erro ao enviar', {
          description: result.error || 'Erro desconhecido',
        });
      }
    } catch (error) {
      console.error('❌ [Debug] Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação', {
        description: error.message,
      });
    } finally {
      setSending(false);
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
      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          💡 Como testar
        </h3>
        <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
          <li>Selecione um destinatário abaixo</li>
          <li>Personalize a mensagem (opcional)</li>
          <li>Clique em "Enviar Notificação"</li>
          <li>
            Verifique se a notificação chegou no dispositivo do destinatário
          </li>
        </ol>
      </div>

      {/* Aviso Importante sobre Analytics */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4">
        <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
          ⚠️ Importante: Analytics vs Recebimento Real
        </h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <p>
            <strong>Status "Delivered" no Analytics ≠ Notificação Recebida</strong>
          </p>
          <p>
            Quando o analytics mostra "delivered", significa apenas que o <strong>Push Service</strong> (Google/Apple)
            aceitou a notificação, mas não garante que:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>O dispositivo recebeu a notificação</li>
            <li>O Service Worker exibiu a notificação</li>
            <li>O usuário viu a notificação (pode estar silenciada)</li>
          </ul>
          <p className="mt-3 font-semibold">
            ✅ Para verificar se está realmente funcionando:
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Envie uma notificação de teste</li>
            <li>Peça ao destinatário confirmar se recebeu</li>
            <li>Verifique logs do console (F12) no dispositivo do destinatário</li>
            <li>Procure por logs com prefixo <code className="bg-yellow-100 px-1">[SW]</code></li>
          </ul>
        </div>
      </div>

      {/* Seleção de Destinatário */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h3 className="font-semibold text-textPrimary mb-3 flex items-center gap-2">
          <Users size={18} />
          Destinatário
        </h3>

        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-textSecondary mt-2">Carregando...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              Nenhum usuário encontrado no workspace
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u.id)}
                disabled={!u.hasSubscription}
                className={`
                  w-full p-3 rounded-xl border-2 transition-all text-left
                  ${
                    selectedUser === u.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                  ${!u.hasSubscription ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">
                        {u.full_name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-textPrimary truncate">
                        {u.full_name || u.email}
                      </p>
                      {u.isCurrentUser && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs ${
                          u.hasSubscription
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {u.hasSubscription
                          ? '✅ Push ativo'
                          : '⚠️ Sem push ativo'}
                      </span>
                    </div>
                  </div>

                  {/* Checkbox */}
                  {selectedUser === u.id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Personalizar Notificação */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <h3 className="font-semibold text-textPrimary mb-3">
          ✏️ Personalizar Mensagem
        </h3>

        <div className="space-y-3">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">
              Título
            </label>
            <input
              type="text"
              value={notification.title}
              onChange={(e) =>
                setNotification({ ...notification, title: e.target.value })
              }
              placeholder="Título da notificação"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={50}
            />
            <p className="text-xs text-textSecondary mt-1">
              {notification.title.length}/50 caracteres
            </p>
          </div>

          {/* Corpo */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">
              Mensagem
            </label>
            <textarea
              value={notification.body}
              onChange={(e) =>
                setNotification({ ...notification, body: e.target.value })
              }
              placeholder="Corpo da notificação"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              maxLength={120}
            />
            <p className="text-xs text-textSecondary mt-1">
              {notification.body.length}/120 caracteres
            </p>
          </div>

          {/* URL (opcional) */}
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">
              URL ao clicar (opcional)
            </label>
            <input
              type="text"
              value={notification.url}
              onChange={(e) =>
                setNotification({ ...notification, url: e.target.value })
              }
              placeholder="/"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-textSecondary mt-1">
              Para onde o usuário vai ao clicar na notificação
            </p>
          </div>
        </div>
      </div>

      {/* Botão Enviar */}
      <button
        onClick={sendNotification}
        disabled={!selectedUser || sending || loading}
        className="w-full px-6 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Send size={20} />
        {sending ? 'Enviando...' : '🚀 Enviar Notificação'}
      </button>

      {/* Preview */}
      {selectedUser && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
          <h3 className="font-semibold text-textPrimary mb-3">👁️ Preview</h3>
          <div className="bg-white rounded-lg p-4 shadow-md">
            <p className="font-semibold text-textPrimary">
              {notification.title}
            </p>
            <p className="text-sm text-textSecondary mt-1">
              {notification.body}
            </p>
            <p className="text-xs text-primary mt-2">{notification.url}</p>
          </div>
        </div>
      )}
    </div>
  );
}

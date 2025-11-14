'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

/**
 * Hook para gerenciar preferências de notificação do usuário
 */
export function useNotificationPreferences(userId) {
  const [preferences, setPreferences] = useState({
    push_enabled: false,
    notify_new_music: true,
    notify_new_photos: true,
    notify_new_reasons: true,
    notify_new_reactions: true,
    daily_reminder_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Carregar preferências do banco
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadPreferences();

    // Realtime subscription para mudanças
    const channel = supabase
      .channel('notification-preferences-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_preferences',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.log('[NotificationPrefs] Realtime update:', payload);
          if (payload.new) {
            setPreferences(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Se não existe, criar com valores padrão
        if (error.code === 'PGRST116') {
          await createDefaultPreferences();
        } else {
          throw error;
        }
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      logger.error('[NotificationPrefs] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          push_enabled: false,
          notify_new_music: true,
          notify_new_photos: true,
          notify_new_reasons: true,
          notify_new_reactions: true,
          daily_reminder_enabled: false,
        })
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
      logger.log('[NotificationPrefs] Created default preferences');
    } catch (error) {
      console.error('Error creating default preferences:', error);
      logger.error('[NotificationPrefs] Create error:', error);
    }
  };

  const updatePreference = async (key, value) => {
    // Atualização otimista
    const oldPreferences = { ...preferences };
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', userId);

      if (error) throw error;

      logger.log(`[NotificationPrefs] Updated ${key} to ${value}`);
    } catch (error) {
      // Reverter em caso de erro
      setPreferences(oldPreferences);
      console.error('Error updating preference:', error);
      toast.error('Erro ao atualizar preferência');
    }
  };

  const updateMultiple = async (updates) => {
    // Atualização otimista
    const oldPreferences = { ...preferences };
    setPreferences((prev) => ({ ...prev, ...updates }));

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      logger.log('[NotificationPrefs] Updated multiple:', updates);
    } catch (error) {
      // Reverter em caso de erro
      setPreferences(oldPreferences);
      console.error('Error updating preferences:', error);
      toast.error('Erro ao atualizar preferências');
    }
  };

  return {
    preferences,
    loading,
    updatePreference,
    updateMultiple,
    refresh: loadPreferences,
  };
}

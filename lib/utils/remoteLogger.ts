/**
 * Remote Logger - Logs para o banco de dados para debug remoto
 * Útil para ver o que acontece no navegador de outros usuários
 */

import { createClient } from '@/lib/supabase/client';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface RemoteLog {
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  user_id?: string;
  user_email?: string;
  timestamp: string;
  user_agent?: string;
  url?: string;
}

/**
 * Envia log para o banco de dados
 */
async function sendLogToDatabase(log: RemoteLog) {
  try {
    const supabase = createClient();

    // Não espera o resultado para não bloquear a execução
    supabase
      .from('debug_logs')
      .insert({
        level: log.level,
        category: log.category,
        message: log.message,
        data: log.data,
        user_id: log.user_id,
        user_email: log.user_email,
        user_agent: log.user_agent,
        url: log.url,
        created_at: log.timestamp,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to send remote log:', error);
        }
      });
  } catch (error) {
    // Falha silenciosa - não queremos quebrar a aplicação por causa de logs
    console.error('Remote logger error:', error);
  }
}

/**
 * Classe para fazer logging remoto
 */
class RemoteLogger {
  private enabled = true;
  private maxLogsPerSession = 100;
  private logsCount = 0;

  constructor() {
    // Desabilita em desenvolvimento se preferir
    if (typeof window !== 'undefined') {
      this.enabled = true; // Sempre habilitado para capturar erros
    }
  }

  private async createLog(
    level: LogLevel,
    category: string,
    message: string,
    data?: any
  ) {
    if (!this.enabled || this.logsCount >= this.maxLogsPerSession) {
      return;
    }

    this.logsCount++;

    let userId: string | undefined;
    let userEmail: string | undefined;

    // Tenta pegar informações do usuário
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email;
      }
    } catch (error) {
      // Ignora erros ao pegar usuário
    }

    const log: RemoteLog = {
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Clone para evitar referências
      user_id: userId,
      user_email: userEmail,
      timestamp: new Date().toISOString(),
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // Log no console também
    const consoleMessage = `[RemoteLog:${level.toUpperCase()}] [${category}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, data);
        break;
      case 'warn':
        console.warn(consoleMessage, data);
        break;
      case 'debug':
        console.debug(consoleMessage, data);
        break;
      default:
        console.log(consoleMessage, data);
    }

    await sendLogToDatabase(log);
  }

  info(category: string, message: string, data?: any) {
    return this.createLog('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    return this.createLog('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    return this.createLog('error', category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    return this.createLog('debug', category, message, data);
  }

  /**
   * Desabilita logging remoto
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Habilita logging remoto
   */
  enable() {
    this.enabled = true;
    this.logsCount = 0;
  }
}

// Exporta instância singleton
export const remoteLogger = new RemoteLogger();

// Hook para capturar erros não tratados
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    remoteLogger.error('window.error', 'Unhandled error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.toString(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    remoteLogger.error('window.unhandledrejection', 'Unhandled promise rejection', {
      reason: event.reason?.toString(),
    });
  });
}

/**
 * Mobile Logger - Sistema de logging para PWAs mobile sem acesso ao DevTools
 *
 * Salva logs no localStorage para visualização posterior
 */

const MAX_LOGS = 200; // Máximo de logs a manter
const STORAGE_KEY = 'sindoca_mobile_logs';

class MobileLogger {
  constructor() {
    this.logs = this.loadLogs();
  }

  /**
   * Carrega logs do localStorage
   */
  loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
    return [];
  }

  /**
   * Salva logs no localStorage
   */
  saveLogs() {
    try {
      // Manter apenas os últimos MAX_LOGS
      const logsToSave = this.logs.slice(-MAX_LOGS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  }

  /**
   * Adiciona um log
   */
  log(level, category, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level, // 'info', 'warn', 'error', 'debug'
      category, // 'SW', 'Push', 'Subscribe', 'App', etc
      message,
      data: data ? JSON.stringify(data) : null,
    };

    this.logs.push(logEntry);
    this.saveLogs();

    // Também logar no console se disponível
    const consoleMethod = console[level] || console.log;
    consoleMethod(`[${category}]`, message, data || '');
  }

  /**
   * Atalhos para níveis de log
   */
  info(category, message, data) {
    this.log('info', category, message, data);
  }

  warn(category, message, data) {
    this.log('warn', category, message, data);
  }

  error(category, message, data) {
    this.log('error', category, message, data);
  }

  debug(category, message, data) {
    this.log('debug', category, message, data);
  }

  /**
   * Retorna todos os logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Limpa todos os logs
   */
  clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  /**
   * Filtra logs por categoria
   */
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Filtra logs por nível
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Retorna logs das últimas N horas
   */
  getRecentLogs(hours = 1) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.logs.filter(log => new Date(log.timestamp) > cutoff);
  }

  /**
   * Exporta logs como texto formatado
   */
  exportAsText() {
    let text = `=== SINDOCA MOBILE LOGS ===\n`;
    text += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    text += `Total de logs: ${this.logs.length}\n\n`;

    this.logs.forEach((log, index) => {
      const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
      const level = log.level.toUpperCase().padEnd(5);
      const category = log.category.padEnd(10);

      text += `[${index + 1}] ${time} ${level} [${category}] ${log.message}\n`;

      if (log.data) {
        try {
          const data = JSON.parse(log.data);
          text += `    Data: ${JSON.stringify(data, null, 2)}\n`;
        } catch (e) {
          text += `    Data: ${log.data}\n`;
        }
      }
      text += '\n';
    });

    return text;
  }

  /**
   * Copia logs para área de transferência
   */
  async copyToClipboard() {
    const text = this.exportAsText();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para navegadores antigos
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }
}

// Criar instância global
const mobileLogger = new MobileLogger();

// Exportar
if (typeof window !== 'undefined') {
  window.mobileLogger = mobileLogger;
}

export default mobileLogger;

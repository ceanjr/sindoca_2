/**
 * Mapeia erros técnicos para mensagens amigáveis ao usuário
 */

export function getFriendlyAuthError(error: any): { title: string; description: string } {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  // Log técnico para desenvolvedor
  console.error('🔴 Auth Error Details:', {
    message: error?.message,
    code: error?.code,
    status: error?.status,
    name: error?.name,
  });

  // Email não confirmado
  if (errorMessage.includes('email not confirmed') ||
      errorMessage.includes('email_not_confirmed')) {
    return {
      title: 'Confirme seu email',
      description: 'Enviamos um link de confirmação para seu email. Verifique sua caixa de entrada.',
    };
  }

  // Credenciais inválidas
  if (errorMessage.includes('invalid login credentials') ||
      errorMessage.includes('invalid credentials') ||
      errorCode === 'invalid_credentials') {
    return {
      title: 'Email ou senha incorretos',
      description: 'Verifique seus dados e tente novamente.',
    };
  }

  // Email já cadastrado
  if (errorMessage.includes('user already registered') ||
      errorMessage.includes('already registered') ||
      errorCode === 'user_already_exists') {
    return {
      title: 'Email já cadastrado',
      description: 'Já existe uma conta com este email. Que tal fazer login?',
    };
  }

  // Taxa limitada (muitas tentativas)
  if (errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorCode === 'over_request_rate_limit') {
    return {
      title: 'Calma aí!',
      description: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
    };
  }

  // Email inválido
  if (errorMessage.includes('invalid email') ||
      errorMessage.includes('email is invalid')) {
    return {
      title: 'Email inválido',
      description: 'Digite um endereço de email válido.',
    };
  }

  // Senha muito curta
  if (errorMessage.includes('password') &&
      (errorMessage.includes('short') || errorMessage.includes('weak'))) {
    return {
      title: 'Senha muito curta',
      description: 'Use pelo menos 6 caracteres.',
    };
  }

  // Sessão expirada
  if (errorMessage.includes('session') && errorMessage.includes('expired')) {
    return {
      title: 'Sessão expirada',
      description: 'Sua sessão expirou. Faça login novamente.',
    };
  }

  // Código de convite inválido
  if (errorMessage.includes('invalid invite code') ||
      errorMessage.includes('invite code')) {
    return {
      title: 'Código inválido',
      description: 'Verifique se digitou o código corretamente.',
    };
  }

  // Erro de conexão
  if (errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection')) {
    return {
      title: 'Problema de conexão',
      description: 'Verifique sua internet e tente novamente.',
    };
  }

  // Database error
  if (errorMessage.includes('database error')) {
    return {
      title: 'Ops! Algo deu errado',
      description: 'Estamos com um problema temporário. Tente novamente em instantes.',
    };
  }

  // Erro genérico
  return {
    title: 'Algo deu errado',
    description: 'Tente novamente em alguns instantes. Se o problema persistir, entre em contato.',
  };
}

/**
 * Mensagens de sucesso amigáveis
 */
export const successMessages = {
  signupSuccess: {
    title: 'Bem-vindo(a)! 🎉',
    description: 'Sua conta foi criada com sucesso!',
  },
  signupWithInvite: {
    title: 'Tudo pronto! 🎉',
    description: 'Você entrou no espaço do casal!',
  },
  loginSuccess: {
    title: 'Que bom te ver de novo! 💕',
    description: 'Entrando...',
  },
  magicLinkSent: {
    title: 'Link mágico enviado! ✨',
    description: 'Verifique seu email para continuar.',
  },
  profileUpdated: {
    title: 'Perfil atualizado! ✅',
    description: 'Suas informações foram salvas.',
  },
  workspaceCreated: {
    title: 'Espaço criado! 🏠',
    description: 'Seu espaço especial está pronto!',
  },
};

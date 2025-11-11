-- Script para limpar subscriptions antigas e forçar recriação

-- 1. Ver subscriptions atuais
SELECT
  ps.id,
  p.full_name,
  ps.endpoint,
  ps.created_at,
  ps.updated_at
FROM push_subscriptions ps
JOIN profiles p ON p.id = ps.user_id
ORDER BY ps.updated_at DESC;

-- 2. Remover todas as subscriptions antigas
-- (Os usuários vão criar novas ao fazer login)
DELETE FROM push_subscriptions;

-- 3. Verificar se limpou
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;

-- INSTRUÇÕES:
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Ambos usuários devem fazer LOGOUT
-- 3. Ambos usuários devem fazer LOGIN novamente
-- 4. Recarregar páginas (Ctrl+F5)
-- 5. Permitir notificações quando solicitado
-- 6. Executar: node test-push-local.js

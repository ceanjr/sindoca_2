-- Script para forçar logout de TODOS os usuários
-- Execute no Supabase SQL Editor

-- 1. Deletar todas as sessões ativas (força logout)
-- ATENÇÃO: Isso vai deslogar TODOS os usuários, incluindo você!
DELETE FROM auth.sessions;

-- 2. Deletar todas as refresh tokens
DELETE FROM auth.refresh_tokens;

-- 3. Limpar subscriptions antigas
DELETE FROM push_subscriptions;

-- 4. Verificar que tudo foi limpo
SELECT
  (SELECT COUNT(*) FROM auth.sessions) as sessoes_ativas,
  (SELECT COUNT(*) FROM auth.refresh_tokens) as refresh_tokens,
  (SELECT COUNT(*) FROM push_subscriptions) as subscriptions;

-- INSTRUÇÕES:
-- 1. Execute este SQL no Supabase
-- 2. Todos os usuários serão deslogados automaticamente
-- 3. Ao fazer login novamente, novas subscriptions serão criadas
-- 4. Teste: node test-push-local.js

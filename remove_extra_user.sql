-- Script para remover usuário extra do workspace
-- Execute no Supabase SQL Editor se ceanbrjr for apenas um teste

-- 1. Remover da tabela workspace_members
DELETE FROM workspace_members
WHERE user_id = 'b726a059-f7b3-4825-8e29-e4a4f93aae39'
AND workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114';

-- 2. (Opcional) Remover subscriptions do usuário se não for mais necessário
-- DELETE FROM push_subscriptions
-- WHERE user_id = 'b726a059-f7b3-4825-8e29-e4a4f93aae39';

-- 3. Verificar resultado
SELECT * FROM workspace_members
WHERE workspace_id = '99c966b1-98b9-4905-8d0d-80e357336114';

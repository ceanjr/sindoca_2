-- SQL para verificar o schema de auth e possíveis problemas

-- 1. Verificar se a tabela auth.users existe e está acessível
SELECT COUNT(*) as total_users
FROM auth.users;

-- 2. Verificar se há triggers na tabela auth.users
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 3. Verificar se há algum conflito com email único
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'auth'
  AND table_name = 'users'
  AND constraint_type = 'UNIQUE';

-- 4. Tentar criar um usuário de teste DIRETAMENTE no auth.users
-- (isso vai IGNORAR as validações do Supabase Auth)
-- CUIDADO: Isso cria um usuário SEM senha e SEM validação!
-- DELETE depois com: DELETE FROM auth.users WHERE email = 'teste-direto@example.com';
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'teste-direto@example.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Teste Direto"}'::jsonb,
  NOW(),
  NOW(),
  encode(gen_random_bytes(32), 'hex'),
  '',
  '',
  ''
);
*/

-- 5. Verificar a configuração de confirmação de email
SELECT
  key,
  value
FROM auth.config
WHERE key IN ('MAILER_AUTOCONFIRM', 'DISABLE_SIGNUP', 'EXTERNAL_EMAIL_ENABLED');

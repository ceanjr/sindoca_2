const { createClient } = require('@supabase/supabase-js');

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://wpgaxoqbrdyfihwzoxlc.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZ2F4b3FicmR5Zmlod3pveGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzUyMTAsImV4cCI6MjA3NzcxMTIxMH0.x9TeSxEmsUxCak3wc-3wb8tAq_yX2bDGnCSe1L0eK1A';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Tentar usar service role key para bypass RLS, senão usar anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey;
const isUsingServiceRole = !!supabaseServiceKey;

const supabase = createClient(supabaseUrl, supabaseKey);

if (!isUsingServiceRole) {
  console.log(
    '⚠️  Usando ANON key - pode não ver todas as subscriptions devido ao RLS'
  );
  console.log(
    '   Para ver todas, adicione SUPABASE_SERVICE_ROLE_KEY no .env.local\n'
  );
}

async function checkSubscriptions() {
  console.log('🔍 Verificando push subscriptions no banco...\n');

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (error) {
    console.error('❌ Erro ao buscar subscriptions:', error.message);
    console.error('📝 Detalhes do erro:', JSON.stringify(error, null, 2));
    console.log('\n⚠️  Isso pode ser um problema de RLS (Row Level Security).');
    console.log(
      '   O client anônimo não tem permissão para ler as subscriptions.\n'
    );
    return;
  }

  console.log(
    `✅ Total de subscriptions: ${subscriptions.length}`,
    isUsingServiceRole ? '(todas)' : '(públicas apenas)',
    '\n'
  );

  if (subscriptions.length > 0) {
    subscriptions.forEach((sub, index) => {
      console.log('Subscription #' + (index + 1) + ':');
      console.log('  User ID:', sub.user_id);
      console.log('  Endpoint:', sub.endpoint.substring(0, 60) + '...');
      console.log('  Created:', sub.created_at);
      console.log('  Updated:', sub.updated_at);
      console.log('  Keys:', Object.keys(sub.keys));
      console.log('');
    });
  } else {
    console.log('⚠️  Nenhuma subscription encontrada!');
    if (!isUsingServiceRole) {
      console.log('\n💡 DICA: As subscriptions estão protegidas por RLS.');
      console.log(
        '   Você está usando a ANON key, que só permite ver subscriptions'
      );
      console.log('   de usuários autenticados (não aplicável em scripts).\n');
      console.log(
        '   Para ver TODAS as subscriptions, adicione ao .env.local:'
      );
      console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key\n');
      console.log(
        '   ✅ Isso é CORRETO e SEGURO - significa que a RLS está funcionando!\n'
      );
    }
  }

  // Verificar usuários
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, full_name');

  if (!usersError && users) {
    console.log('\n👥 Total de usuários:', users.length);
    users.forEach((user) => {
      const userSubs = subscriptions.filter((s) => s.user_id === user.id);
      console.log(
        '  ' + (user.full_name || user.email) + ':',
        userSubs.length,
        'subscription(s)'
      );
    });
  }
}

checkSubscriptions().catch(console.error);

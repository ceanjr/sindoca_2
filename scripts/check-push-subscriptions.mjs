import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPushSetup() {
  console.log('\n🔔 Verificando Push Notifications\n');
  
  // Check VAPID keys
  console.log('1. Variáveis de Ambiente:');
  console.log('   VAPID_PUBLIC:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✅ Configurada' : '❌ Não encontrada');
  console.log('   VAPID_PRIVATE:', process.env.VAPID_PRIVATE_KEY ? '✅ Configurada' : '❌ Não encontrada');
  console.log('   INTERNAL_SECRET:', process.env.INTERNAL_API_SECRET ? '✅ Configurada' : '❌ Não encontrada');
  
  // Check users
  console.log('\n2. Usuários:');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email');
  
  if (profiles) {
    profiles.forEach(p => {
      console.log(`   - ${p.full_name} (${p.email})`);
      console.log(`     ID: ${p.id}`);
    });
  }
  
  // Check push subscriptions
  console.log('\n3. Subscriptions de Push:');
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*');
  
  if (error) {
    console.log('   ❌ Erro ao buscar subscriptions:', error.message);
  } else if (!subs || subs.length === 0) {
    console.log('   ⚠️  Nenhuma subscription encontrada!');
    console.log('   📱 Os usuários precisam permitir notificações no navegador');
  } else {
    console.log(`   ✅ ${subs.length} subscription(s) encontrada(s):\n`);
    subs.forEach((sub, i) => {
      const user = profiles?.find(p => p.id === sub.user_id);
      console.log(`   ${i + 1}. ${user?.full_name || 'Desconhecido'}`);
      console.log(`      Endpoint: ${sub.endpoint.substring(0, 50)}...`);
      console.log(`      Criado em: ${new Date(sub.created_at).toLocaleString('pt-BR')}\n`);
    });
  }
  
  // Check workspace
  console.log('4. Workspace:');
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .single();
  
  if (workspace) {
    console.log(`   Workspace ID: ${workspace.id}`);
    console.log(`   Status: ${workspace.status}`);
  }
}

checkPushSetup();

/**
 * Script para fazer upload de fotos de teste
 */
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// URLs de fotos de placeholder (casais/amor)
const TEST_PHOTO_URLS = [
  'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=800',
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
];

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  });
}

async function uploadTestPhotos() {
  // Login
  const partnerEmail = process.env.PARTNER_EMAIL;
  const partnerPassword = process.env.PARTNER_PASSWORD;

  console.log('🔐 Fazendo login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: partnerEmail,
    password: partnerPassword,
  });

  if (authError || !authData.user) {
    console.error('❌ Erro ao fazer login:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log(`✅ Login: ${userId}\n`);

  // Buscar workspace
  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .single();

  if (!members) {
    console.error('❌ Usuário não tem workspace. Execute setup-workspace.js primeiro.');
    return;
  }

  const workspaceId = members.workspace_id;
  console.log(`✅ Workspace: ${workspaceId}\n`);

  // Upload das fotos
  for (let i = 0; i < TEST_PHOTO_URLS.length; i++) {
    const photoUrl = TEST_PHOTO_URLS[i];
    console.log(`📥 Baixando foto ${i + 1}/${TEST_PHOTO_URLS.length}...`);

    try {
      const imageBuffer = await downloadImage(photoUrl);
      console.log(`   ✅ Baixado: ${(imageBuffer.length / 1024).toFixed(1)}KB`);

      // Upload para Supabase Storage
      const timestamp = Date.now();
      const fileName = `photos/${workspaceId}/${timestamp}-test${i + 1}.jpg`;

      console.log(`   📤 Enviando para storage...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, imageBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error(`   ❌ Erro no upload:`, uploadError);
        continue;
      }

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      console.log(`   🔗 URL: ${urlData.publicUrl.substring(0, 60)}...`);

      // Criar registro no banco
      console.log(`   💾 Salvando no banco...`);
      const { error: dbError } = await supabase
        .from('content')
        .insert({
          workspace_id: workspaceId,
          author_id: userId,
          type: 'photo',
          category: 'momentos',
          title: `test${i + 1}`,
          description: `Foto de teste ${i + 1}`,
          storage_path: fileName,
          data: {
            url: urlData.publicUrl,
            size: imageBuffer.length,
            mime_type: 'image/jpeg',
            compressed: true,
            original_name: `test${i + 1}.jpg`
          }
        });

      if (dbError) {
        console.error(`   ❌ Erro ao salvar no banco:`, dbError);
        continue;
      }

      console.log(`   ✅ Foto ${i + 1} completa!\n`);
    } catch (error) {
      console.error(`   ❌ Erro:`, error.message);
    }
  }

  console.log('🎉 Upload concluído!');
}

uploadTestPhotos().catch(console.error);

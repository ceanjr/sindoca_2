# 🔒 Corrigir Permissões do Bucket 'gallery'

## ❌ Problema Atual

```
StorageApiError: new row violates row-level security policy
```

O bucket 'gallery' existe, mas as políticas RLS (Row Level Security) estão bloqueando o upload.

## ✅ Solução: Configurar Políticas RLS

### Passo 1: Acessar o Supabase Dashboard

1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **"Storage"**
4. Clique no bucket **"gallery"**
5. Clique na aba **"Policies"**

### Passo 2: Adicionar Políticas

Você pode adicionar as políticas de duas formas:

#### Opção A: Usar a Interface (Mais Fácil)

1. Clique em **"New Policy"**
2. Selecione **"For full customization"**
3. Adicione cada política abaixo

#### Opção B: Executar SQL Diretamente

1. Vá para **SQL Editor** no menu lateral
2. Execute o seguinte SQL:

```sql
-- 1. Permitir LEITURA pública de todas as fotos
CREATE POLICY "Fotos são públicas para leitura"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery');

-- 2. Permitir UPLOAD de fotos (usuários autenticados)
CREATE POLICY "Usuários podem fazer upload de fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Permitir ATUALIZAÇÃO de fotos próprias
CREATE POLICY "Usuários podem atualizar suas fotos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Permitir DELEÇÃO de fotos próprias
CREATE POLICY "Usuários podem deletar suas fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Explicação das Políticas

1. **SELECT (Leitura)**: Permite que qualquer pessoa (mesmo não autenticada) veja as fotos
2. **INSERT (Upload)**: Permite que usuários autenticados façam upload apenas em pastas com seu próprio user_id
3. **UPDATE**: Permite atualizar apenas fotos na pasta do próprio usuário
4. **DELETE**: Permite deletar apenas fotos da pasta do próprio usuário

### Passo 3: Testar Upload

Após configurar as políticas, execute:

```bash
node upload-test-photos.js
```

Deve funcionar agora! ✅

### Passo 4: Verificar no App

1. Acesse http://localhost:3000/galeria
2. As fotos devem aparecer automaticamente
3. Teste fazer upload de novas fotos pela interface

## 🔍 Verificar Configuração

Execute o script de debug para verificar:

```bash
node debug-photos.js
```

Deve mostrar:
- ✅ Workspace ID encontrado
- ✅ Fotos no banco de dados
- ✅ Arquivos no bucket 'gallery'

## 🐛 Troubleshooting

### Se ainda não funcionar:

1. **Verifique se o bucket é público:**
   - No Supabase Dashboard > Storage > gallery
   - Deve estar marcado como "Public"
   - Se não estiver, edite o bucket e marque como público

2. **Verifique as políticas:**
   - No Supabase Dashboard > Storage > gallery > Policies
   - Deve ter as 4 políticas listadas acima
   - Se não tiver, adicione-as

3. **Verifique a estrutura de pastas:**
   - Os arquivos devem estar em: `userId/timestamp-filename.jpg`
   - Exemplo: `d92c396b-db11-45f8-a45f-47ff5152484a/1234567890-test1.jpg`

4. **Verifique o usuário no workspace:**
   ```bash
   node setup-workspace.js
   ```

## 📝 Notas Importantes

- As políticas RLS protegem os uploads: cada usuário só pode fazer upload em sua própria pasta
- A leitura é pública: qualquer pessoa pode ver as fotos (ideal para um site de casal)
- A deleção é protegida: cada usuário só pode deletar suas próprias fotos

## ✅ Após Configurar

Todos os recursos da galeria devem funcionar:
- ✅ Upload de fotos
- ✅ Visualização de fotos
- ✅ Edição de legendas
- ✅ Favoritar fotos
- ✅ Deletar fotos
- ✅ Lightbox (visualização em tela cheia)
- ✅ Paginação (Load More)


# 🔧 Configuração do Supabase para Galeria de Fotos

## ❌ Problema Identificado

O bucket de storage 'photos' não existe no Supabase, por isso as fotos não carregam.

## ✅ Solução: Criar Bucket e Configurar

### Passo 1: Acessar o Supabase Dashboard

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto: `wpgaxoqbrdyfihwzoxlc`

### Passo 2: Criar o Bucket 'photos'

1. No menu lateral, clique em **"Storage"**
2. Clique no botão **"New bucket"**
3. Preencha:
   - **Name:** `photos`
   - **Public bucket:** ✅ **Marcar como público**
   - **File size limit:** 50MB (ou conforme necessário)
   - **Allowed MIME types:** `image/*`
4. Clique em **"Create bucket"**

### Passo 3: Configurar Políticas de Acesso (RLS)

#### 3.1. Permitir Upload (INSERT)

```sql
-- Política para permitir upload de fotos
CREATE POLICY "Usuários podem fazer upload de fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 3.2. Permitir Leitura Pública (SELECT)

```sql
-- Política para leitura pública de fotos
CREATE POLICY "Fotos são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');
```

#### 3.3. Permitir Deleção (DELETE)

```sql
-- Política para deletar fotos próprias
CREATE POLICY "Usuários podem deletar suas fotos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Passo 4: Verificar Tabelas Existentes

Certifique-se de que as seguintes tabelas existem:

#### 4.1. Tabela `workspaces`

```sql
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver workspace"
ON workspaces FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);
```

#### 4.2. Tabela `workspace_members`

```sql
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver seu workspace"
ON workspace_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

#### 4.3. Tabela `content` (para fotos)

```sql
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  storage_path TEXT,
  data JSONB,
  category TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver content do workspace"
ON content FOR SELECT
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Membros podem inserir content"
ON content FOR INSERT
TO authenticated
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Membros podem deletar content"
ON content FOR DELETE
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Membros podem atualizar content"
ON content FOR UPDATE
TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id
    FROM workspace_members
    WHERE user_id = auth.uid()
  )
);
```

#### 4.4. Tabela `reactions` (para favoritos)

```sql
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_id, user_id, type)
);

-- RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros podem ver reactions"
ON reactions FOR SELECT
TO authenticated
USING (
  content_id IN (
    SELECT c.id
    FROM content c
    INNER JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
    WHERE wm.user_id = auth.uid()
  )
);

CREATE POLICY "Membros podem inserir reactions"
ON reactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Membros podem deletar suas reactions"
ON reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

### Passo 5: Executar Scripts de Configuração

Depois de criar o bucket, execute os scripts:

```bash
# 1. Adicionar usuário ao workspace
node setup-workspace.js

# 2. Fazer upload de fotos de teste
node upload-test-photos.js
```

### Passo 6: Verificar

1. Acesse a galeria no app: http://localhost:3000/galeria
2. As fotos devem aparecer automaticamente
3. Teste fazer upload de novas fotos pela interface

## 🎉 Pronto!

Após seguir esses passos, a galeria de fotos deve funcionar perfeitamente!

## 📝 Notas Importantes

- O bucket 'photos' deve ser **público** para permitir acesso direto às imagens
- As políticas RLS garantem que apenas membros do workspace podem manipular fotos
- O structure storage_path deve ser: `userId/timestamp-filename.jpg`
- As URLs públicas são geradas automaticamente pelo Supabase

## 🐛 Troubleshooting

Se ainda tiver problemas:

1. Execute `node debug-photos.js` para verificar o estado do banco
2. Verifique se o usuário está no workspace_members
3. Verifique se o bucket 'photos' existe e é público
4. Verifique as políticas RLS no Supabase Dashboard


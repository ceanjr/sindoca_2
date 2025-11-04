# ⚡ Configuração Rápida

## 1. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon

# Sistema de Convite (IMPORTANTE!)
NEXT_PUBLIC_INVITE_SECRET=palavra_secreta_compartilhada
NEXT_PUBLIC_PARTNER_EMAIL=email_da_sua_namorada@exemplo.com
NEXT_PUBLIC_PARTNER_PASSWORD=senha_dela_no_supabase
```

## 2. Aplique a Migration do Workspace Único

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo do arquivo: `supabase/migrations/004_single_workspace.sql`
5. Clique em **Run**

## 3. Crie os Usuários no Supabase

### Opção A: Via Dashboard do Supabase
1. Vá em **Authentication** → **Users**
2. Clique em **Add User**
3. Crie 2 usuários:
   - Seu email/senha
   - Email/senha da sua namorada (use os mesmos que configurou no `.env.local`)

### Opção B: Via SQL (mais rápido)
```sql
-- Substitua pelos emails e senhas reais
-- As senhas serão hasheadas automaticamente pelo Supabase
```

## 4. Teste o Sistema

### Login Normal (Você):
1. Acesse: `http://localhost:3000/auth/login`
2. Entre com seu email/senha
3. Deve redirecionar para `/` (home)

### Link de Convite (Ela):
1. Compartilhe o link: `http://localhost:3000/auth/join/amor`
2. Ela digita a palavra-chave secreta
3. Entra automaticamente e vai para home

## 5. Estrutura Atual

```
✅ Login simplificado
✅ Callback direto para home
✅ Sistema de convite com palavra-chave
✅ Workspace único automático
✅ Dashboard redireciona para home
❌ Signup removido
❌ Onboarding removido
```

## Próximos Passos

Agora você pode focar em:
- Personalizar as seções do site
- Adicionar funcionalidades interativas
- Implementar upload de fotos/memórias
- Customizar o design

## Estrutura de Rotas

```
/                    → Home (página principal)
/auth/login          → Login (email/senha ou magic link)
/auth/join/[code]    → Link de convite (palavra-chave)
/auth/callback       → Callback OAuth (automático)
/dashboard           → Redireciona para home
/home                → (seu conteúdo antigo)
/galeria             → Galeria de fotos
/mensagens           → Mensagens
/amor                → Seção amor
/musica              → Músicas
/conquistas          → Conquistas
/surpresas           → Surpresas
/legado              → Legado
```

## Dicas

1. **Palavra-chave forte**: Use algo que só vocês dois saibam
2. **Link bonito**: Use `/auth/join/amor` ou `/auth/join/nossoamor`
3. **Magic Link**: Opção sem senha, envia link por email
4. **Segurança**: Não commite o `.env.local` no git

## Troubleshooting

### "Palavra-chave incorreta"
- Verifique se a variável `NEXT_PUBLIC_INVITE_SECRET` está configurada
- A comparação é case-insensitive (maiúsculas/minúsculas não importam)

### "Erro ao autenticar"
- Verifique se o email/senha do parceiro estão corretos no `.env.local`
- Confirme que o usuário foi criado no Supabase

### "Redirecionando infinitamente"
- Limpe os cookies do navegador
- Verifique se a migration do workspace foi aplicada

### Build falhando
- Execute: `npm run build`
- Se houver erros TypeScript, corrija-os antes de fazer deploy

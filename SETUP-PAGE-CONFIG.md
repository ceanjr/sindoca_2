# Sistema de Controle de Acesso a Páginas

Este sistema permite ao administrador (celiojunior0110@gmail.com) controlar quais páginas estão acessíveis no site através de um painel de administração.

## 🚀 Configuração Inicial

### 1. Criar a Tabela no Supabase

Execute o SQL contido no arquivo `supabase-page-config.sql` no SQL Editor do Supabase Dashboard:

```bash
# Copie e cole o conteúdo de supabase-page-config.sql no Supabase SQL Editor
```

Isso irá:
- Criar a tabela `page_config`
- Inserir as configurações padrão para todas as páginas
- Configurar as políticas RLS (Row Level Security)
- Criar triggers para atualização automática de timestamps

### 2. Verificar a Criação

Após executar o SQL, verifique no Supabase Dashboard:
1. Vá para **Table Editor**
2. Procure pela tabela `page_config`
3. Você deve ver 8 registros (uma para cada página)

## 📋 Funcionalidades

### Proteção de Rotas
- ✅ Todas as rotas (exceto `/auth/login` e `/auth/join`) exigem autenticação
- ✅ Middleware Next.js protege automaticamente as rotas
- ✅ Redirecionamento para login se não autenticado

### Painel de Administração
- ✅ Botão de configuração (ícone de engrenagem) visível apenas no sidebar desktop
- ✅ Botão aparece apenas para o email `celiojunior0110@gmail.com`
- ✅ Modal com toggles para ativar/desativar cada página
- ✅ Sincronização em tempo real via Supabase Realtime

### Páginas Desativadas
Quando uma página é desativada:
- 🔒 Link fica visualmente disabled (opacidade 40%, cursor not-allowed)
- 🔒 Não é possível clicar no link
- 🔒 Tooltip mostra "(Desativada)"
- 🔒 Funciona tanto em desktop quanto mobile

## 🎯 Como Usar

### Como Admin

1. **Faça login** com o email `celiojunior0110@gmail.com`
2. **No desktop**, você verá um botão com ícone de engrenagem no sidebar (parte inferior)
3. **Clique no botão** para abrir o modal de configuração
4. **Use os toggles** para ativar/desativar páginas:
   - Verde = Página ativa
   - Cinza = Página desativada
5. **As mudanças são aplicadas instantaneamente** para todos os usuários

### Como Usuário Normal

- Páginas ativas: Funcionam normalmente
- Páginas desativadas: Aparecem no menu mas não podem ser clicadas
- O ícone fica esmaecido e mostra "(Desativada)" no tooltip

## 🗂️ Estrutura de Arquivos

```
/
├── middleware.ts                    # Middleware Next.js (proteção de rotas)
├── lib/supabase/middleware.ts       # Helper do Supabase para middleware
├── hooks/usePageConfig.jsx          # Hook para gerenciar páginas
├── components/
│   ├── AdminModal.jsx              # Modal de administração
│   ├── NavigationSidebar.jsx       # Sidebar desktop (com botão admin)
│   └── Navigation.jsx              # Navegação mobile/scroll
└── supabase-page-config.sql        # Script SQL para criar tabela
```

## 🔧 Configuração de Páginas

Estrutura da tabela `page_config`:

| Campo      | Tipo    | Descrição                          |
|------------|---------|------------------------------------|
| id         | UUID    | ID único                          |
| page_id    | TEXT    | Identificador da página (único)   |
| label      | TEXT    | Nome da página                    |
| is_active  | BOOLEAN | Se a página está ativa            |
| icon       | TEXT    | Nome do ícone Lucide              |
| path       | TEXT    | Caminho da rota                   |
| created_at | TIMESTAMP | Data de criação                 |
| updated_at | TIMESTAMP | Data da última atualização      |

### Páginas Disponíveis

1. **inicio** - Início (/)
2. **galeria** - Galeria (/galeria)
3. **amor** - O Que Amo (/amor)
4. **musica** - Música (/musica)
5. **conquistas** - Conquistas (/conquistas)
6. **mensagens** - Mensagens (/mensagens)
7. **surpresas** - Surpresas (/surpresas)
8. **legado** - Legado (/legado)

## 🔐 Segurança

### Row Level Security (RLS)

**Leitura (SELECT):**
- ✅ Qualquer pessoa pode ler as configurações
- Necessário para que os usuários vejam quais páginas estão ativas

**Atualização (UPDATE):**
- ✅ Apenas `celiojunior0110@gmail.com` pode atualizar
- Verificado através do JWT token do Supabase Auth

**Inserção/Deleção:**
- ❌ Não permitido para ninguém
- As páginas são criadas via SQL na setup inicial

## 🐛 Troubleshooting

### O botão admin não aparece
- Verifique se você está logado com `celiojunior0110@gmail.com`
- Verifique se está em desktop (botão não aparece em mobile)
- Abra o console do navegador e verifique `isAdmin` no hook

### Páginas desativadas ainda funcionam
- Verifique se a tabela `page_config` foi criada corretamente
- Verifique se o `is_active` está como `false` no banco
- Force refresh (Ctrl+Shift+R) no navegador

### Erro ao atualizar status de página
- Verifique as políticas RLS no Supabase
- Verifique se o email no token JWT está correto
- Verifique logs no console do navegador

### Middleware não está protegendo rotas
- Verifique se o arquivo `middleware.ts` está na raiz do projeto
- Restart o servidor de desenvolvimento
- Verifique o `matcher` no `middleware.ts`

## 📝 Notas Importantes

1. **Sincronização em Tempo Real**: Quando você desativa uma página, todos os usuários online veem a mudança instantaneamente
2. **Desktop Only**: O botão admin só aparece no sidebar desktop (não mobile)
3. **Página Início**: Recomenda-se sempre manter a página "início" ativa
4. **Cache**: Pode levar alguns segundos para as mudanças se refletirem devido ao cache do navegador

## 🚀 Deploy

Ao fazer deploy:
1. Certifique-se de executar o SQL de setup no banco de produção
2. Verifique as variáveis de ambiente do Supabase
3. Teste a autenticação e o middleware
4. Teste o painel admin em produção

## 💡 Dicas

- Use o painel admin para "esconder" páginas que estão em desenvolvimento
- Desative páginas temporariamente durante manutenção
- Monitore as mudanças através dos timestamps `updated_at`
- Crie backups da configuração antes de fazer mudanças significativas

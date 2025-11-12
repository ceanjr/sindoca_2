# 🎉 Sistema de Reações - Setup

Sistema de reações estilo WhatsApp implementado com sucesso!

## ✅ Arquivos Criados

### Componentes UI
- `components/ui/ReactionMenu.jsx` - Menu de emojis com long-press e hover
- `components/ui/ReactableContent.jsx` - Wrapper para tornar conteúdo reativo
- `components/ui/ReactionDisplay.jsx` - Exibição de contadores de reações
- `components/ui/INTEGRATION_GUIDE.md` - Guia completo de integração

### Hooks
- `hooks/useReactions.js` - Hook para gerenciar reações em tempo real

### APIs
- `lib/api/reactions.js` - Helpers para adicionar/remover reações
- `app/api/reactions/notify/route.ts` - API route para enviar notificações push

### Database
- `supabase/migrations/014_add_emoji_reactions.sql` - Migration para suporte a emoji reactions

## 📝 Próximos Passos

### 1. Aplicar Migration no Banco de Dados

#### Opção A: Supabase Cloud (via Dashboard)
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em "SQL Editor"
3. Copie o conteúdo de `supabase/migrations/014_add_emoji_reactions.sql`
4. Cole e execute no SQL Editor

#### Opção B: Supabase CLI (local ou produção)
```bash
# Se estiver usando Supabase local
supabase db push

# Ou aplicar migration específica
supabase migration up --db-url "sua-connection-string"
```

### 2. Testar a Funcionalidade

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse a página `/musica` (já integrada com reações)

3. Teste as interações:
   - **Mobile:** Pressione e segure em uma música adicionada pelo parceiro (500ms)
   - **Desktop:** Mantenha o cursor sobre a música por 2 segundos
   - Clique em um emoji para reagir
   - Clique no mesmo emoji novamente para remover

4. Verifique as notificações push (se habilitadas)

### 3. Integrar em Outras Seções

As seguintes seções ainda precisam ser integradas:

#### Galeria (Fotos)
Editar: `components/sections/GallerySection.jsx`

```jsx
import ReactableContent from '../ui/ReactableContent';
import ReactionDisplay from '../ui/ReactionDisplay';

// Envolver cada foto com ReactableContent
<ReactableContent
  contentId={photo.id}
  contentType="photo"
  contentTitle={photo.caption}
  authorId={photo.author_id}
  url="/galeria"
>
  {/* Conteúdo da foto */}
</ReactableContent>
```

#### Razões
Editar: `components/sections/LoveReasonsSection.jsx`

```jsx
import ReactableContent from '../ui/ReactableContent';
import ReactionDisplay from '../ui/ReactionDisplay';

// Envolver cada razão com ReactableContent
<ReactableContent
  contentId={reason.id}
  contentType="love_reason"
  contentTitle={reason.title}
  authorId={reason.author_id}
  url="/razoes"
>
  {/* Conteúdo da razão */}
</ReactableContent>
```

Consulte `components/ui/INTEGRATION_GUIDE.md` para exemplos completos!

## 🎨 Customização

### Alterar Emojis Disponíveis
Edite o array em `components/ui/ReactionMenu.jsx`:

```jsx
const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🤔'];
// Adicione ou remova emojis conforme necessário
```

### Ajustar Tempos de Interação
Em `components/ui/ReactionMenu.jsx`:

```jsx
// Long press (mobile) - linha ~88
setTimeout(() => {
  setIsOpen(true);
}, 500); // Altere de 500ms para o tempo desejado

// Hover delay (desktop) - linha ~123
const timeout = setTimeout(() => {
  setIsOpen(true);
}, 2000); // Altere de 2000ms (2s) para o tempo desejado
```

### Customizar Mensagens de Notificação
Edite os mapeamentos em `app/api/reactions/notify/route.ts`:

```typescript
const contentTypeNames: Record<string, string> = {
  music: 'música',
  photo: 'foto',
  love_reason: 'razão',
  // Adicione novos tipos aqui
};
```

## 🧪 Verificação

Execute os seguintes comandos para garantir que tudo está funcionando:

```bash
# Build de produção
npm run build

# Iniciar servidor
npm run start
```

## 📊 Estrutura do Banco de Dados

A tabela `reactions` agora suporta:

```sql
reactions (
  id UUID,
  content_id UUID,
  user_id UUID,
  type TEXT, -- 'emoji', 'favorite', 'comment', 'like'
  emoji TEXT, -- Novo campo para armazenar emoji
  comment TEXT,
  created_at TIMESTAMPTZ
)
```

Constraints:
- Um usuário pode ter apenas UMA reação emoji por conteúdo
- Se reagir novamente, substitui a reação anterior
- Para remover, basta reagir com o mesmo emoji

## 🔔 Notificações

As notificações são enviadas automaticamente quando:
- Um usuário reage ao conteúdo de outro usuário
- A notificação mostra: emoji, nome do usuário, tipo de conteúdo

Formato: `"Fulano reagiu com ❤️ à sua música"`

## 🐛 Troubleshooting

### Reações não aparecem
- Verifique se a migration foi aplicada corretamente
- Confirme que RLS (Row Level Security) está configurado

### Notificações não chegam
- Verifique se o push está habilitado no navegador
- Confirme que a API route `/api/reactions/notify` está acessível
- Verifique os logs do console do navegador

### Menu não abre no mobile
- Certifique-se de que o evento `touchstart` não está sendo bloqueado
- Verifique se não há conflitos com outros event listeners

### Menu não abre no desktop
- Confirme que o hover está sendo detectado (2 segundos de delay)
- Verifique se não há elementos sobrepondo o trigger

## 📚 Recursos

- Guia completo: `components/ui/INTEGRATION_GUIDE.md`
- Hook de reações: `hooks/useReactions.js`
- Exemplo integrado: `components/sections/MusicSection.jsx` (linhas com ReactableContent e ReactionDisplay)

## 🚀 Status

✅ Sistema implementado
✅ Build testado com sucesso
✅ MusicSection integrado
⏳ Aguardando aplicação da migration
⏳ Integração pendente: GallerySection, LoveReasonsSection

---

**Desenvolvido para o Sindoca Love Site** 💕

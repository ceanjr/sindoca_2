# Guia de Integração do Sistema de Reações

Este guia mostra como integrar o sistema de reações com emojis (estilo WhatsApp) nas suas seções.

## Componentes Disponíveis

### 1. ReactableContent (Recomendado)
Componente wrapper que adiciona automaticamente o menu de reações e gerencia notificações.

```jsx
import ReactableContent from '@/components/ui/ReactableContent';

<ReactableContent
  contentId={item.id}
  contentType="music" // ou "photo", "love_reason", etc
  contentTitle={item.title}
  authorId={item.author_id}
  url="/musica" // URL para notificação
  position="auto" // ou "top", "bottom"
>
  {/* Seu conteúdo aqui */}
  <div className="card">
    <h3>{item.title}</h3>
    {/* ... */}
  </div>
</ReactableContent>
```

### 2. ReactionMenu (Avançado)
Menu de reações standalone, para controle manual.

```jsx
import ReactionMenu from '@/components/ui/ReactionMenu';
import { useReactions } from '@/hooks/useReactions';

const { myReaction, toggleReaction } = useReactions(contentId);

<ReactionMenu
  contentId={contentId}
  currentReaction={myReaction}
  onReact={async (emoji) => {
    await toggleReaction(emoji);
  }}
  position="auto"
/>
```

### 3. ReactionDisplay
Exibe contador de reações recebidas.

```jsx
import ReactionDisplay from '@/components/ui/ReactionDisplay';

<ReactionDisplay contentId={item.id} className="mt-2" />
```

## Exemplos de Integração

### MusicSection (exemplo completo)

```jsx
import ReactableContent from '@/components/ui/ReactableContent';
import ReactionDisplay from '@/components/ui/ReactionDisplay';

// Dentro do map de tracks:
{tracks.map((track) => (
  <ReactableContent
    key={track.id}
    contentId={track.id}
    contentType="music"
    contentTitle={track.title}
    authorId={track.author_id}
    url="/musica"
    position="auto"
  >
    <div className="track-card">
      {/* Conteúdo da música */}
      <img src={track.data.album_cover} alt={track.title} />
      <div>
        <h3>{track.title}</h3>
        <p>{track.description}</p>
      </div>
      
      {/* Mostrar reações recebidas */}
      <ReactionDisplay contentId={track.id} />
    </div>
  </ReactableContent>
))}
```

### GallerySection (fotos)

```jsx
import ReactableContent from '@/components/ui/ReactableContent';

{photos.map((photo) => (
  <ReactableContent
    key={photo.id}
    contentId={photo.id}
    contentType="photo"
    contentTitle={photo.caption}
    authorId={photo.author_id}
    url="/galeria"
  >
    <div className="photo-card">
      <img src={photo.storage_path} alt={photo.caption} />
      {photo.caption && <p>{photo.caption}</p>}
    </div>
  </ReactableContent>
))}
```

### LoveReasonsSection (razões)

```jsx
import ReactableContent from '@/components/ui/ReactableContent';

{reasons.map((reason) => (
  <ReactableContent
    key={reason.id}
    contentId={reason.id}
    contentType="love_reason"
    contentTitle={reason.title}
    authorId={reason.author_id}
    url="/razoes"
  >
    <div className="reason-card">
      <h3>{reason.title}</h3>
      <p>{reason.description}</p>
    </div>
  </ReactableContent>
))}
```

## Tipos de Conteúdo Suportados

Os seguintes tipos estão mapeados para notificações em português:

- `music` → "música"
- `photo` → "foto"
- `love_reason` → "razão"
- `message` → "mensagem"
- `story` → "história"
- `achievement` → "conquista"
- `voice` → "áudio"

## Emojis Disponíveis

Por padrão: 👍 ❤️ 😂 😮 😢 🙏 🤔

Para personalizar, edite o array `AVAILABLE_EMOJIS` em:
`/components/ui/ReactionMenu.jsx`

## Comportamento

### Mobile
- Long press (500ms) abre o menu
- Tap no emoji adiciona/remove reação
- Haptic feedback ao abrir menu (se disponível)

### Desktop
- Hover por 2 segundos abre o menu
- Click no emoji adiciona/remove reação

### Notificações
- Apenas o autor do conteúdo recebe notificação
- Notificação no formato: "Fulano reagiu com ❤️ à sua música"
- Click na notificação leva para a página do conteúdo

## Banco de Dados

A migration `014_add_emoji_reactions.sql` já foi criada.

Execute para aplicar:
```bash
# Se usando Supabase local
supabase db push

# Se usando Supabase cloud
# Copie o conteúdo da migration e execute no SQL Editor
```

## Hooks Disponíveis

### useReactions(contentId)

```js
const {
  reactions,        // Array de todas as reações
  myReaction,       // Emoji da minha reação (ou null)
  loading,          // Estado de carregamento
  reactionCounts,   // Objeto { emoji: count }
  addReaction,      // (emoji) => Promise
  removeReaction,   // () => Promise
  toggleReaction,   // (emoji) => Promise
  refresh,          // () => Promise
} = useReactions(contentId);
```

## APIs

### addReactionWithNotification
```js
import { addReactionWithNotification } from '@/lib/api/reactions';

await addReactionWithNotification(contentId, userId, emoji, {
  type: 'music',
  title: 'My Song',
  authorId: 'author-uuid',
  url: '/musica',
});
```

### removeReactionWithNotification
```js
import { removeReactionWithNotification } from '@/lib/api/reactions';

await removeReactionWithNotification(contentId, userId);
```

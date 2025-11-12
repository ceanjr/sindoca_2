# 🚀 Quick Start - Sistema de Reações

Guia rápido para começar a usar as reações em 5 minutos!

## ⚡ Setup Rápido (3 passos)

### 1. Aplicar Migration no Banco 📊

**Copie e execute no Supabase SQL Editor:**

```sql
-- Cole o conteúdo completo de:
-- supabase/migrations/014_add_emoji_reactions.sql
```

### 2. Iniciar o Servidor 🖥️

```bash
npm run dev
```

### 3. Testar! 🎮

Acesse: http://localhost:3000/musica

**Mobile:**
- Pressione e segure 500ms em uma música do parceiro
- Menu de emojis aparece
- Toque no emoji

**Desktop:**
- Passe o mouse por 2 segundos sobre uma música do parceiro
- Menu de emojis aparece
- Clique no emoji

## 🎯 Onde Usar

### Já Integrado ✅

```
/musica     - Músicas (MusicSection)
/galeria    - Fotos (GallerySection)  
/razoes     - Razões (LoveReasonsSection)
```

### Para Integrar em Novas Seções

```jsx
import ReactableContent from '@/components/ui/ReactableContent';
import ReactionDisplay from '@/components/ui/ReactionDisplay';

// 1. Envolver o componente
<ReactableContent
  contentId={item.id}
  contentType="music"
  contentTitle={item.title}
  authorId={item.author_id}
  url="/musica"
>
  {/* Seu componente */}
</ReactableContent>

// 2. Exibir contador (opcional)
<ReactionDisplay contentId={item.id} />
```

## 🎨 Emojis Disponíveis

```
👍 ❤️ 😂 😮 😢 🙏 🤔
```

**Para mudar:**
Edite `components/ui/ReactionMenu.jsx` linha 5

## 🔔 Notificações

Automáticas! Quando alguém reage, o autor recebe:

```
🎵 Nova reação!
Fulano reagiu com ❤️ à sua música "Nome da Música"
```

## 📱 Comportamento

| Ação | Resultado |
|------|-----------|
| Reagir pela 1ª vez | Adiciona emoji |
| Reagir com outro emoji | Substitui emoji |
| Reagir com mesmo emoji | Remove reação |
| Reagir ao próprio conteúdo | Menu não aparece |

## 🧪 Checklist de Teste

- [ ] Menu abre no mobile (long press 500ms)
- [ ] Menu abre no desktop (hover 2s)
- [ ] Emoji aparece após clicar
- [ ] Contador de reações é exibido
- [ ] Reação aparece em tempo real para o parceiro
- [ ] Notificação é recebida
- [ ] Não posso reagir ao meu próprio conteúdo

## 🆘 Problemas Comuns

### Menu não abre?
- **Mobile:** Segure por pelo menos 500ms
- **Desktop:** Mantenha mouse parado por 2s
- Verifique console do navegador

### Reação não salva?
- Migration foi aplicada?
- Console mostra erros?

### Notificação não chega?
- Push habilitado no navegador?
- Verifique `/api/reactions/notify`

## 📚 Documentação Completa

- `FEATURE_REACTIONS_SUMMARY.md` - Resumo completo
- `REACTIONS_SETUP.md` - Instruções detalhadas
- `components/ui/INTEGRATION_GUIDE.md` - Exemplos de código

## ⚙️ Arquivos Importantes

```
components/
  ui/
    ├── ReactionMenu.jsx        # Menu de emojis
    ├── ReactableContent.jsx    # Wrapper principal
    └── ReactionDisplay.jsx     # Contador de reações

hooks/
  └── useReactions.js           # Hook de gerenciamento

lib/
  api/
    └── reactions.js            # Funções helper

app/
  api/
    reactions/
      notify/
        └── route.ts            # API de notificações

supabase/
  migrations/
    └── 014_add_emoji_reactions.sql  # Migration
```

## 🎉 Pronto!

Seu sistema de reações está funcionando! 

Para mais detalhes, consulte `FEATURE_REACTIONS_SUMMARY.md`

---

💡 **Dica:** Comece testando nas seções já integradas (música, galeria, razões) antes de adicionar em novos lugares!

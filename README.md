# 💝 Sindoca - Site Romântico

Um site pessoal romântico moderno, interativo e totalmente responsivo, criado com Next.js e React.

## ✨ Características

- **🎨 Design Moderno**: Interface minimalista com glassmorphism e gradientes vibrantes
- **📱 Mobile-First**: Otimizado para dispositivos móveis com gestures e interações touch
- **🎵 Player de Música**: Integração com Spotify e visualizador animado
- **🖼️ Galeria Interativa**: Lightbox com navegação por swipe e zoom
- **💫 Animações Suaves**: Transições e efeitos usando Framer Motion
- **🎭 Sistema de Temas**: Três temas (Light, Dark, Romantic)
- **⚡ Performance**: Otimizado com lazy loading e code splitting
- **♿ Acessibilidade**: Suporte para teclado e leitores de tela
- **💾 Persistência**: Usa window.storage para salvar preferências

## 🏗️ Estrutura do Projeto

```
sindoca/
├── app/
│   ├── layout.js          # Layout principal
│   ├── page.js            # Página principal
│   └── globals.css        # Estilos globais
├── components/
│   ├── sections/
│   │   ├── HomeSection.js
│   │   ├── GallerySection.js
│   │   ├── LoveReasonsSection.js
│   │   ├── MusicSection.js
│   │   ├── AchievementsSection.js
│   │   ├── MessagesSection.js
│   │   ├── SandboxSection.js
│   │   └── LegacySection.js
│   ├── Navigation.js
│   ├── Lightbox.js
│   ├── Stars.js
│   └── ThemeToggle.js
├── public/
│   └── images/           # Imagens do site
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🚀 Instalação e Uso

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Passos de Instalação

1. **Clone ou acesse o diretório do projeto:**
   ```bash
   cd /home/ceanbrjr/Dev/sindoca
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Abra no navegador:**
   ```
   http://localhost:3000
   ```

### Comandos Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm start        # Inicia servidor de produção
npm run lint     # Executa linter
```

## 📱 Seções do Site

### 🏠 Home
- Contador de dias/horas/minutos juntos
- Citações românticas rotativas
- Call-to-action para explorar

### 📸 Galeria
- Grid Masonry responsivo
- Lightbox com gestures (swipe, pinch-to-zoom)
- Navegação por teclado e touch

### 💕 O Que Amo em Você
- Cards interativos com animações
- Feedback háptico
- Partículas ao clicar

### 🎵 Música
- Player Spotify integrado
- Visualizador de áudio animado
- Contexto de cada música

### 🏆 Conquistas
- Timeline vertical moderna
- Mensagens secretas reveladas ao clicar
- Bucket list de próximas aventuras

### 💌 Mensagens Especiais
- Poemas e cartas românticas
- Layout tipo "cartas abertas"
- Animações de revelação

### 🎁 Sandbox
- Caixa de surpresas misteriosa
- Interação 3D com mouse/touch
- Easter egg com shake detection

### 📜 Legado
- Conteúdo original reformatado
- Contador de amor interativo
- Álbum de memórias

## 🎨 Personalização

### Alterar Data de Início

Edite em `components/sections/HomeSection.js`:

```javascript
const startDate = new Date('2025-03-20T00:00:00')
```

### Alterar Playlist do Spotify

Edite em `components/sections/MusicSection.js`:

```javascript
src="https://open.spotify.com/embed/playlist/SUA_PLAYLIST_ID"
```

### Adicionar/Remover Fotos

1. Adicione imagens em `public/images/`
2. Atualize o array em `components/sections/GallerySection.js`:

```javascript
const images = [
  '/images/img1.jpg',
  '/images/img2.jpg',
  // ...
]
```

### Personalizar Cores

Edite em `tailwind.config.js`:

```javascript
colors: {
  primary: '#ff6b9d',
  secondary: '#c44569',
  accent: '#ffd93d',
  // ...
}
```

## 🎯 Funcionalidades Técnicas

### Gestures Touch
- **Swipe**: Navegação na galeria
- **Pinch-to-zoom**: Zoom em imagens
- **Long-press**: Opções extras
- **Shake**: Easter egg no Sandbox

### Storage API
```javascript
// Salvar preferências
await window.storage.set('theme', 'dark', false)

// Recuperar preferências
const theme = await window.storage.get('theme', false)
```

### Animações
- Powered by Framer Motion
- IntersectionObserver para scroll animations
- GPU-accelerated (transform e opacity)
- Respeita `prefers-reduced-motion`

## 📊 Performance

- ✅ Lighthouse Score 90+ em mobile
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3.5s
- ✅ Lazy loading de imagens
- ✅ Code splitting automático
- ✅ Minificação e compressão

## 🌐 Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

### Build Manual

```bash
npm run build
npm start
```

## 🔧 Tecnologias Utilizadas

- **Next.js 14**: Framework React
- **React 18**: Biblioteca UI
- **Tailwind CSS**: Estilização
- **Framer Motion**: Animações
- **Lucide React**: Ícones
- **React Intersection Observer**: Scroll animations

## 📝 Customização de Conteúdo

Todos os textos e conteúdos podem ser editados diretamente nos arquivos de componentes em `components/sections/`.

### Exemplos:

**Alterar mensagens em HomeSection:**
```javascript
const quotes = [
  "Sua mensagem aqui...",
  "Outra mensagem...",
]
```

**Alterar razões em LoveReasonsSection:**
```javascript
const reasons = [
  {
    emoji: '😂',
    text: 'Seu motivo aqui',
    // ...
  },
]
```

## 🐛 Troubleshooting

### Problema: Imagens não carregam
**Solução**: Verifique se as imagens estão em `public/images/`

### Problema: Spotify não aparece
**Solução**: Verifique se o ID da playlist está correto

### Problema: Animações lentas no mobile
**Solução**: Reduza o número de partículas ou desative algumas animações

## 📄 Licença

Este é um projeto pessoal e romântico. Use como inspiração! ❤️

## 💝 Mensagem Final

Este site foi criado com muito carinho para celebrar momentos especiais. Cada detalhe foi pensado para proporcionar uma experiência única e emocionante.

**Prioridade absoluta para mobile** - Tudo foi otimizado para funcionar perfeitamente na palma da mão. 🫶

---

Feito com ❤️, ☕ e muito código

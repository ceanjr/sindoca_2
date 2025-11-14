# Banner de Instalação do PWA

**Data**: 2025-11-14
**Status**: ✅ Implementado
**Componente**: `/components/InstallPWABanner.jsx`

---

## 📋 Visão Geral

Sistema de banner automático para instalação do PWA Sindoca, que aparece na primeira visita ao site (caso o app não esteja instalado). O banner é inteligente e se adapta à plataforma (iOS vs Android) e ao suporte do navegador.

---

## 🎯 Funcionalidades

### Detecção Automática

O banner detecta automaticamente:
- ✅ Se o PWA já está instalado (oculta o banner)
- ✅ Plataforma: iOS (Safari) ou Android (Chrome)
- ✅ Suporte nativo do navegador (`beforeinstallprompt`)
- ✅ Se o usuário já fechou o banner antes (cooldown de 7 dias)

### Comportamento por Plataforma

#### 🤖 Android (Chrome)

**Cenário 1: Com suporte nativo** (`beforeinstallprompt` disponível)
- Banner aparece após 3 segundos
- Mostra botão "Instalar App"
- Ao clicar, abre prompt nativo do Chrome
- Se usuário aceitar, app é instalado automaticamente
- Banner desaparece após instalação

**Cenário 2: Sem suporte nativo** (raro, mas possível)
- Banner aparece após 3 segundos
- Mostra instruções manuais passo-a-passo:
  1. Tocar no menu ⋮ (três pontos)
  2. Procurar "Instalar app" ou "Adicionar à tela inicial"
  3. Confirmar instalação

#### 🍎 iOS (Safari)

- Banner aparece após 2 segundos
- Mostra instruções ilustradas passo-a-passo:
  1. Tocar no botão Compartilhar (ícone de share)
  2. Rolar para baixo e tocar em "Adicionar à Tela Inicial"
  3. Tocar em "Adicionar"

### Sistema de Cooldown

- Se o usuário fechar o banner (botão X), ele não aparece novamente por **7 dias**
- Após 7 dias, o banner volta a aparecer (se ainda não instalou)
- Dados salvos no `localStorage`:
  - `pwa-banner-dismissed`: 'true'
  - `pwa-banner-dismissed-date`: timestamp

---

## 🎨 Aparência Visual

### Design

- **Posição**: Fixo na parte inferior da tela
- **Estilo**: Banner gradiente (rosa → pink forte)
- **Animação**: Desliza de baixo para cima ao aparecer
- **Safe Area**: Respeita `env(safe-area-inset-bottom)` (iPhone com notch)
- **Glassmorphism**: Fundo com blur e transparência

### Conteúdo

```
┌─────────────────────────────────────────┐
│  [X]                                    │  ← Botão fechar
│                                         │
│  [Ícone]  Instalar Sindoca              │  ← Título + ícone
│           Adicione à tela inicial para  │  ← Descrição
│           melhor experiência            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   [↓] Instalar App              │   │  ← Botão (ou instruções)
│  └─────────────────────────────────┘   │
│                                         │
│  📱 Acesso rápido  📥 Offline  🔔 Notif │  ← Benefícios
└─────────────────────────────────────────┘
```

---

## 🔧 Implementação Técnica

### Estrutura do Componente

```jsx
export default function InstallPWABanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // 1. Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);

    // 2. Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    if (isStandalone || isIOSStandalone) return;

    // 3. Verificar cooldown (7 dias)
    const bannerDismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedDate = localStorage.getItem('pwa-banner-dismissed-date');
    if (bannerDismissed && dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // 4. Capturar evento beforeinstallprompt (Android Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Para iOS, sempre mostrar (não tem beforeinstallprompt)
    if (iOS && !isIOSStandalone) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    // 6. Para Android, fallback se não capturar evento em 3s
    if (android && !isStandalone) {
      setTimeout(() => {
        if (!deferredPrompt) setShowBanner(true);
      }, 3000);
    }
  }, []);
}
```

### Fluxo de Decisão

```
┌─────────────────────────────────────────────────────┐
│ Usuário acessa o site                               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ InstallPWABanner: useEffect executa                 │
│ ├─ Detecta plataforma (iOS/Android)                │
│ ├─ Verifica se PWA já está instalado               │
│ │  └─ Se SIM: return (não mostra banner)           │
│ ├─ Verifica localStorage (cooldown)                │
│ │  └─ Se fechou há menos de 7 dias: return         │
│ └─ Continua...                                      │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    [Android]            [iOS]
         │                   │
         │                   └──> setTimeout 2s
         │                       └──> setShowBanner(true)
         │
         ├─ addEventListener('beforeinstallprompt')
         │  └─ Se capturar: setShowBanner(true)
         │
         └─ setTimeout 3s (fallback)
            └─ Se não capturou evento: setShowBanner(true)
```

### Integração no App

**Arquivo**: `/app/layout.jsx`

```jsx
import InstallPWABanner from '@/components/InstallPWABanner';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <GlobalErrorBoundary>
          <AuthProvider>
            <PageConfigProvider>
              <AppProvider>
                <Toaster />
                <ConditionalLayout>{children}</ConditionalLayout>

                {/* Banner de instalação PWA */}
                <InstallPWABanner />
              </AppProvider>
            </PageConfigProvider>
          </AuthProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
```

---

## 🧪 Como Testar

### Teste 1: Banner aparece corretamente

1. Abrir Chrome (Android) ou Safari (iOS)
2. Acessar `https://sindoca.vercel.app` (ou domínio do app)
3. **Aguardar 2-3 segundos**
4. **Esperado**: Banner desliza de baixo para cima
5. **Verificar**:
   - iOS: Mostra instruções com ícone de Compartilhar
   - Android (com prompt): Mostra botão "Instalar App"
   - Android (sem prompt): Mostra instruções manuais

### Teste 2: Banner não aparece se já instalado

1. Instalar o PWA (seguir instruções do banner ou manual)
2. Abrir o app pela tela inicial
3. **Esperado**: Banner NÃO aparece
4. **Verificar**: Console do navegador deve mostrar:
   ```
   [InstallBanner] App já está instalado
   ```

### Teste 3: Sistema de cooldown

1. Abrir site sem PWA instalado
2. Banner aparece
3. Clicar no botão **X** (fechar)
4. **Esperado**: Banner desaparece
5. Fechar o navegador e reabrir o site
6. **Esperado**: Banner NÃO aparece
7. **Verificar** localStorage:
   ```javascript
   localStorage.getItem('pwa-banner-dismissed') // 'true'
   localStorage.getItem('pwa-banner-dismissed-date') // timestamp
   ```
8. Para testar reaparição: limpar localStorage ou avançar 7 dias

### Teste 4: Instalação via prompt nativo (Android)

1. Abrir Chrome no Android
2. Banner aparece com botão "Instalar App"
3. Clicar no botão
4. **Esperado**: Prompt nativo do Chrome aparece
5. Tocar em "Instalar"
6. **Esperado**:
   - App é instalado na tela inicial
   - Banner desaparece
   - Console mostra: `[InstallBanner] Usuário aceitou a instalação`

### Teste 5: Reaparição após 7 dias

1. Fechar o banner (botão X)
2. No console, executar:
   ```javascript
   // Simular 8 dias atrás
   const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
   localStorage.setItem('pwa-banner-dismissed-date', eightDaysAgo.toString());
   ```
3. Recarregar a página
4. **Esperado**: Banner aparece novamente

---

## 🐛 Troubleshooting

### Problema: Banner não aparece no Android

**Possíveis causas**:
1. PWA já está instalado
2. Usuário fechou o banner há menos de 7 dias
3. Navegador não é Chrome (ou não tem suporte)

**Solução**:
1. Verificar no console:
   ```javascript
   window.matchMedia('(display-mode: standalone)').matches // deve ser false
   localStorage.getItem('pwa-banner-dismissed') // deve ser null
   ```
2. Limpar localStorage:
   ```javascript
   localStorage.removeItem('pwa-banner-dismissed');
   localStorage.removeItem('pwa-banner-dismissed-date');
   ```
3. Recarregar a página

### Problema: Banner não aparece no iOS

**Possíveis causas**:
1. PWA já está instalado
2. Usuário fechou o banner há menos de 7 dias
3. Navegador não é Safari (Chrome/Firefox iOS não suporta PWA)

**Solução**:
1. Garantir que está usando **Safari** (não Chrome)
2. Verificar se já não está instalado:
   ```javascript
   window.navigator.standalone // deve ser false
   ```
3. Limpar localStorage e recarregar

### Problema: Prompt nativo não aparece no Android

**Causa**: Chrome não disparou evento `beforeinstallprompt`

**Por que isso acontece**:
- PWA não atende todos os critérios de instalação do Chrome:
  - Manifest.json válido ✅
  - Service Worker registrado ✅
  - HTTPS habilitado ✅
  - Ícones de 192x192 e 512x512 ✅
  - **Mas**: Chrome tem heurísticas internas (tempo no site, engajamento, etc.)

**Solução**:
- O banner mostra instruções manuais nesse caso
- Usuário pode instalar pelo menu ⋮ → "Instalar app"

### Problema: Banner reaparece antes de 7 dias

**Causa**: localStorage pode ter sido limpo

**Solução**:
- Isso é esperado se o usuário limpou dados do navegador
- Para desabilitar permanentemente (dev/teste):
  ```javascript
  localStorage.setItem('pwa-banner-dismissed', 'true');
  localStorage.setItem('pwa-banner-dismissed-date', '9999999999999'); // ano 2286
  ```

---

## 📊 Logs de Debug

O componente usa console.log com prefixo `[InstallBanner]` para debug:

```javascript
// App já instalado
[InstallBanner] App já está instalado

// Banner foi fechado recentemente
[InstallBanner] Banner foi fechado recentemente

// Evento capturado (Android)
[InstallBanner] beforeinstallprompt capturado

// iOS detectado
[InstallBanner] iOS detectado, mostrando banner

// Android sem evento
[InstallBanner] Android sem beforeinstallprompt, mostrando banner customizado

// Instalação iniciada
[InstallBanner] Iniciando instalação via prompt nativo

// Usuário aceitou
[InstallBanner] Usuário aceitou a instalação

// Banner fechado
[InstallBanner] Banner fechado pelo usuário
```

---

## 🎯 Critérios de Sucesso

- ✅ Banner aparece automaticamente na primeira visita
- ✅ Banner não aparece se PWA já está instalado
- ✅ Banner mostra instruções corretas para cada plataforma
- ✅ Botão de instalação nativa funciona no Android (quando disponível)
- ✅ Sistema de cooldown funciona (7 dias)
- ✅ Animação suave e profissional
- ✅ Design consistente com tema do app (gradiente rosa)
- ✅ Respeita safe area (iPhone com notch)
- ✅ Não interfere com navegação do usuário

---

## 📁 Arquivos Relacionados

| Arquivo | Descrição |
|---------|-----------|
| `/components/InstallPWABanner.jsx` | Componente principal do banner |
| `/app/layout.jsx` | Integração do banner no app |
| `/public/manifest.json` | Configuração PWA (display, icons) |
| `/docs/CORRIGIR_PWA_ANDROID.md` | Guia de reinstalação manual |

---

## 🔄 Melhorias Futuras (Opcional)

1. **A/B Testing**: Testar diferentes textos/CTAs para maior conversão
2. **Analytics**: Rastrear quantos usuários instalam vs fecham
3. **Personalização**: Banner diferente para usuários logados vs visitantes
4. **Smart Timing**: Mostrar banner apenas após alguma interação (não imediatamente)
5. **Multi-idioma**: Suporte para outros idiomas além de PT-BR

---

## 🎉 Conclusão

O banner de instalação PWA está totalmente implementado e funcional. Ele:

- ✅ Aparece automaticamente para novos visitantes
- ✅ Se adapta à plataforma (iOS/Android)
- ✅ Usa prompt nativo quando disponível
- ✅ Mostra instruções claras quando necessário
- ✅ Não é intrusivo (pode ser fechado)
- ✅ Respeita preferências do usuário (cooldown)

O usuário final agora tem uma experiência guiada para instalar o PWA Sindoca, aumentando as chances de instalação e melhorando o engajamento! 🚀

---

**Última atualização**: 2025-11-14
**Versão**: 1.0
**Autor**: Sistema de documentação Sindoca

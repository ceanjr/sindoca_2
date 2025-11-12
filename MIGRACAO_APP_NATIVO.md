# Sindoca - Guia de Migração para App Nativo (iOS/Android)

**Documento técnico de referência para transformação do PWA Next.js em aplicativo nativo multiplataforma**

## 🎯 Stack Simplificada e Otimizada

Este documento foi **otimizado** para usar a stack mais simples, estável e gratuita possível:

### ✅ O Que Mudou (vs Primeira Versão)

| Antes                            | Agora (Otimizado)                                     | Por Quê                                      |
| -------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| Firebase/FCM para push           | **Expo Notifications** (nativo)                       | Sem configuração, 100% gratuito, mais fácil  |
| NativeWind (Tailwind para RN)    | **StyleSheet nativo**                                 | Mais estável, menos bugs, sem setup extra    |
| Firebase Admin SDK no backend    | **API direta da Expo** (HTTP)                         | Sem dependências server-side                 |
| Notifee para notificações        | **Expo Notifications** (tudo integrado)               | Uma lib ao invés de duas                     |
| react-query, zustand (opcionais) | **Removidos** (usar depois se necessário)             | Simplificar stack inicial                    |
| TestFlight requer $99/ano        | **EAS Build Internal Distribution** (gratuito)        | Instala direto via link, sem Apple Developer |
| Build na nuvem pago              | **30 builds/mês grátis** + build local ilimitado      | 100% gratuito para sempre                    |
| Push tokens separados (FCM/APNs) | **Token único Expo** funciona em Android e iOS        | Mais simples de gerenciar                    |
| Curva de aprendizado alta        | **Stack 100% Expo** (docs consistentes, tudo integra) | Mais fácil de aprender e manter              |

### 💰 Custo Final: **$0 para sempre**

- ✅ Builds gratuitos (30/mês na nuvem, ilimitado local)
- ✅ Push notifications gratuitas (sem Firebase)
- ✅ Distribuição gratuita (link direto iOS, APK Android)
- ✅ Updates OTA gratuitos (instantâneos)

---

## 🧩 Análise do Código Atual

### 1. Arquitetura Existente

O projeto **Sindoca** é um PWA (Progressive Web App) construído com **Next.js 16**, **React 18** e **TypeScript**, focado em um app de relacionamento íntimo para 2 pessoas. A arquitetura atual é robusta e bem organizada:

#### Stack Tecnológico Atual

```
Frontend:
- Next.js 16.0.1 (App Router)
- React 18.3.0
- TypeScript 5.9.3
- Tailwind CSS 3.4.1
- Framer Motion 11.0.0 (animações complexas)

Backend/Database:
- Supabase (PostgreSQL + Realtime + Storage + Auth)
- 15 migrations implementadas
- Row Level Security (RLS) configurado

PWA:
- next-pwa 5.6.0 (VERSÃO ANTIGA - 2021)
- Service Worker customizado (sw.js v6)
- web-push 3.6.7 (push notifications via VAPID)
- Manifest completo com shortcuts

UI/UX:
- Lucide React (ícones)
- Sonner (toasts)
- Framer Motion (animações fluidas)
- React Swipeable (gestos touch)
```

### 2. Funcionalidades Implementadas

#### Core Features

- **Autenticação**: Email/senha + sistema de convites com código único
- **Workspace Compartilhado**: 2 usuários sincronizados em tempo real
- **Galeria de Fotos**: Upload, compressão, lightbox, favoritos, reações
- **Mensagens Românticas**: Troca de mensagens com reações
- **Integração Spotify**: OAuth completo, playlist colaborativa, busca de músicas
- **Conquistas**: Timeline de momentos especiais
- **Razões**: Lista de motivos de amor
- **Stories**: Sistema similar ao Instagram
- **Voice Messages**: Gravação e reprodução de áudio
- **Push Notifications**: Sistema completo com VAPID keys

#### Recursos Nativos Utilizados (Web APIs)

- **Camera/File API**: Acesso à câmera e galeria via `<input capture="environment">`
- **MediaRecorder API**: Gravação de voz completa (record/pause/resume)
- **Vibration API**: Feedback tátil em botões e interações (30ms-50ms)
- **Notification API**: Notificações push via Service Worker
- **LocalStorage/SessionStorage**: Persistência de preferências
- **Push API**: Web Push com VAPID keys

### 3. Pontos Fortes da Arquitetura

✅ **Modularidade Extrema**: Componentes bem isolados e reutilizáveis
✅ **TypeScript em Todo Lugar**: Type safety completo
✅ **Realtime em Toda Aplicação**: Supabase Realtime Subscriptions
✅ **Separação de Responsabilidades**: `/app`, `/components`, `/lib`, `/hooks` bem definidos
✅ **Custom Hooks Especializados**: `usePushNotifications`, `useSpotify`, `useRealtimePhotos`, etc
✅ **Context API para Estado Global**: `AuthContext`, `PageConfigContext`, `AppContext`
✅ **UI/UX Polida**: Animações fluidas, gestos touch, feedback visual
✅ **Push Notifications Robustas**: Sistema completo com cleanup de subscriptions inválidas
✅ **PWA Completo**: Instalável, offline-capable, app shortcuts

### 4. Gargalos Técnicos e Limitações

#### 🚨 Limitações do PWA Atual

**Push Notifications**:

- Dependem de navegador aberto em background (iOS especialmente problemático)
- iOS Safari não suporta Web Push (apenas desde iOS 16.4 e com limitações)
- Não garante entrega se app não estiver na memória
- Latência maior que push nativo

**Performance**:

- Não tem acesso direto ao hardware (GPU, sensores, etc)
- Animações limitadas a 60fps web
- Compressão de imagem limitada ao browser
- Cache limitado a ~50MB em alguns browsers

**Recursos Nativos Limitados**:

- Sem acesso a contatos, calendário, NFC, Bluetooth
- Sem widgets nativos (home screen)
- Sem Live Activities (iOS)
- Sem App Shortcuts dinâmicos
- Sem integração profunda com sistema (share targets limitados)
- Sem background sync confiável

**Distribuição**:

- Usuários precisam "lembrar" de instalar via browser
- Sem ícone automático na home screen até instalação
- Não aparece em App Store/Play Store
- Sem atualizações automáticas confiáveis

#### 🚧 Pontos que Dificultam Migração

**1. Tailwind CSS Acoplado**: Todo o código usa classes Tailwind diretamente. React Native não suporta classes CSS nativamente.
**Solução**: NativeWind (Tailwind para RN) ou reescrita completa dos estilos.

**2. Framer Motion Everywhere**: Animações complexas em ~40% dos componentes.
**Solução**: Migrar para React Native Reanimated ou Moti (Reanimated wrapper).

**3. Next.js App Router**: Navegação baseada em file-system do Next.js.
**Solução**: React Navigation ou Expo Router (que é inspirado em Next.js).

**4. Service Worker Customizado**: Lógica complexa de cache e push.
**Solução**: WorkManager (Android), BackgroundTasks (iOS), FCM para push.

**5. Spotify OAuth Web Flow**: Usa redirect URLs web.
**Solução**: Expo AuthSession ou react-native-app-auth.

**6. MediaRecorder API**: Web-specific para gravação de áudio.
**Solução**: expo-av ou react-native-audio-recorder-player.

### 5. O Que Pode Ser 100% Reutilizado

#### ✅ Lógica de Negócio (Migração Direta)

```typescript
// Todo código puro em /lib/ pode ser copiado direto:
-lib /
  utils / // Funções puras
  -lib /
  api / // API calls (fetch funciona em RN)
  -lib /
  supabase / // Cliente Supabase (adaptar config)
  -lib /
  spotify / // Lógica Spotify (exceto OAuth)
  -Validações,
  cálculos,
  transformações;
```

#### ✅ Hooks Logic (80-90% reutilizável)

```typescript
// Estrutura dos hooks pode ser mantida, apenas mudar APIs nativas:
-useRealtimePhotos() - // Lógica de subscription Supabase (OK)
  useReactions() - // Lógica de reações (OK)
  useSpotify() - // Mudar apenas OAuth flow
  usePushNotifications(); // Reescrever com FCM/APNs
```

#### ✅ Database & Backend (100% reutilizável)

```sql
- Todas as migrations Supabase
- RLS policies
- Triggers e functions
- API Routes Next.js (podem virar backend separado ou continuar usando)
```

#### ✅ Type Definitions (100% reutilizável)

```typescript
// Todas as interfaces TypeScript:
interface Photo { ... }
interface Message { ... }
interface Reaction { ... }
// etc
```

### 6. O Que Precisa Ser Reescrito

#### ❌ UI Components (70% do código)

- **Tailwind Classes → StyleSheet/NativeWind**
- **HTML Tags → React Native Components** (`<div>` → `<View>`, `<img>` → `<Image>`)
- **Framer Motion → Reanimated** (todas as animações)
- **Input Components** (react-native não tem `<input type="file">`)

#### ❌ Navegação (10% do código)

- **Next.js Router → React Navigation/Expo Router**
- **File-based routing → Stack/Tab/Drawer navigators**
- **Link components → Navigation props**

#### ❌ Push Notifications (5% do código)

- **Web Push API → Firebase Cloud Messaging (Android) + APNs (iOS)**
- **Service Worker → Notifee ou React Native Push Notification**
- **VAPID Keys → FCM Server Key**

#### ❌ Media Features (3% do código)

- **MediaRecorder API → expo-av ou react-native-audio-recorder**
- **File Input → ImagePicker ou DocumentPicker**
- **Image Compression → react-native-image-resizer**

### 7. Estimativa de Complexidade

```
Total de Arquivos: ~150 arquivos
Linhas de Código: ~15.000 LOC

Distribuição de Esforço:
┌─────────────────────────────────────┐
│ UI Components:         40% (6 sem)  │
│ Navegação:             10% (1.5 sem)│
│ Animações:             15% (2.5 sem)│
│ Push Notifications:    10% (1.5 sem)│
│ Media Features:        5%  (1 sem)  │
│ Configuração/Build:    10% (1.5 sem)│
│ Testes e Debug:        10% (1.5 sem)│
└─────────────────────────────────────┘

Tempo Total Estimado: 10-15 semanas (2.5-4 meses)
Com dedicação full-time: 6-8 semanas
```

### 8. Viabilidade Técnica para 2 Usuários

#### ✅ Totalmente Viável e Recomendado

**Custos Zero**:

- **Expo Free Plan**: Builds ilimitados localmente, 30 builds/mês na nuvem (gratuito)
- **EAS Build**: Build local 100% gratuito, build na nuvem grátis até 30/mês
- **Supabase Free**: 500MB DB, 1GB storage, 50.000 MAU (mais que suficiente)
- **Expo Notifications**: Push notifications gratuitas (sem Firebase necessário!)
- **TestFlight (iOS)**: Gratuito, até 10.000 testers
- **APK Direto (Android)**: Distribuição direta, sem custo
- **TOTAL**: $0 para sempre

**Vantagens para Uso Privado**:

- Não precisa de aprovação de lojas (sem guidelines rigorosas)
- Atualizações instantâneas via Over-the-Air (Expo Updates)
- Pode usar features experimentais sem restrições
- Build local ou via Expo EAS (gratuito para desenvolvimento)
- TestFlight para iOS, APK instalado via ADB ou link direto para Android

---

## ⚙️ Guia de Implementação

### 1. Tecnologia Recomendada: **Expo (React Native)**

#### Por Que Expo?

**Vantagens**:

- **Setup Zero**: `npx create-expo-app` e está pronto
- **Expo Go**: Testa no celular sem build (durante desenvolvimento)
- **EAS Build**: Builds gratuitos na nuvem (500 builds/mês no plano gratuito)
- **OTA Updates**: Atualiza app sem nova versão na loja
- **Managed Workflow**: Não precisa lidar com Xcode/Android Studio inicialmente
- **Expo Modules**: Biblioteca gigante de módulos nativos prontos
- **TypeScript First**: Suporte nativo completo
- **Expo Router**: Navegação file-based (igual Next.js!)
- **Expo SDK 52**: Estável, moderno, suporta React Native 0.76

**Desvantagens** (mínimas para seu caso):

- Tamanho do app ligeiramente maior (~30MB base)
- Algumas libs nativas precisam de custom config plugin
- Para features muito específicas, pode precisar fazer eject (raro)

#### Alternativas Consideradas

| Tecnologia           | Prós                                        | Contras                               | Veredicto                     |
| -------------------- | ------------------------------------------- | ------------------------------------- | ----------------------------- |
| **React Native CLI** | Mais controle, menor tamanho app            | Setup complexo, sem OTA updates fácil | ❌ Overkill                   |
| **Flutter**          | Performance nativa, hot reload              | Dart (não JS), reescrever 100%        | ❌ Muito esforço              |
| **Capacitor**        | Reutiliza código web, fácil migração        | Ainda é WebView (não nativo real)     | ❌ Não resolve limitações PWA |
| **Tauri Mobile**     | Pequeno, Rust backend                       | Alpha stage, poucos recursos móveis   | ❌ Muito experimental         |
| **Expo**             | Balance perfeito: fácil + nativo + gratuito | Nenhum significativo                  | ✅ **ESCOLHA IDEAL**          |

### 2. Arquitetura do App Nativo

#### Estrutura de Pastas Proposta

```
sindoca-native/
├── app/                          # Expo Router (file-based)
│   ├── (tabs)/                   # Tab Navigator
│   │   ├── index.tsx             # Home
│   │   ├── galeria.tsx           # Galeria
│   │   ├── mensagens.tsx         # Mensagens
│   │   ├── musica.tsx            # Música
│   │   └── _layout.tsx           # Tab layout
│   ├── (modals)/                 # Modal screens
│   │   ├── photo/[id].tsx        # Lightbox
│   │   ├── voice-recorder.tsx    # Gravador
│   │   └── story-viewer.tsx      # Stories
│   ├── auth/                     # Auth flow
│   │   ├── login.tsx
│   │   └── join.tsx
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx
│
├── components/                   # Componentes React Native
│   ├── ui/                       # UI primitivos
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── sections/                 # Seções principais
│   ├── widgets/                  # Widgets
│   └── animations/               # Animações Reanimated
│
├── lib/                          # Lógica (REUTILIZAR DO PWA)
│   ├── supabase/
│   ├── spotify/
│   ├── api/
│   ├── utils/
│   └── config.ts
│
├── hooks/                        # Hooks (ADAPTAR DO PWA)
│   ├── useRealtimePhotos.ts
│   ├── useSpotify.ts
│   ├── usePushNotifications.ts  # REESCREVER
│   └── ...
│
├── contexts/                     # Context API (REUTILIZAR)
│   ├── AuthContext.tsx
│   └── AppContext.tsx
│
├── assets/                       # Imagens, fontes
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── constants/                    # Constantes
│   ├── Colors.ts
│   └── Styles.ts
│
├── types/                        # TypeScript (REUTILIZAR)
│   └── index.ts
│
├── app.json                      # Config Expo
├── eas.json                      # Build config
├── package.json
└── tsconfig.json
```

### 3. Stack Tecnológico Nativo (Simplificada e Estável)

#### Core Stack

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "react": "18.3.0",
    "react-native": "0.76.0",

    // Navegação (igual Next.js!)
    "expo-router": "~4.0.0",

    // UI & Animações
    "react-native-reanimated": "~3.16.0", // Animações nativas
    "moti": "^0.29.0", // Wrapper Reanimated (Framer Motion style)

    // Backend (manter Supabase!)
    "@supabase/supabase-js": "^2.78.0",
    "react-native-url-polyfill": "^2.0.0", // Polyfill para Supabase

    // Storage
    "@react-native-async-storage/async-storage": "^2.1.0",
    "expo-secure-store": "~14.0.0", // Credentials seguras

    // Push Notifications (SEM FIREBASE! Muito mais simples)
    "expo-notifications": "~0.29.0", // Push nativo Expo

    // Media
    "expo-image": "~1.14.0", // Image com cache automático
    "expo-image-picker": "~16.0.0", // Câmera/galeria
    "expo-av": "~15.0.0", // Áudio/vídeo
    "expo-image-manipulator": "~13.0.0", // Compressão

    // Spotify
    "expo-auth-session": "~6.0.0", // OAuth
    "expo-web-browser": "~14.0.0", // Browser in-app

    // Utilities
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "~4.12.0",
    "expo-haptics": "~14.0.0", // Vibração
    "expo-constants": "~17.0.0",
    "expo-device": "~7.0.0",
    "expo-linking": "~7.0.0", // Deep linking
    "@react-native-community/netinfo": "^11.4.0" // Status de conectividade
  }
}
```

**IMPORTANTE**: Esta stack **NÃO usa Firebase** nem NativeWind. Push notifications funcionam 100% com Expo Notifications (gratuito, sem servidor necessário). Estilos usam StyleSheet nativo do React Native (mais estável e sem configuração adicional).

#### Por Que Simplificamos?

- **Sem Firebase/FCM**: Expo Notifications faz push notifications nativos sem precisar de servidor Firebase
- **Sem NativeWind**: StyleSheet nativo é mais estável, menos configuração, melhor performance
- **Menos dependências**: Removemos libs redundantes (notifee, react-query, zustand - podem adicionar depois se necessário)
- **100% Expo**: Tudo funciona out-of-the-box, builds gratuitos, menos problemas

### 4. Implementação de Recursos Nativos

#### 4.1 Push Notifications (Expo Notifications - SEM Firebase!)

**Arquitetura Simplificada**:

- **Android & iOS**: Expo Notifications gerencia tudo automaticamente
- **Servidor**: Backend Next.js envia push via API da Expo
- **Gratuito**: Sem custos, sem configuração de Firebase/APNs
- **Token Único**: Um token funciona para ambos os sistemas operacionais

**Código de Implementação (Client-Side)**:

```typescript
// lib/push/expo-push.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../supabase/client';

// Configurar como notificações aparecem quando app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B9D',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permissão de notificações negada');
      return;
    }

    // Obter token Expo Push
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // Salvar no Supabase
    await savePushToken(token);
  } else {
    alert('Notificações push funcionam apenas em dispositivos físicos');
  }

  return token;
}

async function savePushToken(token: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from('push_subscriptions_native').upsert(
      {
        user_id: user.id,
        expo_push_token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );
  }
}

// Hook para usar em componentes
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Registrar e obter token
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    // Listener quando notificação chega (app aberto)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notificação recebida:', notification);
      });

    // Listener quando usuário clica na notificação
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notificação clicada:', response);

        // Deep linking baseado no data da notificação
        const data = response.notification.request.content.data;
        if (data.screen) {
          router.push(data.screen); // Navegar para tela específica
        }
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!
      );
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  return { expoPushToken };
}
```

**Backend API para Enviar Notificações** (Next.js):

```typescript
// app/api/push/send-expo/route.ts
export async function POST(request: Request) {
  const { userId, title, body, data } = await request.json();

  // Buscar tokens Expo do usuário
  const { data: subscriptions } = await supabase
    .from('push_subscriptions_native')
    .select('expo_push_token')
    .eq('user_id', userId);

  if (!subscriptions || subscriptions.length === 0) {
    return Response.json({ error: 'No push tokens found' }, { status: 404 });
  }

  const tokens = subscriptions.map((s) => s.expo_push_token);

  // Criar mensagens para Expo Push API
  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
    badge: 1,
    priority: 'high',
  }));

  // Enviar via Expo Push API
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();

  return Response.json({
    success: true,
    sent: messages.length,
    result,
  });
}
```

**Nova Tabela no Supabase**:

```sql
-- supabase/migrations/20250112000000_push_native.sql
CREATE TABLE push_subscriptions_native (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_push_native_user ON push_subscriptions_native(user_id);

-- RLS policies
ALTER TABLE push_subscriptions_native ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own push token"
  ON push_subscriptions_native FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push token"
  ON push_subscriptions_native FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own push token"
  ON push_subscriptions_native FOR SELECT
  USING (auth.uid() = user_id);
```

**Vantagens do Expo Push Notifications**:

- ✅ **Zero configuração**: Sem Firebase, sem APNs certificates
- ✅ **Um token para tudo**: Funciona em Android e iOS
- ✅ **Gratuito**: Sem limites de mensagens
- ✅ **Simples**: Apenas HTTP POST para API da Expo
- ✅ **Confiável**: Expo gerencia toda a complexidade

#### 4.2 Deep Linking

**Configuração**:

```json
// app.json
{
  "expo": {
    "scheme": "sindoca",
    "ios": {
      "bundleIdentifier": "com.yourname.sindoca",
      "associatedDomains": ["applinks:sindoca.app"]
    },
    "android": {
      "package": "com.yourname.sindoca",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "sindoca",
              "host": "*"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**Código**:

```typescript
// app/_layout.tsx
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { hostname, path, queryParams } = Linking.parse(event.url);

      // sindoca://photo/123 -> navega para foto
      if (hostname === 'photo') {
        router.push(`/photo/${path}`);
      }

      // sindoca://message/456
      if (hostname === 'message') {
        router.push(`/mensagens?id=${path}`);
      }
    };

    // Deep link quando app está aberto
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Deep link quando app abre
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

#### 4.3 Câmera & Galeria

```typescript
// hooks/useImagePicker.ts
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';

export function useImagePicker() {
  const pickFromCamera = async () => {
    // Pedir permissão
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera');
      return null;
    }

    // Abrir câmera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return await compressImage(result.assets[0].uri);
    }

    return null;
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      return await Promise.all(
        result.assets.map((asset) => compressImage(asset.uri))
      );
    }

    return null;
  };

  return { pickFromCamera, pickFromGallery };
}

async function compressImage(uri: string) {
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }], // Max width mantendo aspect ratio
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );

  return manipResult.uri;
}
```

**Upload para Supabase** (idêntico ao PWA):

```typescript
// lib/api/photos.ts
import { supabase } from '../supabase/client';
import * as FileSystem from 'expo-file-system';

export async function uploadPhoto(uri: string, workspaceId: string) {
  // Ler arquivo como base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Converter para Blob
  const arrayBuffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });

  // Upload (código idêntico ao PWA)
  const fileName = `${Date.now()}-${Math.random()}.jpg`;
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(`${workspaceId}/${fileName}`, blob);

  if (error) throw error;

  return data.path;
}
```

#### 4.4 Gravação de Áudio

```typescript
// components/voice/NativeVoiceRecorder.tsx
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

export function NativeVoiceRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  async function startRecording() {
    try {
      // Pedir permissão
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Configurar modo de gravação
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Iniciar gravação
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    setAudioUri(uri);
    setRecording(null);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function playAudio() {
    if (!audioUri) return;

    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    await sound.playAsync();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <View className="p-4">
      {!isRecording ? (
        <Button onPress={startRecording}>
          <Text>🎤 Gravar</Text>
        </Button>
      ) : (
        <Button onPress={stopRecording}>
          <Text>⏹ Parar</Text>
        </Button>
      )}

      {audioUri && (
        <Button onPress={playAudio}>
          <Text>▶️ Reproduzir</Text>
        </Button>
      )}
    </View>
  );
}
```

#### 4.5 Estilos (StyleSheet Nativo)

**React Native StyleSheet** é a forma padrão e mais estável de estilizar:

```typescript
// components/ui/Button.tsx
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ title, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === 'secondary' && styles.buttonSecondary]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.text, variant === 'secondary' && styles.textSecondary]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ff6b9d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff6b9d',
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  textSecondary: {
    color: '#ff6b9d',
  },
});
```

**Criar arquivo de constantes de estilos**:

```typescript
// constants/Colors.ts
export const Colors = {
  primary: '#ff6b9d',
  secondary: '#4a9eff',
  background: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#ff3b30',
  success: '#34c759',
};

// constants/Styles.ts
import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3, // Android
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
});
```

#### 4.6 Animações (Framer Motion → Moti)

**Moti** é um wrapper do Reanimated que tem API similar ao Framer Motion:

```typescript
// Antes (Framer Motion - Web)
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  <Text>Conteúdo</Text>
</motion.div>;

// Depois (Moti - React Native)
import { MotiView } from 'moti';

<MotiView
  from={{ opacity: 0, translateY: 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  exit={{ opacity: 0, translateY: -20 }}
  transition={{ type: 'timing', duration: 300 }}
>
  <Text>Conteúdo</Text>
</MotiView>;
```

**Animações Complexas com Reanimated**:

```typescript
// components/animations/PhotoScale.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export function PhotoScale({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      scale.value = withSpring(1.2, {}, (finished) => {
        if (finished) {
          scale.value = withSpring(1);
        }
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}
```

#### 4.7 Spotify OAuth (Nativo)

```typescript
// lib/spotify/auth-native.ts
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export function useSpotifyAuth() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID!,
      scopes: [
        'user-read-email',
        'playlist-read-private',
        'playlist-modify-public',
        'playlist-modify-private',
      ],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'sindoca',
        path: 'spotify-callback',
      }),
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      // Trocar code por access_token no backend
      exchangeCodeForToken(code);
    }
  }, [response]);

  const login = () => {
    promptAsync();
  };

  return { login, loading: !request };
}
```

### 5. Build e Distribuição Privada (100% Gratuito)

#### 5.1 Configuração EAS Build

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login Expo (gratuito)
eas login

# Configurar projeto
eas build:configure
```

**Arquivo de Configuração**:

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk" // APK para instalação direta
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "apk" // ou "app-bundle" para Play Store
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### 5.2 Build iOS (100% Gratuito!)

**🎯 Opção Recomendada: EAS Build + Internal Distribution (Gratuito)**

```bash
# Build para iOS via EAS (gratuito, 30 builds/mês)
eas build --platform ios --profile preview

# Após build (15-30min), você receberá um link
# Abra o link no iPhone e instale diretamente
# Não precisa de App Store nem Apple Developer!
```

**Como funciona**:

1. EAS Build gera o `.ipa` na nuvem (gratuito)
2. Link de download válido por 30 dias
3. Instala diretamente no iPhone via Safari
4. Pode compartilhar o link com sua namorada
5. **Não requer Apple Developer ($99/ano)**
6. Limite: 30 builds/mês (mais que suficiente)

**📱 Instalação no iPhone**:

1. Abrir link do build no Safari do iPhone
2. Clicar em "Install"
3. Ir em Ajustes > Geral > VPN e Gerenciamento de Dispositivos
4. Confiar no desenvolvedor
5. App instalado!

---

**Alternativa 1: TestFlight (Requer Apple Developer - $99/ano)**

```bash
# Apenas se quiser distribuir via App Store Connect
eas build --platform ios --profile production
eas submit --platform ios
```

**Quando usar**: Se você planeja publicar na App Store eventualmente.

---

**Alternativa 2: Adhoc Distribution (Gratuito, até 100 devices)**

```bash
# Registrar UDID dos iPhones
eas device:create

# Build adhoc
eas build --platform ios --profile preview
```

**Quando usar**: Se a opção Internal Distribution não funcionar.

---

**Alternativa 3: Expo Go (Desenvolvimento, Gratuito)**

```bash
# Durante desenvolvimento, usar Expo Go app
npx expo start

# Escanear QR code no app Expo Go
```

**Limitação**: Não funciona com Expo Notifications (push nativo). Use apenas para desenvolvimento inicial.

#### 5.3 Build Android (APK Direto)

```bash
# Build APK (gratuito, sem Google Play)
eas build --platform android --profile preview

# Após build, baixar APK
# Link será fornecido no terminal (válido por 30 dias)

# Instalar no celular:
# 1. Download do APK
# 2. Habilitar "Fontes desconhecidas" no Android
# 3. Instalar APK
```

**Alternativa: Build Local (100% Gratuito)**

```bash
# Build localmente (sem usar servidores Expo)
npx expo run:android
npx expo run:ios

# Gera APK em android/app/build/outputs/apk/release/
```

#### 5.4 Over-The-Air Updates (OTA)

Atualiza o app sem gerar novo build (código JS/assets apenas):

```bash
# Publicar atualização
eas update --branch production --message "Correção de bugs"

# App detecta e baixa automaticamente na próxima abertura
```

**Configuração**:

```typescript
// app/_layout.tsx
import * as Updates from 'expo-updates';

useEffect(() => {
  async function checkForUpdates() {
    const { isAvailable } = await Updates.checkForUpdateAsync();
    if (isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  }

  checkForUpdates();
}, []);
```

#### 5.5 Resumo de Custos

| Serviço                   | Custo         | Notas                                         |
| ------------------------- | ------------- | --------------------------------------------- |
| **Expo Account**          | Gratuito      | Build local ilimitado, 30 builds na nuvem/mês |
| **EAS Build (Local)**     | Gratuito      | Build 100% local no seu computador            |
| **EAS Build (Cloud)**     | Gratuito      | 30 builds/mês grátis (suficiente!)            |
| **Expo Notifications**    | Gratuito      | Push notifications ilimitadas (sem Firebase!) |
| **Supabase Free**         | Gratuito      | 500MB DB, 1GB storage                         |
| **Android APK**           | Gratuito      | Distribuição direta, sem Play Store           |
| **iOS Build (EAS)**       | Gratuito      | Build via EAS Build (30/mês)                  |
| **iOS TestFlight**        | Gratuito      | Distribuição para 10.000 testers              |
| **Apple Developer** (opt) | $99/ano (opt) | Apenas se quiser publicar na App Store        |
| **Expo Go (dev)**         | Gratuito      | Para testes durante desenvolvimento           |
| **Total Anual**           | **$0**        | 100% gratuito para uso privado!               |

**IMPORTANTE**: Você pode fazer builds iOS **gratuitamente** usando EAS Build (30 builds/mês) e distribuir via TestFlight **sem pagar** Apple Developer. A taxa de $99/ano é apenas se quiser publicar na App Store, o que não é necessário para uso privado.

---

## 💡 Ideias de Melhorias (Exclusivas do Nativo)

### 1. Widgets (Home Screen)

**iOS Live Activities** (atualização em tempo real):

```typescript
// Mostrar "Pensando em você" direto na tela bloqueada
import LiveActivities from 'react-native-live-activities';

LiveActivities.startActivity({
  activityType: 'thinking-of-you',
  attributes: {
    partnerName: 'Amor',
    message: 'Você é incrível ❤️',
  },
  contentState: {
    timestamp: Date.now(),
  },
});
```

**Android Widgets**:

```kotlin
// Contador de dias juntos direto na home screen
// Widget nativo mostrando "127 dias juntos"
```

### 2. Compartilhamento Nativo

```typescript
// Compartilhar foto do Sindoca direto para WhatsApp, Instagram, etc
import * as Sharing from 'expo-sharing';

async function sharePhoto(photoUri: string) {
  await Sharing.shareAsync(photoUri, {
    mimeType: 'image/jpeg',
    dialogTitle: 'Compartilhar foto',
  });
}
```

### 4. Notificações Agendadas (Local)

```typescript
// Lembrar de enviar mensagem todo dia às 20h
import * as Notifications from 'expo-notifications';

Notifications.scheduleNotificationAsync({
  content: {
    title: '💕 Hora de mandar um "oi"',
    body: 'Que tal enviar uma mensagem para seu love love?',
  },
  trigger: {
    hour: 20,
    minute: 0,
    repeats: true,
  },
});
```

### 5. Background Location (com consentimento)

```typescript
// Adicionar localização automática em fotos
import * as Location from 'expo-location';

async function getLocationForPhoto() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }
  return null;
}
```

### 8. Galeria com Face Recognition (ML Kit)

```typescript
// Detectar rostos automaticamente em fotos
import Vision from '@react-native-ml-kit/face-detection';

async function detectFaces(imageUri: string) {
  const faces = await Vision.detect(imageUri);

  // Usar para:
  // - Auto-crop em rostos
  // - Agrupar fotos por pessoa
  // - Melhorar enquadramento

  return faces;
}
```

### 9. Haptic Feedback Avançado

```typescript
// Feedback tátil personalizado
import * as Haptics from 'expo-haptics';

// Ao curtir foto
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Ao trocar de tab
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Ao abrir lightbox
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Sequência customizada (iOS)
Haptics.selectionAsync();
```

### 10. Background Sync (Upload de Fotos em Background)

```typescript
// Upload de fotos continua mesmo se app fechar
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const PHOTO_UPLOAD_TASK = 'photo-upload-background';

TaskManager.defineTask(PHOTO_UPLOAD_TASK, async () => {
  // Buscar fotos pendentes no AsyncStorage
  const pendingPhotos = await AsyncStorage.getItem('pending-uploads');

  if (pendingPhotos) {
    const photos = JSON.parse(pendingPhotos);
    await Promise.all(photos.map((photo) => uploadPhoto(photo)));
    await AsyncStorage.removeItem('pending-uploads');
  }

  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// Registrar task (executa a cada 15min em background)
BackgroundFetch.registerTaskAsync(PHOTO_UPLOAD_TASK, {
  minimumInterval: 15 * 60,
  stopOnTerminate: false,
  startOnBoot: true,
});
```

### 11. Biometria (FaceID/TouchID)

```typescript
// Proteger app com biometria
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (hasHardware && isEnrolled) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autenticar no Sindoca',
      fallbackLabel: 'Usar senha',
    });

    return result.success;
  }

  return false;
}
```

---

## ✅ Checklist (TODO) Dividido em Fases

### Fase 1: Preparação e Análise (1-2 semanas)

#### 1.1 Ambiente de Desenvolvimento

- [x] Instalar Node.js 18+ e npm/yarn
- [x] Instalar Expo CLI: `npm install -g expo-cli eas-cli`
- [x] Criar conta Expo (gratuita): https://expo.dev/signup
- [x] Instalar Expo Go no celular (iOS/Android) para testes

#### 1.2 Setup do Projeto

- [x] Criar novo projeto Expo: `npx create-expo-app sindoca-native --template`
- [x] Escolher template: **Tabs (TypeScript)** (navegação similar ao app atual)
- [x] Configurar Git: `git init && git add . && git commit -m "Initial commit"`
- [x] Configurar `.gitignore` (node_modules, .env, builds)
- [x] Instalar dependências principais (ver seção 3 deste doc)

#### 1.3 Configuração Supabase

- [x] Copiar `.env` do projeto PWA atual
- [x] Instalar polyfill: `npx expo install react-native-url-polyfill`
- [x] Criar `lib/supabase/client.ts` para React Native
- [x] Configurar AsyncStorage para session: `@react-native-async-storage/async-storage`
- [x] Testar conexão com Supabase (query simples)

#### 1.4 Configuração de Push Notifications (Expo)

- [x] Instalar Expo Notifications: `npx expo install expo-notifications expo-device`
- [x] Criar arquivo `lib/push/expo-push.ts` (copiar do doc)
- [x] Criar tabela `push_subscriptions_native` no Supabase (migration fornecida no doc)
- [x] Criar API Route `/api/push/send-expo/route.ts` (copiar do doc)
- [ ] Testar permissões de notificação no dispositivo físico

#### 1.5 Análise de Código para Migração

- [x] Listar todos os componentes do PWA (`components/`)
- [x] Identificar componentes com Framer Motion (precisam adaptação)
- [x] Listar hooks customizados (`hooks/`)
- [x] Mapear APIs Web usadas (Camera, MediaRecorder, Vibration, etc)
- [x] Documentar estrutura de navegação atual (rotas Next.js)

### Fase 2: Adaptação do Código Base (3-4 semanas)

#### 2.1 Setup de Estilos (StyleSheet Nativo)

- [x] Criar `constants/Colors.ts` (cores do Sindoca: #ff6b9d, etc)
- [x] Criar `constants/Styles.ts` (estilos comuns reutilizáveis)
- [x] Criar primeiros componentes UI com StyleSheet:
  - [x] `components/ui/Button.tsx`
  - [x] `components/ui/Input.tsx`
  - [x] `components/ui/Card.tsx`
- [x] Testar estilos em tela de exemplo

#### 2.2 Navegação (Expo Router)

- [x] Estruturar pastas `app/` seguindo Expo Router:
  - `app/(tabs)/` para navegação principal
  - `app/(modals)/` para modais
  - `app/auth/` para login/join
- [x] Criar `_layout.tsx` em cada pasta
- [x] Migrar rotas do Next.js:
  - `app/page.jsx` → `app/(tabs)/index.tsx`
  - `app/galeria/page.jsx` → `app/(tabs)/galeria.tsx`
  - `app/mensagens/page.jsx` → `app/(tabs)/mensagens.tsx`
  - `app/musica/page.jsx` → `app/(tabs)/musica.tsx`
- [x] Implementar navegação bottom tabs (5 tabs principais)
- [x] Configurar modais (photo lightbox, voice recorder, story viewer)
- [x] Testar navegação básica entre telas

#### 2.3 Context & State Management

- [x] Copiar `/contexts/AuthContext.tsx` do PWA
- [x] Adaptar `AuthContext` para usar AsyncStorage no lugar de cookies
- [x] Copiar `/contexts/PageConfigContext.jsx` (pode ser simplificado no native)
- [x] Criar `AppProvider.tsx` unificado
- [x] Configurar `app/_layout.tsx` com providers
- [x] Testar login e persistência de sessão

#### 2.4 Componentes UI Base (Reutilizáveis)

- [x] Criar `components/ui/Button.tsx` (substituir componentes web)
- [x] Criar `components/ui/Input.tsx` (TextInput nativo)
- [x] Criar `components/ui/Card.tsx` (View com estilos)
- [x] Criar `components/ui/Avatar.tsx` (Image com fallback)
- [x] Criar `components/ui/Loading.tsx` (ActivityIndicator)
- [x] Criar `components/ui/Toast.tsx` (substituir Sonner)
- [x] Criar `components/ui/Modal.tsx` (Modal nativo)
- [x] Testar todos os componentes UI isoladamente

#### 2.5 Hooks Base (Reutilizar Lógica)

- [x] Copiar `/lib/utils/` (funções puras, 100% reutilizáveis)
- [x] Copiar `/lib/api/` (chamadas API)
- [x] Adaptar `hooks/useAuth.ts` (remover dependências web)
- [x] Adaptar `hooks/useRealtimePhotos.ts` (Supabase funciona igual)
- [x] Adaptar `hooks/useRealtimeMessages.ts`
- [x] Adaptar `hooks/useReactions.ts`
- [x] Criar `hooks/useImagePicker.ts` (substituir `<input type="file">`)
- [x] Testar cada hook individualmente

### Fase 3: Implementação de Recursos Nativos (3-4 semanas)

#### 3.1 Push Notifications (Prioridade Máxima - Expo Notifications)

- [x] Verificar que tabela `push_subscriptions_native` está criada
- [x] Implementar `lib/push/expo-push.ts` (copiar código do doc):
  - [x] `registerForPushNotificationsAsync()`
  - [x] `savePushToken()`
  - [x] Hook `usePushNotifications()`
  - [x] Notification handlers (foreground + response)
- [x] Criar API Route `/api/push/send-expo/route.ts`:
  - [x] Buscar tokens do usuário
  - [x] Enviar para API da Expo (https://exp.host/--/api/v2/push/send)
  - [x] Retornar estatísticas de envio
- [x] Configurar canal Android (código já no `expo-push.ts`)
- [x] Integrar hook no `app/_layout.tsx` (registrar ao abrir app)
- [x] Testar notificações:
  - [x] App em foreground (deve mostrar alert)
  - [x] App em background (deve aparecer na barra)
  - [x] App fechado (deve aparecer na barra)
  - [x] Deep linking ao clicar (verificar navigation)
- [x] **IMPORTANTE**: Testar apenas em dispositivo físico (não funciona em simulador)

#### 3.2 Câmera & Galeria

- [x] Instalar `expo-image-picker` e `expo-image-manipulator`
- [x] Implementar `hooks/useImagePicker.ts`:
  - [x] `pickFromCamera()`
  - [x] `pickFromGallery()`
  - [x] `compressImage()`
- [x] Adaptar componente `PhotoMenu.jsx`:
  - [x] Substituir `<input>` por ImagePicker
  - [x] Manter vibração (Expo Haptics)
- [x] Adaptar upload de foto para Supabase (compatível com RN)
- [x] Testar:
  - [x] Tirar foto
  - [x] Selecionar da galeria
  - [x] Upload múltiplo
  - [x] Compressão automática

#### 3.3 Gravação de Áudio

- [x] Instalar `expo-av`
- [x] Reescrever `components/voice/VoiceRecorder.tsx`:
  - [x] Pedir permissão de microfone
  - [x] Implementar gravação com `Audio.Recording`
  - [x] Implementar playback com `Audio.Sound`
  - [x] Manter UI (barra de progresso, botões)
- [x] Adaptar upload de áudio para Supabase
- [x] Testar:
  - [x] Gravar áudio
  - [x] Pausar/retomar
  - [x] Reproduzir
  - [x] Salvar no servidor

#### 3.4 Animações (Framer Motion → Reanimated/Moti)

- [x] Instalar `react-native-reanimated` e `moti`
- [x] Listar todos os componentes com animações Framer Motion
- [x] Migrar animações principais:
  - [x] `components/sections/GallerySection.jsx` (grid fade-in)
  - [x] `components/ui/PhotoCard.jsx` (hover/press scale)
  - [x] `components/stories/StoryViewer.tsx` (swipe transitions)
  - [x] `components/timeline/TimelineItem.jsx` (scroll-triggered)
- [x] Criar componentes animados reutilizáveis:
  - [x] `FadeInView.tsx`
  - [x] `ScaleOnPress.tsx`
  - [x] `SlideInFromBottom.tsx`
  - [x] `PhotoLightbox.tsx` (pinch-to-zoom)
  - [x] `PhotoSwipeGallery.tsx` (swipe entre fotos)
- [x] Testar performance das animações (60fps)

#### 3.5 Integração Spotify

- [x] Instalar `expo-auth-session` e `expo-web-browser`
- [x] Criar `lib/spotify/auth-native.ts`:
  - [x] Implementar OAuth flow com `useAuthRequest`
  - [x] Exchange code por access_token (backend)
  - [x] Refresh token automático
- [x] Adaptar componentes de música:
  - [x] `hooks/useSpotify.ts` (search, playlists, add tracks)
  - [x] OAuth com expo-auth-session
- [x] Testar:
  - [x] Login Spotify
  - [x] Buscar músicas
  - [x] Adicionar à playlist
  - [x] Tocar preview (se disponível)

#### 3.6 Deep Linking

- [x] Configurar `scheme: "sindoca"` no `app.json`
- [x] Configurar iOS Associated Domains (se tiver domínio)
- [x] Configurar Android Intent Filters
- [x] Implementar handler de deep links em `app/_layout.tsx`
- [x] Criar links personalizados:
  - [x] `sindoca://photo/:id` → Abrir foto
  - [x] `sindoca://message/:id` → Abrir mensagem
  - [x] `sindoca://music/:trackId` → Ver música
- [x] Testar deep links:
  - [x] Ao clicar em notificação
  - [x] Ao compartilhar link externo

#### 3.7 Offline Mode

- [x] Instalar `@react-native-community/netinfo`
- [x] Criar `hooks/useOfflineMode.ts`:
  - [x] Network state tracking
  - [x] Queue system com AsyncStorage
  - [x] Auto-process quando voltar online
- [x] Implementar queue para:
  - [x] Upload de fotos
  - [x] Envio de mensagens
  - [x] Upload de áudio
- [x] Testar offline mode completo

### Fase 4: Migração de Telas Principais (2-3 semanas)

#### 4.1 Tela de Autenticação

- [x] Migrar `app/auth/login/page.jsx` → `app/auth/login.tsx`
- [x] Substituir componentes HTML por RN:
  - [x] `<form>` → State + handlers
  - [x] `<input>` → `<TextInput>`
  - [x] `<button>` → `<Button>` customizado
- [x] Manter validações e lógica de erro
- [x] Adaptar estilos (Tailwind classes → NativeWind)
- [x] Testar login completo

#### 4.2 Tela de Join (Convite)

- [x] Migrar `app/auth/join/[code]/page.jsx` → `app/auth/join/[code].tsx`
- [x] Adaptar formulário de pergunta secreta
- [x] Manter lógica de validação de convite
- [x] Testar fluxo completo de join

#### 4.3 Galeria de Fotos

- [x] Migrar `app/galeria/page.jsx` → `app/(tabs)/galeria.tsx`
- [x] Substituir grid Masonry:
  - [x] Usar `FlatList` com `numColumns={2}`
  - [x] Ou usar `@shopify/flash-list` (performance)
- [x] Migrar componente `PhotoCard`:
  - [x] Substituir `<img>` por `<Image>` do React Native
  - [x] Usar `expo-image` (caching automático)
  - [x] Manter reações e favoritos
- [x] Implementar lightbox modal:
  - [x] Swipe para fechar (react-native-gesture-handler)
  - [x] Pinch to zoom (react-native-reanimated)
  - [x] Navegação entre fotos (swipe lateral)
- [x] Testar:
  - [x] Grid responsivo
  - [x] Scroll performance
  - [x] Lightbox gestos

#### 4.4 Tela de Mensagens

- [x] Migrar `app/mensagens/page.jsx` → `app/(tabs)/mensagens.tsx`
- [x] Usar `FlatList` para lista de mensagens
- [x] Migrar componente de input de mensagem
- [x] Manter sistema de reações
- [x] Implementar pull-to-refresh
- [x] Testar:
  - [x] Enviar mensagem
  - [x] Receber em realtime
  - [x] Reagir com emoji

#### 4.5 Tela de Música (Spotify)

- [x] Migrar `app/musica/page.jsx` → `app/(tabs)/musica.tsx`
- [x] Adaptar lista de músicas (FlatList)
- [x] Migrar componente de busca
- [x] Implementar player (se tiver preview_url)
- [x] Testar playlist colaborativa

#### 4.6 Outras Telas

- [ ] Migrar Conquistas (`app/conquistas`)
- [ ] Migrar Razões (`app/razoes`)
- [ ] Migrar Surpresas (`app/surpresas`)
- [ ] Migrar Dashboard (`app/dashboard`)
- [ ] Migrar Legado (`app/legado`)

#### 4.7 Stories

- [ ] Migrar componente de Stories completo
- [ ] Implementar swipe between stories (PanGestureHandler)
- [ ] Barra de progresso animada (Reanimated)
- [ ] Tap para pausar/avançar
- [ ] Testar transições fluidas

### Fase 5: Polimento e Otimização (1-2 semanas)

#### 5.1 Performance

- [ ] Implementar virtualização em listas longas:
  - [ ] Usar `@shopify/flash-list` no lugar de `FlatList`
  - [ ] Lazy load de imagens
- [ ] Otimizar imagens:
  - [ ] Usar `expo-image` (caching automático)
  - [ ] Progressive loading (blur-up)
  - [ ] Limitar tamanho de upload (max 1920px)
- [ ] Adicionar error boundaries:
  - [ ] `react-native-error-boundary`
  - [ ] Tela de erro user-friendly
- [ ] Adicionar loading states:
  - [ ] Skeleton screens
  - [ ] Spinners em operações async
- [ ] Testar performance:
  - [ ] Flipper debugger
  - [ ] React DevTools Profiler

#### 5.2 UX/UI Nativo

- [ ] Implementar Pull-to-Refresh em todas as listas
- [ ] Adicionar Haptic Feedback em interações:
  - [ ] Botões (Light impact)
  - [ ] Tabs (Selection)
  - [ ] Ações importantes (Medium/Heavy)
- [ ] Implementar gestos nativos:
  - [ ] Swipe to delete (mensagens, fotos)
  - [ ] Long press para opções contextuais
  - [ ] Double tap para favoritar
- [ ] Adicionar transições de tela suaves
- [ ] Implementar empty states (sem conteúdo)
- [ ] Testar em diferentes tamanhos de tela

#### 5.3 Acessibilidade

- [ ] Adicionar `accessibilityLabel` em botões
- [ ] Adicionar `accessibilityRole` em componentes
- [ ] Testar com VoiceOver (iOS) e TalkBack (Android)
- [ ] Garantir contraste de cores (WCAG AA)
- [ ] Testar navegação por teclado

#### 5.4 Offline Mode

- [ ] Implementar detecção de conectividade:
  - [ ] `@react-native-community/netinfo`
- [ ] Adicionar banner de "Sem internet"
- [ ] Cache de fotos já visualizadas (expo-image faz automático)
- [ ] Queue de uploads pendentes:
  - [ ] Salvar em AsyncStorage
  - [ ] Retry automático quando online
- [ ] Indicar status de sync (enviando, enviado, erro)

#### 5.5 Onboarding

- [ ] Criar tela de boas-vindas (primeira abertura)
- [ ] Tutorial interativo:
  - [ ] Como adicionar fotos
  - [ ] Como enviar mensagens
  - [ ] Como reagir
  - [ ] Como usar Spotify
- [ ] Pedir permissões com contexto:
  - [ ] "Permitir notificações para saber quando seu amor reagir"
  - [ ] "Permitir câmera para adicionar fotos"
  - [ ] "Permitir microfone para gravar mensagens"

### Fase 6: Recursos Exclusivos Nativos (Opcional, 1-2 semanas)

#### 6.1 Widgets

- [ ] Pesquisar libraries de widgets:
  - [ ] iOS: Swift UI widgets (requer custom native module)
  - [ ] Android: AppWidget via Java/Kotlin
- [ ] Implementar widget simples:
  - [ ] Contador de dias juntos
  - [ ] Última foto adicionada
  - [ ] Mensagem aleatória
- [ ] Testar atualização automática

#### 6.3 Compartilhamento Nativo

- [ ] Implementar Share API:
  - [ ] Compartilhar foto externa (WhatsApp, Instagram)
  - [ ] Compartilhar mensagem
  - [ ] Compartilhar música do Spotify
- [ ] Testar com diferentes apps

#### 6.5 Biometria

- [ ] Implementar `expo-local-authentication`
- [ ] Adicionar toggle nas configurações:
  - [ ] "Proteger app com FaceID/TouchID"
- [ ] Solicitar biometria ao abrir app
- [ ] Fallback para senha

### Fase 7: Build e Distribuição (1 semana)

#### 7.1 Preparação para Build

- [ ] Configurar ícone do app (1024x1024 PNG)
- [ ] Configurar splash screen (2732x2732 PNG)
- [ ] Definir versão (1.0.0) e build number (1)
- [ ] Configurar `app.json`:
  - [ ] `name`, `slug`, `description`
  - [ ] `bundleIdentifier` (iOS)
  - [ ] `package` (Android)
  - [ ] `permissions` (câmera, microfone, notificações)
  - [ ] `scheme` para deep linking
- [ ] Revisar `.env` (remover secrets de development)
- [ ] Testar build local primeiro:
  - [ ] `npx expo run:android`
  - [ ] `npx expo run:ios`

#### 7.2 Build Android (APK)

- [ ] Configurar `eas.json` (perfil `preview`)
- [ ] Criar keystore Android:
  - [ ] `eas credentials` (Expo gera automaticamente)
- [ ] Build APK:
  - [ ] `eas build --platform android --profile preview`
- [ ] Aguardar build (15-30min)
- [ ] Baixar APK do link fornecido
- [ ] Instalar no celular:
  - [ ] Habilitar "Fontes desconhecidas"
  - [ ] Transferir APK via USB ou link
  - [ ] Instalar e testar completo

#### 7.3 Build iOS (Escolher uma opção)

**Opção A: TestFlight** (requer Apple Developer $99/ano)

- [ ] Criar Apple Developer Account
- [ ] Configurar App ID no Apple Developer Portal
- [ ] Configurar Push Notification entitlement
- [ ] Build iOS:
  - [ ] `eas build --platform ios --profile production`
- [ ] Submit para TestFlight:
  - [ ] `eas submit --platform ios`
- [ ] Convidar tester via email (TestFlight)

**Opção B: Adhoc** (gratuito, até 100 devices)

- [ ] Obter UDID do iPhone:
  - [ ] `eas device:create`
- [ ] Adicionar UDID ao perfil de provisioning
- [ ] Build adhoc:
  - [ ] `eas build --platform ios --profile preview`
- [ ] Instalar via link de download

**Opção C: Expo Go** (apenas para desenvolvimento)

- [ ] `npx expo start`
- [ ] Escanear QR code no app Expo Go
- [ ] **Limitação**: não funciona com Firebase/Push nativo

#### 7.4 Configurar OTA Updates

- [ ] Configurar canal de updates no `app.json`
- [ ] Implementar auto-update no `app/_layout.tsx`
- [ ] Testar update:
  - [ ] Fazer mudança no código
  - [ ] `eas update --branch production --message "Fix bug"`
  - [ ] Abrir app e verificar update

#### 7.5 Teste Completo em Produção

- [ ] Testar todas as funcionalidades:
  - [ ] Login/Logout
  - [ ] Adicionar fotos (câmera + galeria)
  - [ ] Enviar mensagens
  - [ ] Reagir com emojis
  - [ ] Gravar áudio
  - [ ] Conectar Spotify
  - [ ] Adicionar música à playlist
  - [ ] Ver stories
  - [ ] Notificações push (foreground, background, fechado)
  - [ ] Deep linking
  - [ ] Offline mode
- [ ] Testar em ambos os celulares (vocês 2)
- [ ] Coletar feedback inicial

### Fase 8: Monitoramento e Iteração (Contínuo)

#### 8.1 Analytics e Monitoramento

- [ ] Configurar Sentry (error tracking):
  - [ ] `@sentry/react-native`
  - [ ] Plano gratuito: 5.000 events/mês
- [ ] Configurar analytics (opcional):
  - [ ] Expo Analytics (gratuito)
  - [ ] Plausible (se quiser métricas de uso)
- [ ] Implementar logging personalizado:
  - [ ] Log de uploads
  - [ ] Log de notificações
  - [ ] Log de erros customizados

#### 8.2 Feedback Loop

- [ ] Criar canal de feedback no app:
  - [ ] Botão "Reportar problema"
  - [ ] Envia email ou salva no Supabase
- [ ] Documentar bugs encontrados
- [ ] Priorizar correções

#### 8.3 Atualizações Contínuas

- [ ] Planejar features futuras (ver seção "Ideias de Melhorias")
- [ ] Ciclo de atualizações:
  - [ ] Minor updates (bug fixes): OTA (instantâneo)
  - [ ] Major updates (features): Novo build (mensal)
- [ ] Manter changelog documentado

---

## 📊 Resumo Executivo

### Por Que Migrar?

| PWA Atual                 | App Nativo                    |
| ------------------------- | ----------------------------- |
| Push não confiável no iOS | ✅ Push nativo 100% confiável |
| Cache limitado (~50MB)    | ✅ Cache ilimitado            |
| Sem widgets               | ✅ Home screen widgets        |
| Animações 60fps limitadas | ✅ Animações 120fps nativas   |
| Depende do browser        | ✅ App standalone             |
| Sem live activities       | ✅ Live activities (iOS)      |
| Distribuição confusa      | ✅ TestFlight ou APK direto   |

### Tempo e Custo

- **Tempo Estimado**: 10-15 semanas (2.5-4 meses) com dedicação part-time
- **Tempo Mínimo**: 6-8 semanas com dedicação full-time
- **Custo Total**: **$0** (100% gratuito!)
- **Esforço**: Médio (stack simplificada facilita bastante)

### Stack Final Recomendada (Simplificada)

```
✅ Core:
- Expo SDK 52 (React Native 0.76)
- TypeScript
- Expo Router (navegação file-based, igual Next.js)

✅ UI/Estilos:
- StyleSheet nativo (sem NativeWind)
- React Native Reanimated + Moti (animações)
- expo-image (images com cache)

✅ Backend:
- Supabase (mantido do PWA)
- AsyncStorage (local storage)
- expo-secure-store (credenciais)

✅ Recursos Nativos:
- Expo Notifications (push sem Firebase!)
- expo-image-picker (câmera/galeria)
- expo-av (gravação de áudio)
- expo-haptics (vibração)
- expo-auth-session (Spotify OAuth)

✅ Build/Deploy:
- EAS Build (30 builds/mês grátis)
- OTA Updates (Expo Updates)
```

### Código Reutilizável

- ✅ **100%**: Lógica de negócio, utils, types, Supabase queries
- ✅ **90%**: Integração Supabase (apenas mudar import)
- ✅ **80%**: Hooks (manter lógica, mudar apenas APIs nativas)
- ⚠️ **40%**: UI components (manter estrutura, reescrever JSX → RN)
- ⚠️ **20%**: Estilos (Tailwind classes → StyleSheet, mas mesmos valores)
- ❌ **0%**: Framer Motion (usar Moti), Service Worker (não existe em nativo), Web Push (usar Expo Notifications)

### Próximos Passos

1. **Ler este documento completo** para entender escopo total
2. **Decisão**: Validar se quer prosseguir com a migração
3. **Setup Inicial** (Fase 1):
   - Instalar Expo CLI: `npm install -g eas-cli`
   - Criar projeto: `npx create-expo-app sindoca-native --template tabs`
   - Criar conta Expo (gratuita)
4. **Configurar Supabase** (Fase 1.3):
   - Copiar `.env` do PWA
   - Instalar polyfills
   - Testar conexão
5. **Push Notifications** (Fase 1.4):
   - Implementar Expo Notifications (código completo no doc)
   - Criar API route para envio
   - Testar em dispositivo físico
6. **Migrar Componentes** (Fases 2-4):
   - UI Base → Telas → Recursos nativos
   - Testar continuamente
7. **Build e Distribuição** (Fase 7):
   - `eas build --platform android` (APK)
   - `eas build --platform ios` (gratuito!)
   - Instalar nos 2 celulares

**Posso executar qualquer fase automaticamente. Basta me pedir: "Execute a Fase 1 completa"**

---

## 🎯 Conclusão

A migração do Sindoca PWA para app nativo é **100% viável**, **100% gratuita**, e trará **benefícios significativos** para a experiência de uso, especialmente em:

- **Push notifications 100% confiáveis** (principal ganho - iOS funciona perfeitamente!)
- **Performance superior** (animações 120fps, acesso direto ao hardware)
- **Integração profunda com sistema** (widgets, live activities, compartilhamento nativo)
- **Recursos exclusivos** (biometria, background sync, haptic feedback avançado)
- **Distribuição simplificada** (link direto para instalação, sem App Store)

### Por Que Esta Stack é Ideal?

✅ **Simplicidade Máxima**: Sem Firebase, sem NativeWind, sem libs desnecessárias
✅ **100% Expo**: Tudo funciona out-of-the-box, docs excelentes, comunidade ativa
✅ **Custo Zero**: Build, push notifications, distribuição - tudo gratuito
✅ **Reutilização Alta**: 80%+ da lógica pode ser copiada direto do PWA
✅ **Manutenção Fácil**: Stack estável, poucas dependências, updates OTA

### Arquitetura do Projeto Atual

O projeto está **muito bem estruturado**, com:

- **Lógica de negócio modular** (100% reutilizável)
- **Hooks customizados** (fácil adaptação)
- **Supabase Realtime** (funciona idêntico em RN)
- **TypeScript completo** (migração type-safe)

O maior esforço será na reescrita de **UI components** (HTML → React Native) e **estilos** (Tailwind → StyleSheet), mas ambos são processos mecânicos e diretos.

### Recomendação de Implementação

**Abordagem Incremental** (recomendado):

1. **MVP (2-3 semanas)**: Auth + Galeria + Push Notifications
2. **Testar com vocês 2**: Validar experiência, coletar feedback
3. **Expandir (4-6 semanas)**: Mensagens, Spotify, Stories, etc
4. **Polir (1-2 semanas)**: Animações, UX nativa, otimizações

**Benefício**: Valida a arquitetura rapidamente sem comprometer tempo total.

### Quando Começar?

**Agora é o momento ideal**:

- Expo SDK 52 é estável e maduro
- React Native 0.76 trouxe melhorias de performance
- Vocês têm um projeto bem estruturado para migrar
- Não há custos financeiros envolvidos
- Push notifications funcionarão perfeitamente (vs PWA quebrado no iOS)

**Posso começar a implementação imediatamente. Basta dizer: "Vamos começar!"**

---

**Documento criado por Claude Code para migração de Sindoca PWA → App Nativo**
**Última atualização**: 12/01/2025
**Contato para dúvidas**: Reabrir este contexto e perguntar!

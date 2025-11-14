# Como Corrigir PWA Abrindo em Modo Navegador no Android

## 🔍 Problema

O PWA está abrindo com a barra do navegador visível (mostrando ícone do Chrome/Samsung Internet) em vez de abrir como um app nativo standalone.

### ❌ Modo Navegador (Incorreto)
- Barra do navegador visível no topo
- Ícone do Chrome/navegador aparece
- URL visível
- Botões de navegação do navegador

### ✅ Modo Standalone (Correto)
- Sem barra do navegador
- App ocupa tela toda
- Sem URL visível
- Parece app nativo

---

## 🎯 Causa do Problema

O PWA foi **adicionado à tela inicial** mas não foi **instalado** corretamente. Existem duas formas de adicionar um PWA à tela inicial no Android:

1. **Método Incorreto**: "Adicionar à tela inicial" pelo menu do navegador
   - ❌ Cria apenas um atalho
   - ❌ Abre em modo navegador

2. **Método Correto**: Banner de instalação do PWA ou opção "Instalar app"
   - ✅ Instala como PWA real
   - ✅ Abre em modo standalone

---

## 🔧 Solução: Reinstalar o PWA Corretamente

### Passo 1: Remover o Atalho Atual

1. **Pressionar e segurar** o ícone do Sindoca na tela inicial
2. Selecionar **"Desinstalar"** ou **"Remover"**
3. Confirmar

### Passo 2: Limpar Cache do Navegador

1. Abrir **Chrome** (ou navegador que estava usando)
2. Ir em **⋮ (três pontos) → Configurações → Privacidade e segurança**
3. Tocar em **"Limpar dados de navegação"**
4. Selecionar:
   - ✅ Cookies e dados de sites
   - ✅ Imagens e arquivos em cache
5. **Período**: Últimas 24 horas
6. Tocar em **"Limpar dados"**

### Passo 3: Reinstalar o PWA Corretamente

#### Opção A: Via Banner de Instalação (Recomendado)

1. Abrir o Chrome
2. Acessar o Sindoca: `https://sindoca.vercel.app` (ou seu domínio)
3. **Aguardar 3-5 segundos**
4. Um banner aparecerá na parte inferior: **"Adicionar Sindoca à tela inicial"**
5. Tocar em **"Adicionar"** ou **"Instalar"**
6. Confirmar na popup: **"Instalar app"**

#### Opção B: Via Menu do Chrome

1. Abrir o Chrome
2. Acessar o Sindoca
3. Tocar em **⋮ (três pontos)** no canto superior direito
4. Procurar opção **"Instalar app"** ou **"Adicionar à tela inicial"**
   - ⚠️ **ATENÇÃO**: Escolha a opção que diz **"Instalar app"**, não apenas "Adicionar à tela inicial"
5. Confirmar

### Passo 4: Verificar Instalação

1. Ir para a tela inicial
2. Abrir o Sindoca pelo novo ícone
3. Verificar:
   - ✅ **Sem** barra do navegador no topo
   - ✅ **Sem** ícone do Chrome
   - ✅ App ocupa tela toda
   - ✅ Splash screen ao abrir (tela rosa com logo)

---

## 🛠️ Correções Implementadas no Código

### 1. Manifest.json

**Mudanças**:
- `display_override`: `["standalone", "fullscreen"]` (força standalone)
- `start_url`: `"/?source=pwa"` (detecta origem PWA)
- `prefer_related_applications`: `false` (não redireciona para Play Store)

**Arquivo**: `/public/manifest.json`

```json
{
  "display": "standalone",
  "display_override": ["standalone", "fullscreen"],
  "start_url": "/?source=pwa",
  "prefer_related_applications": false
}
```

### 2. Meta Tags (layout.jsx)

**Adicionadas**:
- `<meta name="theme-color" content="#ff6b9d">` (cor da barra de status)
- `<meta name="color-scheme" content="light">` (força tema claro)
- `<meta name="mobile-web-app-capable" content="yes">` (habilita modo app)

**Arquivo**: `/app/layout.jsx:51-62`

---

## 🔍 Como Saber se Está Correto

### Método 1: Visual

- ❌ **Incorreto**: Vê barra do navegador, URL, ícone do Chrome
- ✅ **Correto**: App em tela cheia, sem barra do navegador

### Método 2: Via Código (DevTools Remote)

1. No desktop, abrir Chrome e acessar: `chrome://inspect`
2. Conectar Android via USB
3. Habilitar "Depuração USB" no Android
4. Inspecionar o Sindoca
5. No console, executar:

```javascript
// Se retornar true, está em modo standalone
window.matchMedia('(display-mode: standalone)').matches

// Deve mostrar "standalone"
window.navigator.standalone
```

### Método 3: Verificar Notificações

- Se as notificações aparecerem **sem** texto "do Chrome", está correto
- Se aparecer "do Chrome" ou "via Chrome", está em modo navegador

---

## 🚨 Problemas Comuns

### 1. "Instalar app" não aparece no menu

**Causas**:
- Cache antigo do navegador
- Manifest não carregou corretamente
- Já existe versão antiga instalada

**Solução**:
1. Limpar cache completo do Chrome
2. Fechar **todos** os tabs do Sindoca
3. Reiniciar o Chrome
4. Acessar novamente

### 2. Banner de instalação não aparece

**Causas**:
- PWA já foi instalado anteriormente e removido
- Chrome "lembra" da rejeição anterior

**Solução**:
1. Limpar cache e dados do Chrome (Passo 2 acima)
2. Ou usar método via menu (⋮ → "Instalar app")

### 3. Continua abrindo em modo navegador

**Causas**:
- Usou "Adicionar à tela inicial" em vez de "Instalar app"
- Abriu pelo navegador em vez do ícone do PWA

**Solução**:
1. Remover completamente o atalho atual
2. Desinstalar versão antiga (se houver)
3. Seguir **exatamente** os passos da reinstalação

---

## 📱 Diferenças: iOS vs Android

### iOS (iPhone 13 - Correto)

- ✅ Sempre abre em modo standalone
- ✅ Safari força PWA a abrir como app
- ✅ Método: "Adicionar à Tela Inicial" funciona corretamente

### Android (Galaxy S23 - Problema Resolvido)

- ⚠️ Chrome tem dois métodos (atalho vs instalação)
- ⚠️ Precisa usar método correto de instalação
- ✅ Após correções, funcionará igual ao iOS

---

## ✅ Checklist de Verificação

- [ ] Removeu atalho antigo da tela inicial
- [ ] Limpou cache do navegador Chrome
- [ ] Reinstalou usando "Instalar app" (não "Adicionar à tela inicial")
- [ ] App abre sem barra do navegador
- [ ] Notificações aparecem sem "do Chrome"
- [ ] Splash screen (tela rosa) aparece ao abrir
- [ ] App está em modo portrait (não rotaciona)

---

## 🎯 Resultado Esperado

Após seguir todos os passos:

1. ✅ PWA abre como app nativo (sem barra do navegador)
2. ✅ Notificações aparecem como "Sindoca" (não "do Chrome")
3. ✅ Splash screen rosa ao abrir
4. ✅ Ícone na tela inicial funciona como app independente
5. ✅ Funciona igual ao iPhone

---

## 📞 Suporte

Se após seguir todos os passos o problema persistir:

1. **Tire screenshot** do app aberto (mostrando a barra do navegador se houver)
2. **Tire screenshot** do menu de instalação do Chrome
3. **Verifique** qual versão do Chrome está usando:
   - Chrome → ⋮ → Configurações → Sobre o Chrome
4. **Compartilhe** essas informações para análise

**Versão mínima requerida**: Chrome 90+

---

## 🔄 Atualização Futura

Quando o código for atualizado (novo deploy), o PWA instalado será atualizado automaticamente. Não é necessário reinstalar.

Para forçar atualização:
1. Fechar completamente o app
2. Abrir novamente
3. Service Worker v9 será instalado automaticamente

---

**Data**: 2025-11-14
**Versão das correções**: 1.0
**Status**: ✅ Correções implementadas, aguardando teste

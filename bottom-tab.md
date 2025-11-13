# Prompt para Claude Code: Refatoração Bottom Tab Bar Flutuante

## Objetivo

Refatorar a bottom tab bar existente para um design flutuante moderno, com variações específicas para iOS e Android que se integram naturalmente com cada sistema operacional.

## Requisitos Gerais

### 1. Estrutura Base

- Converter a tab bar atual para um design flutuante com bordas arredondadas
- Adicionar detecção automática de sistema operacional (iOS/Android)
- Aplicar estilos específicos baseado no SO detectado
- Manter todas as funcionalidades existentes (navegação, estados ativos, etc)

### 2. Detecção de Sistema Operacional

Implementar função de detecção:

```javascript
function detectOS() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}
```

### 3. Design iOS

**Características visuais:**

- Border radius: `28px` (mais arredondado)
- Padding interno: `12px`
- Altura da tab bar: `70px`
- Backdrop blur effect (glassmorphism): `backdrop-filter: blur(20px) saturate(180%)`
- Background semi-transparente: usar cor primária com `opacity: 0.85`
- Shadow sutil e elevada: `0 10px 40px rgba(0,0,0,0.12)`
- Ícones: tamanho `24px`
- Labels: font-size `11px`, font-weight `500`
- Espaçamento entre aba: `gap: 6px`
- Animação de escala no ativo: `transform: scale(1.15)`
- Transição suave: `cubic-bezier(0.4, 0, 0.2, 1)`

**Comportamento da tab ativa (iOS):**

- Ícone sobe levemente: `translateY(-4px)`
- Ícone aumenta: `scale(1.15)`
- Label aparece com fade-in suave
- Sem background sólido, apenas o ícone se destaca

### 4. Design Android

**Características visuais:**

- Border radius: `24px` (menos arredondado que iOS)
- Padding interno: `8px`
- Altura da tab bar: `64px`
- Background mais sólido: usar cor primária com `opacity: 0.95`
- Shadow mais marcada: `0 8px 24px rgba(0,0,0,0.18)`
- Ícones: tamanho `24px`
- Labels: font-size `12px`, font-weight `600`
- Espaçamento entre abas: `gap: 4px`
- Ripple effect no toque (usar pseudo-elemento)
- Indicador superior na tab ativa: borda superior de `3px` com cor de destaque

**Comportamento da tab ativa (Android):**

- Indicador superior colorido (usar cor de accent ou primária mais vibrante)
- Ícone não escala, mas muda de cor para versão mais vibrante
- Label sempre visível, muda peso da fonte para `700` quando ativo
- Pequeno ripple effect ao tocar

### 5. Animações e Transições

**iOS:**

```css
transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
```

**Android:**

```css
transition: all 0.25s cubic-bezier(0.4, 0, 0.6, 1);
```

### 6. Posicionamento

- `position: fixed` (não absolute)
- `bottom: 20px` para criar o efeito flutuante
- `left: 16px` e `right: 16px` (margens laterais)
- `z-index: 1000` para ficar acima do conteúdo
- Adicionar `padding-bottom: 100px` no container principal do app

### 7. Paleta de Cores

**Importante:** Usar as variáveis CSS existentes do projeto:

- Background: `var(--primary-color)` ou `var(--background-secondary)`
- Ícones ativos: `var(--accent-color)` ou `var(--primary-color)`
- Ícones inativos: `var(--text-secondary)` com opacidade
- Labels: `var(--text-primary)` quando ativo, `var(--text-secondary)` quando inativo
- Shadow: usar `var(--shadow-color)` se existir

Se as variáveis não existirem, usar as cores hardcoded atuais mas sugerir criar variáveis CSS.

### 8. Responsividade

- Em telas maiores que `768px`, centralizar a tab bar com `max-width: 500px` e `margin: 0 auto`
- Manter proporções harmoniosas em diferentes tamanhos de tela

### 9. Acessibilidade

- Manter todos os atributos ARIA existentes
- Garantir contraste adequado entre ícones e background
- Labels devem ser sempre legíveis (mesmo quando "ocultas" no iOS, devem estar no DOM)

### 10. Safe Area (iOS)

Se o projeto suporta iOS com notch:

```css
padding-bottom: max(20px, env(safe-area-inset-bottom));
```

## Implementação Sugerida

1. **Criar arquivo de estilos separado:** `TabBar.styles.js` ou `tabbar.css`
2. **Adicionar classes condicionais:** `.tabbar-ios` e `.tabbar-android`
3. **Aplicar classe dinamicamente** no componente baseado na detecção do SO
4. **Testar em ambos os ambientes** (Chrome DevTools com user agent alterado)

## Observações Importantes

- ⚠️ NÃO remover funcionalidades existentes
- ⚠️ NÃO mudar a estrutura de navegação/roteamento
- ✅ Manter compatibilidade com código existente
- ✅ Adicionar comentários explicando as diferenças entre iOS e Android
- ✅ Preservar todos os event listeners e lógica de estado

## Resultado Esperado

Uma bottom tab bar flutuante que:

- Detecta automaticamente o sistema operacional
- Aplica o design apropriado (iOS glassmorphism ou Android material)
- Mantém todas as funcionalidades existentes
- Usa a paleta de cores do projeto
- Tem animações suaves e apropriadas para cada plataforma
- Funciona perfeitamente em diferentes tamanhos de tela

---

**Após a implementação, por favor:**

1. Mostre um diff das mudanças principais
2. Liste os arquivos modificados
3. Indique se foram criados novos arquivos
4. Sugira melhorias adicionais se houver

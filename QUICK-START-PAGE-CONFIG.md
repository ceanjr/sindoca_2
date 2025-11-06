# Guia Rápido - Sistema de Controle de Páginas

## ⚡ Setup Rápido (5 minutos)

### 1. Executar SQL no Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Vá para seu projeto
3. Clique em **SQL Editor**
4. Copie e cole o conteúdo de `supabase-page-config.sql`
5. Clique em **Run** (ou pressione Ctrl+Enter)

Você verá a mensagem:
```
Success. No rows returned
```

### 2. Verificar Criação da Tabela

1. Vá para **Table Editor**
2. Procure `page_config` na lista
3. Você deve ver 8 registros

### 3. Testar Localmente

```bash
# Restart o servidor (se já estiver rodando)
npm run dev
```

### 4. Verificar Funcionalidades

**Teste 1: Proteção de Rotas**
1. Abra o navegador em modo anônimo
2. Tente acessar http://localhost:3000
3. Deve redirecionar para `/auth/login` ✅

**Teste 2: Login e Acesso**
1. Faça login normalmente
2. Deve conseguir acessar todas as páginas ✅

**Teste 3: Painel Admin (apenas celiojunior0110@gmail.com)**
1. Faça login com `celiojunior0110@gmail.com`
2. **No desktop**, veja o botão de engrenagem no sidebar (rodando devagar) ✅
3. Clique no botão
4. Modal de configuração deve abrir ✅

**Teste 4: Desativar Página**
1. No modal admin, desative "Galeria"
2. Veja o link da galeria ficar esmaecido ✅
3. Tente clicar - não deve fazer nada ✅
4. Passe o mouse - tooltip mostra "(Desativada)" ✅

**Teste 5: Reativar Página**
1. No modal admin, reative "Galeria"
2. Link volta ao normal ✅
3. Clique funciona novamente ✅

## 🎨 Experiência Visual

### Botão Admin
- **Localização**: Sidebar esquerdo (desktop), parte inferior
- **Aparência**: Gradiente rosa-verde com ícone de engrenagem girando devagar
- **Visibilidade**: Apenas celiojunior0110@gmail.com

### Páginas Desativadas
- **Opacidade**: 40% (bem visível que está desativado)
- **Cursor**: not-allowed (ícone de proibido)
- **Cor**: Cinza (#gray-400)
- **Hover**: Sem efeito de scale (diferente das ativas)
- **Tooltip**: Mostra "(Desativada)" após o nome

### Modal Admin
- **Fundo**: Overlay escuro com blur
- **Animação**: Scale in suave
- **Toggles**: Verde quando ativo, cinza quando desativo
- **Loading**: Spinner ao atualizar
- **Realtime**: Atualiza instantaneamente

## 🔍 Debugging

### Console Logs Úteis

Abra DevTools Console (F12) e procure por:

```javascript
// Quando abre a página
"📊 Photos state changed: X photos"

// Quando carrega configuração
"Page config changed: { ... }"

// Quando atualiza status
✅ ou ❌ indicando sucesso/erro
```

### Verificar Estado do Hook

No console do navegador:
```javascript
// Verificar se é admin
console.log(user?.email === 'celiojunior0110@gmail.com')

// Ver configuração atual
// (use React DevTools)
```

## 🚨 Problemas Comuns

**❌ "Cannot read properties of undefined (reading 'from')"**
- Supabase não inicializado corretamente
- Verifique variáveis de ambiente `.env.local`

**❌ Botão admin não aparece**
- Não está em desktop (precisa largura > 1024px)
- Não está logado com celiojunior0110@gmail.com
- Hook ainda está carregando

**❌ RLS Policy Error ao atualizar**
- Verifique se o SQL de policies foi executado
- Verifique se está logado com o email correto
- Token do Supabase pode estar expirado (re-login)

**❌ Páginas desativadas ainda clicam**
- Cache do navegador (Ctrl+Shift+R)
- Hook não carregou ainda (espere 1-2 segundos)
- Verificar se `is_active` está false no banco

## ✅ Checklist de Verificação

- [ ] Tabela `page_config` criada no Supabase
- [ ] 8 registros na tabela
- [ ] Políticas RLS criadas
- [ ] Middleware.ts existe na raiz do projeto
- [ ] Server reiniciado após mudanças
- [ ] Login funcionando
- [ ] Redirecionamento para login quando não autenticado
- [ ] Botão admin aparece para celiojunior0110@gmail.com
- [ ] Modal abre ao clicar no botão
- [ ] Toggles funcionam
- [ ] Links ficam disabled quando página desativada
- [ ] Sincronização em tempo real funciona

## 📱 Comportamento Mobile vs Desktop

### Desktop (> 1024px)
- Sidebar fixa à esquerda
- Botão admin visível na parte inferior
- Tooltips ao lado dos ícones

### Mobile (< 1024px)
- Menu hambúrguer
- Sem botão admin (não é necessário)
- Texto "(Desativada)" inline com o nome

## 🎯 Próximos Passos

1. **Testar em produção**: Executar SQL no banco de produção
2. **Monitorar uso**: Ver quais páginas são mais desativadas
3. **Logs de auditoria**: Adicionar rastreamento de quem desativou o quê
4. **Notificações**: Avisar usuários quando páginas ficam indisponíveis
5. **Agendamento**: Permitir agendar ativação/desativação

## 💪 Recursos Avançados (Futuro)

- [ ] Desativar por período (ex: manutenção agendada)
- [ ] Mensagem customizada para páginas desativadas
- [ ] Histórico de mudanças
- [ ] Permissões granulares por usuário
- [ ] API endpoint para controle programático

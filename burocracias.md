# 🌩️ Burocracias a Dois - Especificação Completa

> **Página de discussões para casais**: Uma fusão única de chat + fórum, projetada especificamente para duas pessoas resolverem assuntos sérios, quase sérios e zero sérios.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura Visual](#estrutura-visual)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Sistema de Threads (Conversas Aninhadas)](#sistema-de-threads)
5. [Sistema de Notificações Inteligente](#sistema-de-notificações-inteligente)
6. [Banco de Dados](#banco-de-dados)
7. [Ferramentas e Dependências](#ferramentas-e-dependências)
8. [Fluxos de Uso](#fluxos-de-uso)

---

## 🎯 Visão Geral

**Burocracias a Dois** é uma página que permite ao casal:
- Criar discussões sobre qualquer assunto (sério ou não)
- Conversar em formato de chat com mensagens rápidas
- Organizar argumentos importantes (estilo fórum)
- Criar threads (conversas aninhadas) dentro de mensagens específicas
- Acompanhar o status e resolução de cada discussão
- Ter ferramentas divertidas que tornam até as "tretas" algo memorável

---

## 🖼️ Estrutura Visual

### 1. Página Principal (Lista de Discussões)

#### Estado Vazio
```
┌─────────────────────────────────────────────┐
│                                             │
│        🧾 Burocracias a Dois                │
│                                             │
│  "Discussões sérias, quase sérias e zero    │
│   sérias — cuidadosamente documentadas."    │
│                                             │
│            [➕ Adicionar discussão]         │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │        📋                             │  │
│  │  Nenhuma burocracia cadastrada ainda. │  │
│  │  Que tal iniciar a primeira treta     │  │
│  │        diplomática?                   │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

#### Estado com Conteúdo
```
┌─────────────────────────────────────────────┐
│  🧾 Burocracias a Dois   [➕ Nova discussão]│
│                                             │
│  Filtrar por status:                        │
│  [🔥 Todas] [✅ Resolvidas] [⏸️ Pausadas]   │
│  [🤝 Acordos] [📌 Importantes]              │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ 👤 Usuario A          🔥 Em andamento   ││
│  │ 💰 Financeiro                           ││
│  │                                         ││
│  │ Divisão das contas do mês               ││
│  │ 🔥 Motivo: Desequilíbrio nos gastos     ││
│  │                                         ││
│  │ 🌡️ ████░░ Intensidade: Moderada         ││
│  │ 💬 12 mensagens • 3 não lidas           ││
│  │ ⏰ Última atividade: há 5 min           ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ 👤 Usuario B            ✅ Resolvida    ││
│  │ 🏠 Casa/Tarefas                         ││
│  │                                         ││
│  │ Quem lava a louça nas quartas           ││
│  │                                         ││
│  │ 🌡️ ██░░░░ Intensidade: Baixa            ││
│  │ 💬 8 mensagens                          ││
│  │ ⏰ Resolvida há 2 dias                  ││
│  └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### 2. Modal/Sheet: Adicionar Discussão

```
┌─────────────────────────────────────────────┐
│  Nova Discussão                    [✕]      │
├─────────────────────────────────────────────┤
│                                             │
│  📸 Adicionar imagem (opcional)             │
│  ┌─────────────────────────────────────┐   │
│  │  [📷 Clique para adicionar]         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  📂 Categoria *                             │
│  ┌─────────────────────────────────────┐   │
│  │ [💰 Financeiro ▼]                   │   │
│  └─────────────────────────────────────┘   │
│  (Opções: 💰 Financeiro, 🏠 Casa/Tarefas,   │
│   📅 Planejamento, 💔 DR, 🎮 Diversão,      │
│   📌 Importante)                            │
│                                             │
│  📝 Assunto *                               │
│  ┌─────────────────────────────────────┐   │
│  │ Ex: Divisão das contas do mês       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  📄 Dissertação *                           │
│  ┌─────────────────────────────────────┐   │
│  │ Explique o contexto da discussão... │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  🔥 Motivo da Treta (opcional)              │
│  ┌─────────────────────────────────────┐   │
│  │ Ex: Desequilíbrio nos gastos        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Cancelar]           [Criar Discussão]    │
└─────────────────────────────────────────────┘
```

### 3. Página Interna: Discussão

```
┌─────────────────────────────────────────────┐
│  ← Burocracias                              │
├─────────────────────────────────────────────┤
│  💰 Financeiro          🔥 Em andamento     │
│                                             │
│  Divisão das contas do mês                  │
│  Criado por Usuario A • há 2 horas          │
│  🔥 Desequilíbrio nos gastos                │
│                                             │
│  🌡️ Medidor de Intensidade: ████░░ Moderada │
│                                             │
│  [📝 Editar] [✅ Marcar como...] [⋮ Mais]  │
├─────────────────────────────────────────────┤
│                                             │
│  📌 ARGUMENTOS FIXADOS                      │
│  ┌─────────────────────────────────────┐   │
│  │ 💡 "Devemos usar planilha compartilh"│   │
│  │ Fixado por Usuario B • ❤️ 2          │   │
│  └─────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  💬 CONVERSA (12 mensagens, 3 não lidas)   │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 👤 Usuario A          20:15           │ │
│  │ Precisamos dividir melhor as contas   │ │
│  │ ❤️ 1  💬 Responder  📌 Fixar          │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 👤 Usuario B          20:17           │ │
│  │ Mas você gasta muito mais que eu!     │ │
│  │ 🔥 1  💬 3 respostas  👁️ Ver thread   │ │
│  │                                       │ │
│  │ ╔═════════════════════════════════╗   │ │ ← THREAD
│  │ ║ 👤 Usuario A        20:18       ║   │ │
│  │ ║ Como assim? Me dê exemplos      ║   │ │
│  │ ║ 😮 1                            ║   │ │
│  │ ║                                 ║   │ │
│  │ ║ 👤 Usuario B        20:19       ║   │ │
│  │ ║ Você pediu 5 deliveries essa    ║   │ │
│  │ ║ semana, eu pedi 1               ║   │ │
│  │ ║ 💬 Responder                    ║   │ │
│  │ ╚═════════════════════════════════╝   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 👤 Usuario A          20:25  [NOVA]  │ │
│  │ Ok, vou controlar melhor meus gastos  │ │
│  │ 💬 Responder  📌 Fixar                │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [Rascunho salvo automaticamente]          │
│  ┌─────────────────────────────────────┐   │
│  │ 💬 Digite sua mensagem...           │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│  [📷 Imagem] [😀 Emoji]        [➤ Enviar]  │
│                                             │
├─────────────────────────────────────────────┤
│  📊 ESTATÍSTICAS DA DISCUSSÃO               │
│  • 12 mensagens trocadas                    │
│  • 2 argumentos fixados                     │
│  • 3 threads criadas                        │
│  • Emojis mais usados: 🔥 😂 ❤️             │
│  • Última resposta: há 5 min                │
└─────────────────────────────────────────────┘
```

---

## ⚙️ Funcionalidades Principais

### 1. **Categorias de Discussões**
Cada discussão pertence a uma categoria:
- 💰 **Financeiro** - Contas, gastos, investimentos
- 🏠 **Casa/Tarefas** - Limpeza, organização, tarefas domésticas
- 📅 **Planejamento** - Viagens, eventos, planos futuros
- 💔 **DR** - Relacionamento, sentimentos, conflitos
- 🎮 **Diversão** - Bobeiras, brincadeiras, debates descontraídos
- 📌 **Importante** - Assuntos urgentes ou de alta prioridade

### 2. **Status da Discussão**
Cada discussão tem um status visual:
- 🔥 **Em andamento** (padrão ao criar)
- ✅ **Resolvida** (quando chegarem a um acordo)
- ⏸️ **Pausada** (para retomar depois)
- 🤝 **Acordo fechado** (resolução oficial documentada)

**Ações disponíveis:**
- Botão "Marcar como..." permite mudar o status
- Status aparece no card da lista e no topo da discussão
- Filtro na página principal permite ver apenas discussões de um status específico

### 3. **Medidor de Intensidade** 🌡️
Um indicador sutil e divertido que mostra a "temperatura" da discussão:

**Cálculo (automático):**
- Quantidade de mensagens em curto período (ex: +10 msgs em 1h)
- Uso de palavras-chave: "mas", "porém", "sempre", "nunca", "você sempre", "você nunca"
- Emojis de alta intensidade: 🔥, 💢, 😤, 😡

**Níveis:**
- 🟢 **Paz mundial** (0-20%)
- 🟡 **Conversa civilizada** (21-40%)
- 🟠 **Esquentando** (41-60%)
- 🔴 **DR moderada** (61-80%)
- 🌋 **Chama o VAR** (81-100%)

**Visualização:**
- Barra de progresso colorida no card da lista
- Indicador no topo da discussão
- Texto descritivo com humor ("A temperatura está subindo! 🌡️")

### 4. **Contador de Mensagens Não Lidas**
- Badge numérico no card (ex: "3 não lidas")
- Scroll automático para primeira mensagem não lida ao abrir discussão
- Marca visual nas mensagens novas (ex: borda colorida, tag "NOVA")

### 5. **Upload de Imagens**
- **No post inicial**: Campo opcional para adicionar imagem ilustrativa
- **Nas mensagens**: Botão de câmera para anexar imagens (provas, prints, memes)
- **Compressão automática**: Usar `lib/utils/imageCompression.js`
- **Storage Supabase**: Salvar em bucket `burocracias-images`

### 6. **Rascunhos Automáticos**
- Salva automaticamente o texto digitado a cada 3 segundos
- Armazena localmente (localStorage) ou no banco (tabela `discussion_drafts`)
- Ao reabrir a discussão, recupera o rascunho
- Indicador visual: "Rascunho salvo ✓" ou "Salvando..."

### 7. **Editar e Deletar Mensagens**
**Editar:**
- Apenas mensagens próprias
- Clique longo → menu → "Editar"
- Abre o campo de texto com conteúdo atual
- Ao salvar, adiciona tag "(editado)" com timestamp

**Deletar:**
- Apenas mensagens próprias
- Clique longo → menu → "Deletar"
- Confirmação: "Tem certeza?"
- Mensagem deletada vira: "🗑️ Mensagem deletada"

### 8. **Reações nas Mensagens**
- Sistema de emojis igual ao resto do Sindoca
- Reações rápidas: ❤️, 😂, 😮, 😢, 😡, 🔥
- Suporte a emojis customizados do workspace
- Exibe contador: "❤️ 2" (clique para ver quem reagiu)

### 9. **Scroll Automático Inteligente**
Ao abrir uma discussão:
1. Se há mensagens não lidas → rola para a primeira não lida
2. Se não há não lidas → rola para o final (última mensagem)
3. Indicador visual: "3 mensagens não lidas ↓" (clique para rolar)

### 10. **Ordenação Automática**
Lista sempre ordenada por **última atividade** (mais recente no topo).

---

## 🧵 Sistema de Threads (Conversas Aninhadas)

### Conceito
Permite criar **mini-discussões dentro de mensagens específicas**, organizando debates complexos em tópicos separados.

### Como Funciona

#### 1. Criar Thread
```
Mensagem original:
┌───────────────────────────────────────┐
│ 👤 Usuario A          20:15           │
│ "Você gasta muito mais que eu!"       │
│ ❤️ 1  💬 Responder  📌 Fixar          │
└───────────────────────────────────────┘

↓ Clica em "💬 Responder"

Abre thread:
┌───────────────────────────────────────┐
│ 👤 Usuario A          20:15           │
│ "Você gasta muito mais que eu!"       │
│ 🔥 1  💬 3 respostas  👁️ Esconder     │
│                                       │
│ ╔═════════════════════════════════╗   │ ← Thread aninhada
│ ║ 👤 Usuario B        20:18       ║   │
│ ║ "Como assim? Me dê exemplos"    ║   │
│ ║ 😮 1  💬 Responder              ║   │
│ ║                                 ║   │
│ ║ [💬 Responder nesta thread...]  ║   │
│ ╚═════════════════════════════════╝   │
└───────────────────────────────────────┘
```

#### 2. Características
- **Visual diferenciado**: Indentação, borda colorida, fundo levemente diferente
- **Contador de respostas**: "💬 3 respostas"
- **Expandir/Recolher**: Clique para mostrar/ocultar thread
- **Notificações separadas**: "Nova resposta na thread sobre 'gastos'"
- **Profundidade ilimitada**: Threads podem ter threads (mas visualmente limitado a 2 níveis para não ficar confuso)

#### 3. Navegação
- Thread expandida por padrão se tiver mensagens não lidas
- Thread recolhida se já foi toda lida
- Botão "Ver todas as X respostas" se thread muito longa (mostra apenas 3 primeiras)

#### 4. Interações Dentro da Thread
- Todas as funcionalidades do chat principal:
  - Enviar mensagens
  - Upload de imagens
  - Reações
  - Editar/deletar próprias mensagens
  - Criar sub-threads (thread dentro de thread, até 2 níveis)

### Banco de Dados (Threads)
```sql
-- Mensagens com suporte a threads
discussion_messages (
  id UUID,
  discussion_id UUID,
  parent_message_id UUID NULL, -- Se NULL = mensagem principal
                                -- Se preenchido = resposta em thread
  thread_level INT DEFAULT 0,   -- 0 = principal, 1 = thread, 2 = sub-thread
  -- ... outros campos
)
```

---

## 🔔 Sistema de Notificações Inteligente

### Problema
Se um usuário enviar 5 mensagens seguidas, o parceiro NÃO deve receber 5 notificações.

### Solução: Agrupamento Inteligente

#### Regras
1. **Timer de Agrupamento**: 2 minutos
   - Se mensagens forem enviadas em intervalo < 2min → agrupa
   - Se intervalo > 2min → envia nova notificação

2. **Contador de Mensagens**
   - 1 mensagem: "Usuario A respondeu na discussão 'Divisão de contas'"
   - 2-4 mensagens: "Usuario A enviou 3 mensagens em 'Divisão de contas'"
   - 5+ mensagens: "Usuario A enviou várias mensagens em 'Divisão de contas' 🔥"

3. **Threads Separadas**
   - Mensagens em threads diferentes NÃO são agrupadas
   - "Usuario A respondeu na thread sobre 'gastos com delivery'"

#### Mensagens de Notificação (Variadas e Divertidas)

**Para mensagens normais:**
- "Seu parceiro contra-argumentou em '{assunto}' 🔥"
- "Nova resposta na discussão sobre '{assunto}'"
- "Hora de revidar na burocracia '{assunto}'"
- "{Nome} tem algo a dizer sobre '{assunto}'"
- "A discussão sobre '{assunto}' está esquentando!"
- "{Nome} enviou {N} mensagens em '{assunto}'"
- "Sua presença é requisitada em '{assunto}' ⚖️"
- "Novo desenvolvimento na treta sobre '{assunto}'"

**Para threads:**
- "Nova resposta na thread sobre '{contexto}'"
- "{Nome} respondeu sua thread em '{assunto}'"
- "Thread sobre '{contexto}' tem novidades"

**Para mudanças de status:**
- "{Nome} marcou '{assunto}' como Resolvida ✅"
- "{Nome} reabriu a discussão sobre '{assunto}' 🔥"
- "Acordo fechado em '{assunto}' 🤝"

**Para argumentos fixados:**
- "{Nome} fixou um argumento importante em '{assunto}' 📌"

**Para reações:**
- "{Nome} reagiu {emoji} à sua mensagem"
- "{Nome} amou sua resposta em '{assunto}' ❤️"

#### Implementação Técnica
```javascript
// Pseudocódigo
const GROUPING_WINDOW = 2 * 60 * 1000; // 2 minutos

async function sendNotification(discussionId, senderId, recipientId) {
  // Busca última notificação enviada para esta discussão
  const lastNotif = await getLastNotification(discussionId, recipientId);

  const now = Date.now();
  const timeSinceLastNotif = now - lastNotif.sent_at;

  if (timeSinceLastNotif < GROUPING_WINDOW) {
    // Agrupa: atualiza contador da notificação existente
    await updateNotificationCount(lastNotif.id, lastNotif.count + 1);
  } else {
    // Envia nova notificação
    await createNewNotification({
      discussion_id: discussionId,
      recipient_id: recipientId,
      sender_id: senderId,
      count: 1,
      sent_at: now
    });
  }
}
```

---

## 🗄️ Banco de Dados

### Novas Tabelas

#### 1. `discussions` (Discussões principais)
```sql
CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Conteúdo
  title TEXT NOT NULL,                    -- Assunto
  description TEXT NOT NULL,              -- Dissertação
  treta_reason TEXT,                      -- Motivo da Treta (opcional)
  category TEXT NOT NULL,                 -- financeiro, casa, planejamento, dr, diversao, importante
  image_url TEXT,                         -- Imagem opcional

  -- Status
  status TEXT DEFAULT 'em_andamento',     -- em_andamento, resolvida, pausada, acordo_fechado

  -- Métricas
  intensity_score INT DEFAULT 0,          -- 0-100 (calculado automaticamente)
  total_messages INT DEFAULT 0,
  unread_count_user_a INT DEFAULT 0,
  unread_count_user_b INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índices
  CONSTRAINT valid_category CHECK (category IN ('financeiro', 'casa', 'planejamento', 'dr', 'diversao', 'importante')),
  CONSTRAINT valid_status CHECK (status IN ('em_andamento', 'resolvida', 'pausada', 'acordo_fechado'))
);

CREATE INDEX idx_discussions_workspace ON discussions(workspace_id);
CREATE INDEX idx_discussions_last_activity ON discussions(last_activity_at DESC);
CREATE INDEX idx_discussions_status ON discussions(status);
```

#### 2. `discussion_messages` (Mensagens e Threads)
```sql
CREATE TABLE discussion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Thread support
  parent_message_id UUID REFERENCES discussion_messages(id) ON DELETE CASCADE,
  thread_level INT DEFAULT 0,             -- 0 = principal, 1 = thread, 2 = sub-thread
  thread_message_count INT DEFAULT 0,     -- Quantas respostas tem (se for parent)

  -- Conteúdo
  content TEXT NOT NULL,
  image_url TEXT,                         -- Imagem anexada

  -- Metadata
  is_pinned BOOLEAN DEFAULT FALSE,        -- Se foi fixado como argumento
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índices
  CONSTRAINT max_thread_level CHECK (thread_level <= 2)
);

CREATE INDEX idx_messages_discussion ON discussion_messages(discussion_id);
CREATE INDEX idx_messages_parent ON discussion_messages(parent_message_id);
CREATE INDEX idx_messages_created ON discussion_messages(created_at);
```

#### 3. `discussion_reactions` (Reações nas mensagens)
```sql
CREATE TABLE discussion_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES discussion_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(message_id, user_id, emoji)      -- Evita duplicatas
);

CREATE INDEX idx_reactions_message ON discussion_reactions(message_id);
```

#### 4. `discussion_drafts` (Rascunhos automáticos)
```sql
CREATE TABLE discussion_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES discussion_messages(id) ON DELETE CASCADE, -- NULL = chat principal

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(discussion_id, user_id, parent_message_id)  -- Um rascunho por contexto
);
```

#### 5. `discussion_read_status` (Controle de leitura)
```sql
CREATE TABLE discussion_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES discussion_messages(id),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(discussion_id, user_id)
);
```

#### 6. `discussion_notification_queue` (Fila de notificações)
```sql
CREATE TABLE discussion_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  message_count INT DEFAULT 1,
  last_message_content TEXT,
  notification_type TEXT,                 -- new_message, thread_reply, status_change, pinned_argument

  sent_at TIMESTAMPTZ DEFAULT NOW(),
  is_sent BOOLEAN DEFAULT FALSE,

  UNIQUE(discussion_id, recipient_id, is_sent) WHERE is_sent = FALSE
);
```

### RLS Policies (Segurança)
```sql
-- Discussions: apenas membros do workspace
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view discussions"
  ON discussions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create discussions"
  ON discussions FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Similar policies para outras tabelas...
```

---

## 🛠️ Ferramentas e Dependências

### ✅ Nenhuma nova dependência necessária!

Tudo que precisamos **já está instalado** no projeto Sindoca:

| Recurso | Ferramenta Existente | Uso |
|---------|---------------------|-----|
| **Animações** | Framer Motion | Transições, gestures, sheets |
| **Ícones** | Lucide React | Todos os ícones da UI |
| **Notificações Toast** | Sonner | Feedback visual |
| **Banco de Dados** | Supabase | PostgreSQL + Realtime |
| **Upload de Imagens** | Supabase Storage | Armazenamento de arquivos |
| **Compressão** | browser-image-compression | Otimizar imagens antes do upload |
| **Realtime** | Supabase Realtime | Sincronização automática |
| **Push Notifications** | web-push | Notificações push |
| **Reações** | Sistema customizado | Hook `useReactions` já existe |

### Arquivos a Criar/Modificar

**Novos arquivos:**
```
app/burocracias/
  ├── page.jsx                          # Página principal (lista)
  └── [id]/page.jsx                     # Página da discussão individual

components/burocracias/
  ├── DiscussionCard.jsx                # Card na lista
  ├── DiscussionSheet.jsx               # Modal de criar/editar
  ├── DiscussionChat.jsx                # Área de chat da discussão
  ├── MessageBubble.jsx                 # Bolha de mensagem
  ├── ThreadView.jsx                    # Visualização de thread aninhada
  ├── IntensityMeter.jsx                # Medidor de intensidade
  ├── PinnedArguments.jsx               # Argumentos fixados
  ├── DiscussionStats.jsx               # Estatísticas da discussão
  └── StatusBadge.jsx                   # Badge de status

hooks/
  ├── useDiscussions.js                 # Hook para lista de discussões
  ├── useDiscussionMessages.js          # Hook para mensagens de uma discussão
  └── useDiscussionDraft.js             # Hook para rascunhos

lib/api/
  └── discussions.ts                    # Operações de discussões

supabase/migrations/
  └── 018_burocracias_tables.sql        # Criação das tabelas
```

**Modificar:**
```
components/NavigationSidebar.jsx        # Adicionar link "Burocracias"
components/BottomTabBar.jsx             # Adicionar no menu mobile (Recursos)
```

---

## 🎬 Fluxos de Uso

### Fluxo 1: Criar Nova Discussão
```
1. Usuario A clica em "➕ Adicionar discussão"
2. Sheet abre com formulário
3. Preenche campos:
   - Categoria: "💰 Financeiro"
   - Assunto: "Divisão das contas do mês"
   - Dissertação: "Precisamos rever como dividimos..."
   - Motivo da Treta: "Desequilíbrio nos gastos"
   - (Opcional) Adiciona imagem
4. Clica em "Criar Discussão"
5. Discussão aparece na lista
6. Usuario B recebe notificação: "Nova discussão criada: 'Divisão das contas do mês' 🧾"
```

### Fluxo 2: Responder na Discussão
```
1. Usuario B abre a discussão
2. Lê a dissertação inicial
3. Digita mensagem: "Concordo, mas você gasta mais com delivery"
4. (Opcional) Anexa print de comprovação
5. Clica em "Enviar"
6. Mensagem aparece no chat
7. Usuario A recebe notificação: "Usuario B respondeu em 'Divisão de contas'"
```

### Fluxo 3: Criar Thread (Conversa Aninhada)
```
1. Usuario A vê mensagem do Usuario B: "Você gasta mais com delivery"
2. Clica em "💬 Responder" (ou clique longo → "Responder em thread")
3. Thread se abre visualmente aninhada
4. Usuario A digita: "Como assim? Me dê exemplos"
5. Envia
6. Thread aparece expandida com 1 resposta
7. Usuario B recebe notificação: "Nueva resposta na thread sobre 'gastos com delivery'"
8. Usuario B entra, expande thread, responde: "Você pediu 5x essa semana"
9. Conversam dentro da thread
10. Quando resolverem esse ponto específico, podem voltar ao chat principal
```

### Fluxo 4: Fixar Argumento Importante
```
1. Durante a discussão, Usuario A faz um ponto importante
2. Usuario B concorda e quer destacar
3. Clica longo na mensagem → "📌 Fixar como argumento"
4. Mensagem vai para seção "ARGUMENTOS FIXADOS" no topo
5. Fica visível sempre que alguém abre a discussão
6. Usuario A recebe notificação: "Usuario B fixou um argumento em 'Divisão de contas' 📌"
```

### Fluxo 5: Resolver Discussão
```
1. Após conversarem e chegarem a um acordo
2. Usuario A clica em "✅ Marcar como..."
3. Seleciona "🤝 Acordo fechado"
4. (Opcional) Adiciona nota: "Vamos usar planilha compartilhada"
5. Status muda para "🤝 Acordo fechado"
6. Intensidade zera
7. Card aparece com visual de "resolvido" (verde, ícone de check)
8. Usuario B recebe notificação: "Acordo fechado em 'Divisão de contas' 🤝"
```

### Fluxo 6: Notificações Inteligentes
```
CENÁRIO: Usuario A envia 5 mensagens rápidas

Mensagem 1 (20:00): "Olha isso aqui"
→ Notificação para B: "Usuario A respondeu em 'Divisão de contas'"

Mensagem 2 (20:01): "Achei os recibos"
→ Não envia notificação (< 2min da anterior)

Mensagem 3 (20:01): "Vou mandar print"
→ Não envia notificação

Mensagem 4 (20:02): [Envia imagem]
→ Não envia notificação

Mensagem 5 (20:02): "Pronto, mandei"
→ Atualiza notificação anterior: "Usuario A enviou 5 mensagens em 'Divisão de contas' 🔥"

Mensagem 6 (20:05): "Viu?"
→ Nova notificação (> 2min): "Usuario A respondeu em 'Divisão de contas'"
```

---

## 🎨 Detalhes Visuais

### Cores por Categoria
```javascript
const categoryColors = {
  financeiro: { bg: 'bg-green-50', border: 'border-green-300', icon: '💰', color: 'text-green-700' },
  casa: { bg: 'bg-blue-50', border: 'border-blue-300', icon: '🏠', color: 'text-blue-700' },
  planejamento: { bg: 'bg-purple-50', border: 'border-purple-300', icon: '📅', color: 'text-purple-700' },
  dr: { bg: 'bg-red-50', border: 'border-red-300', icon: '💔', color: 'text-red-700' },
  diversao: { bg: 'bg-yellow-50', border: 'border-yellow-300', icon: '🎮', color: 'text-yellow-700' },
  importante: { bg: 'bg-orange-50', border: 'border-orange-300', icon: '📌', color: 'text-orange-700' }
};
```

### Status Colors
```javascript
const statusColors = {
  em_andamento: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🔥' },
  resolvida: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
  pausada: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '⏸️' },
  acordo_fechado: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🤝' }
};
```

### Intensity Meter Colors
```javascript
const intensityLevels = [
  { threshold: 20, label: 'Paz mundial', color: 'bg-green-500', emoji: '🟢' },
  { threshold: 40, label: 'Conversa civilizada', color: 'bg-lime-500', emoji: '🟡' },
  { threshold: 60, label: 'Esquentando', color: 'bg-yellow-500', emoji: '🟠' },
  { threshold: 80, label: 'DR moderada', color: 'bg-orange-500', emoji: '🔴' },
  { threshold: 100, label: 'Chama o VAR', color: 'bg-red-500', emoji: '🌋' }
];
```

---

## 📊 Cálculo de Intensidade

```javascript
function calculateIntensity(discussion) {
  let score = 0;

  // 1. Frequência de mensagens (40 pontos max)
  const recentMessages = getMessagesLastHour(discussion);
  score += Math.min(recentMessages.length * 4, 40);

  // 2. Palavras-chave (30 pontos max)
  const keywords = ['mas', 'porém', 'sempre', 'nunca', 'você sempre', 'você nunca'];
  const keywordCount = countKeywordsInMessages(recentMessages, keywords);
  score += Math.min(keywordCount * 3, 30);

  // 3. Emojis intensos (30 pontos max)
  const intenseEmojis = ['🔥', '💢', '😤', '😡', '🤬'];
  const emojiCount = countEmojisInMessages(recentMessages, intenseEmojis);
  score += Math.min(emojiCount * 5, 30);

  return Math.min(score, 100); // Cap at 100
}
```

---

## ✅ Checklist de Implementação

### Fase 1: Estrutura Base ✅
- [x] Criar migrations (tabelas + RLS)
- [x] Criar página `/burocracias` (lista)
- [x] Criar página `/burocracias/[id]` (discussão individual)
- [x] Criar hook `useDiscussions`
- [x] Criar componente `DiscussionCard`
- [x] Criar componente `DiscussionSheet` (modal de criar)
- [x] Adicionar links de navegação

### Fase 2: Funcionalidades do Chat ✅
- [x] Criar hook `useDiscussionMessages`
- [x] Criar componente `MessageBubble`
- [x] Implementar envio de mensagens
- [x] Implementar upload de imagens nas mensagens
- [x] Implementar reações nas mensagens
- [x] Implementar editar mensagem
- [x] Implementar deletar mensagem
- [x] Implementar scroll automático

### Fase 3: Sistema de Threads ✅
- [x] Criar componente `ThreadView`
- [x] Implementar criação de thread
- [x] Implementar expandir/recolher thread
- [x] Implementar contador de respostas
- [x] Implementar navegação entre níveis
- [x] Implementar notificações de thread

### Fase 4: Features Avançadas ✅
- [x] Implementar categorias e filtros
- [x] Implementar status e mudanças de status
- [x] Implementar medidor de intensidade
- [x] Implementar argumentos fixados
- [x] Implementar contador de não lidas
- [x] Implementar rascunhos automáticos
- [x] Implementar estatísticas da discussão

### Fase 5: Notificações ✅
- [x] Implementar sistema de agrupamento inteligente
- [x] Criar mensagens variadas de notificação
- [x] Implementar notificações por tipo de evento
- [x] Testar debouncing de notificações

### Fase 6: Polish & UX ✅
- [x] Animações (Framer Motion)
- [x] Responsividade mobile
- [x] Tema escuro
- [x] Feedback haptico
- [x] Loading states
- [x] Error handling
- [ ] Testes manuais completos (aguardando testes do usuário)

---

## 🎯 Resumo Executivo

**Burocracias a Dois** é uma página única que combina o melhor de:
- **Chat** (rapidez, fluidez, mensagens instantâneas)
- **Fórum** (organização, threads, argumentos fixados)
- **Ferramentas de casal** (categorias, status, intensidade, diversão)

**Diferenciais:**
1. ✅ Sistema de **threads aninhadas** para discussões complexas
2. ✅ **Notificações inteligentes** que agrupam mensagens
3. ✅ **Medidor de intensidade** divertido e automático
4. ✅ **Status e categorias** para organização
5. ✅ **Rascunhos automáticos** para não perder conteúdo
6. ✅ **Reações, imagens, edição** - chat completo
7. ✅ **Zero dependências novas** - usa toda stack existente

**Resultado:** Uma ferramenta divertida, prática e única para casais resolverem desde assuntos sérios até "tretas diplomáticas" sobre quem esqueceu de comprar café. 💑

# 🌸 Jardim do Amor - Sistema de Crescimento Relacional

> **Conceito**: Um jardim virtual interativo que visualiza a saúde e vitalidade do relacionamento através de metáforas naturais que crescem, florescem e evoluem baseadas nas interações do casal no app.

---

## 🎯 Visão Geral

O **Jardim do Amor** é uma representação visual e gamificada do relacionamento que:

- Cresce organicamente com cada interação do casal
- Cria um histórico visual e emocional da jornada juntos
- Incentiva interações regulares e diversificadas
- Celebra momentos especiais com elementos únicos
- Adapta-se às "estações" do relacionamento

---

## 🌺 Mecânicas de Crescimento

### Sistema de Flores e Plantas

Cada tipo de interação gera uma planta específica no jardim:

| Interação             | Planta/Flor      | Significado             |
| --------------------- | ---------------- | ----------------------- |
| **Foto enviada**      | 🌸 Rosa          | Memórias compartilhadas |
| **Razão de amor**     | 💐 Tulipa        | Palavras de afirmação   |
| **Música adicionada** | 🎵 Girassol      | Momentos musicais       |
| **Reação dada**       | ✨ Flor de Lótus | Apreciação mútua        |

### Elementos Especiais

**🌳 Árvore Central** - Representa o relacionamento como um todo

- Cresce em altura com o tempo (meses juntos)
- Fica mais robusta com interações regulares
- Muda de aparência nas "estações" do relacionamento

**🦋 Borboletas** - Aparecem quando há muitas reações emoji

- Voam pelo jardim adicionando movimento
- Cores variam baseadas nos emojis mais usados

**☀️ Sol/Lua** - Ciclo dia/noite

- Sol forte = alta atividade recente
- Lua = períodos mais calmos (mas ainda bonito!)

**💧 Sistema de "Rega"** - Incentivo à consistência

- O jardim precisa de interações regulares (como água)
- Sem rega por 3+ dias: plantas ficam levemente "murchas" (efeito visual sutil, não punitivo)
- Volta à vida com novas interações
- Notificação carinhosa: "O jardim sente sua falta 🌱"

---

## 🎨 Design Visual

### Estilo Artístico

**Inspiração**: Flat design ilustrativo, minimalista mas emotivo

- **Paleta base**: Cores pastéis suaves do Sindoca (rosa, amarelo, verde, lavanda)
- **Animações**: Movimento suave de flores ao vento, borboletas voando
- **Glassmorphism**: Cards de stats sobre o jardim com backdrop blur
- **Microinterações**: Ao tocar uma flor, ela balança e mostra o que representa

### Layout Proposto

```
┌─────────────────────────────────────────────────┐
│  🌤️ Sol (energia do relacionamento)             │
│                                                 │
│           🌳 Árvore Central                     │
│          /   |   \                              │
│         /    |    \                             │
│        🌸   💐   🌼   (flores ao redor)         │
│       🎵  ✨  🏆  🎤                             │
│                                                 │
│  [Stats do Jardim - Card glassmorphic]          │
│  📊 Saúde: ████████░░ 80%                       │
│  🌱 Plantas: 47                                 │
│  💧 Última rega: há 2 horas                     │
└─────────────────────────────────────────────────┘
```

---

## 🌍 Sistema de "Estações"

O jardim evolui através de **estações** que marcam a jornada do casal:

### 1. 🌱 Primavera (0-3 meses)

- Jardim inicial, pequeno e delicado
- Muitas flores brotando
- Cores vibrantes, energia de novidade
- Árvore jovem (broto)

### 2. ☀️ Verão (3-12 meses)

- Jardim em pleno crescimento
- Flores grandes e coloridas
- Árvore em desenvolvimento
- Muita vida e movimento

### 3. 🍂 Outono (1-3 anos)

- Jardim maduro e estável
- Cores quentes (laranjas, vermelhos, amarelos)
- Árvore robusta com folhas caindo suavemente
- Sensação de conforto e nostalgia

### 4. ❄️ Inverno (3+ anos)

- Jardim perene e resistente
- Árvore forte mesmo sem folhas
- Neve suave sobre algumas plantas (mas ainda bonito!)
- Representa maturidade e profundidade

**Nota**: As estações **NÃO** são literais às épocas do ano, mas sim às fases do relacionamento medidas pelo tempo juntos (contador de dias).

---

## 📊 Gamificação e Incentivos

### Conquistas do Jardim

Desbloqueáveis especiais que modificam o jardim:

| Conquista               | Condição                          | Recompensa Visual                 |
| ----------------------- | --------------------------------- | --------------------------------- |
| **Jardineiro Dedicado** | 30 dias consecutivos de interação | 🏅 Regador dourado no jardim      |
| **Floresta do Amor**    | 100+ flores plantadas             | 🌲 Árvores adicionais ao fundo    |
| **Borboletário**        | 500+ reações dadas                | 🦋 Enxame de borboletas coloridas |
| **Jardim Encantado**    | Usar todas as features do app     | ✨ Brilhos mágicos flutuando      |
| **Primavera Eterna**    | 365 dias juntos                   | 🌈 Arco-íris permanente           |

### Sistema de Streaks

- **Streak de Rega**: Dias consecutivos com pelo menos uma interação
- Notificação push às 20h se o jardim ainda não foi "regado" hoje
- Mensagem carinhosa: "Que tal regar o jardim com uma mensagem para [parceiro]? 🌱💧"

---

## 🛠️ Implementação Técnica

### Stack Recomendada

**Frontend**:

- **Framer Motion** - Animações das flores, vento, borboletas
- **Canvas API ou SVG** - Renderização do jardim (leve, não WebGL)
- **React Spring** - Animações físicas realistas (balançar de flores)

**Backend** (Supabase):

```sql
-- Nova tabela: garden_state
CREATE TABLE garden_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  season TEXT CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  health_percentage INT DEFAULT 100,
  total_plants INT DEFAULT 0,
  last_watered_at TIMESTAMPTZ DEFAULT NOW(),
  streak_days INT DEFAULT 0,
  tree_age_days INT DEFAULT 0, -- Calculado do created_at do workspace
  garden_data JSONB, -- Posições, tipos de plantas, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de plantas individuais
CREATE TABLE garden_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id UUID REFERENCES garden_state(id) ON DELETE CASCADE,
  plant_type TEXT, -- 'rose', 'tulip', 'sunflower', etc.
  trigger_type TEXT, -- 'photo', 'message', 'music', etc.
  trigger_id UUID, -- ID do conteúdo que gerou a planta
  position_x FLOAT, -- Posição no jardim (0-1)
  position_y FLOAT,
  growth_stage TEXT DEFAULT 'seed', -- 'seed', 'sprout', 'blooming', 'mature'
  planted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_garden_workspace ON garden_state(workspace_id);
CREATE INDEX idx_plants_garden ON garden_plants(garden_id);
```

### Hooks Customizados

```javascript
// hooks/useGarden.js
export function useGarden() {
  const { workspace } = useAuth();
  const [garden, setGarden] = useState(null);
  const [loading, setLoading] = useState(true);

  // Busca estado do jardim
  // Subscribe em tempo real para novas plantas
  // Calcula saúde baseada em última interação
  // Determina estação baseada em dias juntos

  return {
    garden,
    plants: garden?.plants || [],
    health: garden?.health_percentage || 100,
    season: garden?.season || 'spring',
    waterGarden, // Marca última interação
    plantFlower, // Adiciona nova planta
    loading,
  };
}
```

### Componente Principal

```jsx
// components/sections/GardenSection.jsx
'use client';
import { motion } from 'framer-motion';
import { useGarden } from '@/hooks/useGarden';

export default function GardenSection() {
  const { garden, plants, health, season } = useGarden();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-green-50">
      {/* Sol/Lua baseado na saúde */}
      <motion.div className="sun" animate={{ opacity: health / 100 }} />

      {/* Árvore central */}
      <Tree season={season} age={garden?.tree_age_days} />

      {/* Flores plantadas */}
      <div className="garden-floor">
        {plants.map((plant) => (
          <Plant
            key={plant.id}
            type={plant.plant_type}
            position={{ x: plant.position_x, y: plant.position_y }}
            stage={plant.growth_stage}
          />
        ))}
      </div>

      {/* Borboletas baseadas em reações */}
      <Butterflies count={Math.min(plants.length / 10, 20)} />

      {/* Stats card */}
      <GardenStats health={health} plantCount={plants.length} />
    </div>
  );
}
```

---

## 🎮 Experiência do Usuário

### Fluxo de Interação

1. **Primeira visita**: Tutorial interativo

   - "Bem-vindo ao seu Jardim do Amor!"
   - "Cada interação com seu parceiro planta uma flor aqui"
   - Animação de exemplo de uma flor brotando

2. **Uso regular**:

   - Ao enviar foto → animação de rosa brotando no jardim
   - Notificação: "Você plantou uma Rosa no jardim! 🌸"
   - Partículas visuais de sparkles

3. **Quando o jardim precisa de rega**:

   - Push notification (carinhosa, não irritante)
   - Efeito visual sutil de flores levemente inclinadas
   - Ao interagir: animação de "rega" e flores voltando à vida

4. **Conquistas especiais**:
   - Modal celebratório com confetes
   - Novo elemento visual desbloqueado
   - Compartilhável como card (Instagram-like)

### Integração com Features Existentes

**Galeria de Fotos**:

- Ao adicionar foto → Rosa brota no jardim
- Modal mostra: "Você plantou uma Rosa! Visite o Jardim para ver"

**Razões de Amor**:

- Nova razão → Tulipa brota
- Contador no jardim: "47 tulipas (razões de amor)"

**Música**:

- Música adicionada → Girassol brota
- Girassóis "dançam" levemente quando música toca

**Mensagens**:

- Mensagem enviada → Margarida brota
- Quanto mais mensagens, mais margaridas (campo florido)

**Contador de Dias**:

- Integrado na idade da árvore central
- "Sua árvore tem 247 dias de vida"

---

## 📱 Navegação e UI

### Adição ao Bottom Tab Bar

```
[Home] [Galeria] [Jardim] [Música] [Mais]
                    🌸
```

- Ícone: Flor simples (Lucide: `Flower2`)
- Badge com número de novas plantas se houver

### Página do Jardim

```
/jardim/page.jsx
├── Visão geral do jardim (principal)
├── Modal de planta individual (ao clicar)
│   └── Mostra: tipo, data plantada, ação que gerou
├── Bottom sheet de stats detalhadas
└── Settings do jardim (ativar/desativar notificações)
```

---

## 🚀 MVP vs. Versão Completa

### MVP (Fase 1) - Funcional e Bonito

- ✅ Jardim visual básico (2D, SVG)
- ✅ 4 tipos de flores (foto, mensagem, música, razão)
- ✅ Árvore central que cresce com dias juntos
- ✅ Sistema de rega (contador de última interação)
- ✅ Stats simples (saúde, total de plantas)
- ✅ Notificação de "rega" se inativo por 3 dias

### Versão Completa (Fase 2) - Experiência Imersiva

- ⭐ 9+ tipos de flores (todas as interações)
- ⭐ Sistema de estações completo
- ⭐ Borboletas animadas
- ⭐ Conquistas do jardim
- ⭐ Ciclo dia/noite baseado em horário real
- ⭐ Sons ambiente (pássaros, vento) - toggle opcional
- ⭐ Modo AR (experimental) - ver jardim em superfície física

---

## 🎨 Referências Visuais

**Inspirações de Design**:

- **Monument Valley** - Minimalismo e cores pastel
- **Viridi** - Jardim virtual relaxante
- **Animal Crossing** - Crescimento ao longo do tempo
- **Headspace** - Animações suaves e amigáveis

**Paleta de Cores do Jardim**:

```
Céu/Fundo: #E3F2FD → #E8F5E9 (gradiente)
Terra: #8D6E63 (marrom suave)
Grama: #81C784 (verde fresco)
Flores: Usar cores do Sindoca (primary, secondary, accent, lavender)
```

---

## 💡 Ideias Futuras

### Interações Adicionais que Podem Plantar Flores

À medida que o app evoluir:

| Feature Futura              | Planta       | Cor      |
| --------------------------- | ------------ | -------- |
| **Check-in de localização** | 📍 Cravo     | Vermelho |
| **Jogos a dois**            | 🎮 Violeta   | Roxo     |
| **Desafios cumpridos**      | 🏅 Dália     | Laranja  |
| **Planos futuros criados**  | 🗓️ Hortênsia | Azul     |
| **Memórias compartilhadas** | 📖 Jasmim    | Branco   |
| **Vídeo chamada**           | 📹 Azaleia   | Pink     |

### Recursos Avançados

- **Jardim Compartilhado**: Ambos veem o mesmo jardim em tempo real
- **Exportar Jardim**: Gerar imagem do jardim para compartilhar
- **Jardim do Ano**: Visualização de jardins de anos anteriores
- **Clima Emocional**: Tempo no jardim reflete humor declarado (opcional)
- **Seeds Especiais**: Em aniversários, plantar sementes raras

---

## ✅ Checklist de Implementação

### Backend

- [ ] Criar tabelas `garden_state` e `garden_plants`
- [ ] Criar RLS policies para workspace
- [ ] Criar função SQL para calcular saúde do jardim
- [ ] Criar triggers para plantar flores automaticamente em interações

### Frontend

- [ ] Criar componente `GardenSection.jsx`
- [ ] Criar hook `useGarden.js`
- [ ] Implementar componentes de plantas individuais (SVG)
- [ ] Adicionar animações com Framer Motion
- [ ] Criar sistema de notificações de rega
- [ ] Adicionar ao bottom tab bar

### Integrações

- [ ] Conectar com sistema de fotos (plantar rosa)
- [ ] Conectar com sistema de mensagens (plantar margarida)
- [ ] Conectar com sistema de música (plantar girassol)
- [ ] Conectar com razões de amor (plantar tulipa)
- [ ] Conectar com contador de dias (crescimento da árvore)

### Polish

- [ ] Adicionar sons suaves (opcional, toggle)
- [ ] Tutorial de primeira visita
- [ ] Conquistas do jardim
- [ ] Modal de detalhes de planta
- [ ] Animação de rega

---

## 📝 Notas Finais

O **Jardim do Amor** adiciona uma camada de gamificação **sutil e significativa** ao Sindoca. Não é intrusivo, não é competitivo, mas celebra a jornada do casal de forma visual e emotiva.

É uma feature que:

- ✅ Incentiva uso regular do app (mas de forma carinhosa)
- ✅ Cria memórias visuais da jornada
- ✅ Funciona como "dashboard emocional" do relacionamento
- ✅ Diferencia o Sindoca de outros apps de casal
- ✅ Escala com novas features futuras

**Filosofia**: "Um relacionamento é como um jardim - precisa de cuidado, atenção e amor para florescer."

---

**Status**: Conceito aprovado ✨
**Próximo passo**: Implementar MVP (Fase 1)
**Estimativa**: 2-3 semanas de desenvolvimento

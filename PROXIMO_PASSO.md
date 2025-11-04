# 🎯 Próximos Passos - Planejamento

## ✅ O Que Foi Feito

### FASE 1-3: Autenticação e Workspace ✅
- Sistema de login simplificado (apenas email/senha)
- Sistema de convite com palavra-chave
- Workspace único automático
- Remoção de signup e onboarding
- Callback direto para home

## 📋 O Que Falta Fazer

### FASE 4: Simplificar Seções do Site

As seções já existem, mas precisam ser revisadas:

```
/                    → Home principal
/amor                → Seção amor
/galeria             → Galeria de fotos
/mensagens           → Mensagens entre vocês
/musica              → Playlists/músicas especiais
/conquistas          → Marcos importantes
/surpresas           → Surpresas planejadas
/legado              → Legado/mensagens futuras
/home                → (pode ser removido se for duplicado)
```

#### Decisões a tomar:

1. **Quais seções serão estáticas?** (apenas visualização)
   - Exemplo: Home, Amor (textos fixos no código)

2. **Quais seções terão CRUD?** (adicionar/editar/deletar)
   - Exemplo: Galeria, Mensagens, Conquistas

3. **Layout das seções**
   - Manter design atual ou redesenhar?
   - Responsivo mobile?

### FASE 5: Implementar CRUD nas Seções Editáveis

Para cada seção editável, criar:

#### A. Estrutura de Dados (Supabase)
```sql
-- Exemplo para Galeria
CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  image_url TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### B. Componentes React
- Formulário de adicionar
- Card/Item de exibição
- Botões de editar/deletar
- Modal de confirmação

#### C. API Routes ou Server Actions
- `/api/gallery/create`
- `/api/gallery/update`
- `/api/gallery/delete`

### FASE 6: Upload de Arquivos

#### Opções:
1. **Supabase Storage** (Recomendado)
   - Já está integrado
   - Fácil de usar
   - Free tier generoso

2. **Cloudinary**
   - Otimização automática de imagens
   - CDN global

#### Implementar:
- Upload de fotos na galeria
- Avatar de perfil
- Anexos em mensagens

### FASE 7: Funcionalidades Extras

#### Notificações
- Toast quando o parceiro adiciona algo
- Email opcional?

#### Interações
- Reações (❤️, 😍, 😂)
- Comentários em fotos
- Tags/categorias

#### Timeline
- Visualização cronológica de tudo
- Filtros por data/tipo

### FASE 8: Polish & Deploy

#### Melhorias de UX
- Loading states
- Animações suaves
- Feedback visual

#### Performance
- Lazy loading de imagens
- Code splitting
- Cache otimizado

#### Deploy
- Vercel (recomendado para Next.js)
- Netlify
- Cloudflare Pages

## 🎨 Sugestões de Design

### Paleta de Cores Atual
```
--primary: #ff6b9d       (Rosa/Vermelho)
--accent: #c44569        (Vermelho escuro)
--textPrimary: #2d3436   (Cinza escuro)
--textSecondary: #636e72 (Cinza)
--surface: #ffffff       (Branco)
--surfaceAlt: #f0f3f5    (Cinza claro)
```

### Ideias de Seções

#### 1. Timeline Interativa
- Linha do tempo da relação
- Fotos + textos
- Zoom em cada evento

#### 2. Contador
- Dias juntos
- Tempo desde primeiro beijo
- Aniversários importantes

#### 3. Playlist Compartilhada
- Músicas que marcaram
- Player integrado (Spotify/YouTube)
- Dedications

#### 4. Mapa de Memórias
- Lugares especiais no mapa
- Pins com fotos/descrições
- Mapbox ou Google Maps

#### 5. Bucket List
- Coisas para fazer juntos
- Status: planejado/em progresso/concluído
- Fotos quando completar

#### 6. Mensagens Programadas
- Escrever mensagem para o futuro
- Sistema abre na data escolhida
- Surpresa garantida

## 🔧 Stack Técnica Recomendada

### Frontend
- ✅ Next.js 16 (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Framer Motion (animações)
- ✅ Sonner (toasts)

### Backend
- ✅ Supabase (auth + database + storage)
- Server Actions (Next.js 14+)
- Edge Functions (se precisar)

### Ferramentas
- ✅ Vercel (deploy)
- ✅ GitHub (versionamento)
- ESLint + Prettier (code quality)

## 🚀 Como Começar o Próximo Passo

### Opção 1: Seção por Seção
```bash
# Escolha uma seção (ex: Galeria)
# 1. Crie a tabela no Supabase
# 2. Crie os componentes React
# 3. Implemente CRUD
# 4. Teste
# 5. Repita para próxima seção
```

### Opção 2: Funcionalidade por Funcionalidade
```bash
# Escolha uma funcionalidade (ex: Upload de Fotos)
# 1. Configure Supabase Storage
# 2. Crie componente de upload
# 3. Integre com todas as seções que precisam
# 4. Teste
# 5. Repita para próxima funcionalidade
```

## 📝 Checklist de Desenvolvimento

### Setup Inicial
- [x] Autenticação configurada
- [x] Workspace único criado
- [ ] Upload de arquivos configurado
- [ ] RLS policies revisadas
- [ ] Variáveis de ambiente em produção

### Desenvolvimento
- [ ] Definir seções estáticas vs dinâmicas
- [ ] Criar schemas das tabelas
- [ ] Implementar CRUD básico
- [ ] Adicionar validações
- [ ] Testes manuais

### Refinamento
- [ ] Adicionar animações
- [ ] Melhorar responsividade
- [ ] Otimizar imagens
- [ ] Loading states
- [ ] Error handling

### Deploy
- [ ] Build sem erros
- [ ] Environment variables configuradas
- [ ] Deploy em staging
- [ ] Testes em produção
- [ ] Monitoramento configurado

## 💡 Dicas Finais

1. **Comece simples**: Uma seção por vez
2. **Teste sempre**: Não acumule bugs
3. **Commit frequente**: Pequenos commits descritivos
4. **Mobile first**: Teste no celular desde o início
5. **Performance**: Otimize desde o início
6. **Segurança**: Sempre use RLS no Supabase

## 🎁 Extras Românticos

### Easter Eggs
- Mensagem secreta ao clicar 100x em algo
- Confetes quando completar algo especial
- Música surprise em data específica

### Gamificação
- Badges por marcos alcançados
- Streak de dias adicionando memórias
- Desafios mensais

### Personalização
- Tema claro/escuro
- Cores customizáveis
- Layout preferences

---

**Pronto para começar a próxima fase?** 
Escolha uma seção e vamos implementar o CRUD! 🚀

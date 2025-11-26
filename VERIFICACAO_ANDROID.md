# ✅ Checklist de Verificação - Notificações Push no Android

## 📱 **Testes para Sindy (Android)**

### **1. Verificação Inicial do PWA**

#### 1.1 Instalação do PWA
- [ ] Abrir Chrome no Android
- [ ] Acessar https://sindoca.vercel.app
- [ ] Verificar se aparece o banner "Adicionar à tela inicial"
- [ ] Instalar o app via "Menu (⋮) → Adicionar à tela inicial"
- [ ] Verificar se o ícone aparece na tela inicial com o nome "Sindoca"

#### 1.2 Verificar WebAPK
- [ ] Abrir `chrome://webapks` no Chrome do Android
- [ ] Procurar por "Sindoca" na lista
- [ ] Verificar se o status é "Installed"
- [ ] Verificar se o ícone e nome estão corretos

---

### **2. Ativação de Notificações**

#### 2.1 Permissões do Sistema
- [ ] Abrir o app Sindoca (PWA instalado)
- [ ] Ir em "Menu (☰) → Notificações"
- [ ] Ativar "Notificações Push"
- [ ] O Android deve solicitar permissão → **Permitir**
- [ ] Verificar se o toggle ficou verde/ativado

#### 2.2 Configurações Avançadas (Android)
- [ ] Ir em Configurações do Android → Apps → Sindoca
- [ ] Verificar se "Notificações" está ativado
- [ ] Abrir "Notificações" → Verificar se está tudo ativado
- [ ] **IMPORTANTE**: Desativar "Modo econômico de bateria" para o app

---

### **3. Testes de Notificações**

#### 3.1 Teste Manual (Júnior envia → Sindy recebe)

**FOTOS:**
- [ ] Júnior adiciona 1 foto na galeria
- [ ] Sindy deve receber:
  - Título: "📸 Nova(s) foto(s) na galeria!"
  - Corpo: "Júnior adicionou uma nova foto à galeria!"
  - ❌ **NÃO** deve aparecer "from Sindoca"
  - ❌ **NÃO** deve aparecer "Sindy adicionou..."

**RAZÕES:**
- [ ] Júnior adiciona uma razão
- [ ] Sindy deve receber:
  - Título: "Júnior adicionou uma nova razão para te aguentar!"
  - Corpo: "Corre antes que ele mude de ideia!"
  - ❌ **NÃO** deve aparecer "Sindy adicionou..."

**MÚSICA:**
- [ ] Júnior adiciona uma música ao Spotify
- [ ] Sindy deve receber:
  - Título: "🎵 Júnior adicionou uma nova música!"
  - Corpo: "{Nome da música} - {Artista}"

**REAÇÕES:**
- [ ] Júnior reage com emoji a uma foto/razão da Sindy
- [ ] Sindy deve receber:
  - Título: "{emoji} Nova reação!"
  - Corpo: "Júnior reagiu com {emoji} à sua {tipo de conteúdo}"

#### 3.2 Preferências de Notificação
- [ ] Sindy desativa "Novas Fotos" no menu de notificações
- [ ] Júnior adiciona uma foto
- [ ] Sindy **NÃO** deve receber notificação
- [ ] Sindy reativa "Novas Fotos"
- [ ] Júnior adiciona outra foto
- [ ] Sindy **DEVE** receber notificação

---

### **4. Lembrete Diário (20h BRT)**

#### 4.1 Ativação
- [ ] Sindy ativa "Lembrete Diário" no menu de notificações
- [ ] Aguardar até 20h (horário de Brasília)

#### 4.2 Recebimento (às 20h)
- [ ] Sindy deve receber:
  - Título: "💑 Check-in do casal"
  - Corpo: "Dê um alô pro seu mozão e deixe o dia mais leve! ✨"
- [ ] Clicar na notificação deve abrir o app

#### 4.3 Desativação
- [ ] Sindy desativa "Lembrete Diário"
- [ ] No dia seguinte às 20h, Sindy **NÃO** deve receber notificação

---

### **5. Aparência das Notificações**

#### 5.1 Verificar Visual
Quando receber uma notificação, verificar:

**No Android 12+:**
- [ ] Nome do app: Deve aparecer "Sindoca" (não "Chrome")
- [ ] Ícone: Logo do Sindoca (coração rosa)
- [ ] Sem texto extra: **NÃO** deve aparecer "from Sindoca"

**No Android 11 e anteriores:**
- [ ] Nome do app: Pode aparecer "Chrome" (limitação do Android)
- [ ] Ícone: Ícone do Chrome (limitação do Android)
- [ ] Sem texto extra: **NÃO** deve aparecer "from Sindoca"

#### 5.2 Comportamento ao Clicar
- [ ] Clicar na notificação abre o app
- [ ] App navega para a página correta (/galeria, /razoes, /musica, etc)
- [ ] Se o app já estiver aberto, apenas navega

---

### **6. Resolução de Problemas**

#### Problema: Notificações não chegam
**Soluções:**
1. Verificar se push está ativado no app (Menu → Notificações)
2. Verificar permissões do Android (Configurações → Apps → Sindoca → Notificações)
3. Desativar "Modo econômico de bateria" para o Sindoca
4. Reinstalar o PWA (desinstalar e instalar novamente)
5. Limpar cache do Chrome e do app

#### Problema: Aparece "Chrome" como remetente
**Explicação:**
- No Android 11 e anteriores, é uma limitação da plataforma
- No Android 12+, aguardar geração do WebAPK (pode levar alguns minutos)
- Verificar em `chrome://webapks` se o WebAPK foi instalado

#### Problema: Aparece "from Sindoca" nas notificações
**Status:** ✅ **CORRIGIDO** na versão mais recente
- Fazer hard refresh do PWA (Ctrl+Shift+R ou limpar cache)
- Ou aguardar atualização automática do Service Worker

---

## 📊 **Resumo de Verificações**

### ✅ Funcionalidades Implementadas:
- [x] Notificações de novas fotos (com nome do autor)
- [x] Notificações de novas razões (com nome do autor)
- [x] Notificações de novas músicas (com nome do autor)
- [x] Notificações de reações (com nome de quem reagiu)
- [x] Lembrete diário às 20h (opcional)
- [x] Preferências individuais por tipo de notificação
- [x] Correção do bug "from Sindoca"
- [x] Correção do bug de autor invertido

### ⚠️ Limitações Conhecidas:
- Android 11 e anteriores: Pode aparecer "Chrome" como remetente
- iOS Safari (não PWA): Notificações não suportadas
- Modo navegação privada: Notificações não funcionam

---

## 🚀 **Próximas Etapas (Opcional)**

Para controle total sobre notificações no Android:
1. Migrar para app nativo com Expo (já planejado em `MIGRACAO_APP_NATIVO.md`)
2. Usar Expo Notifications (sem dependência do Chrome)
3. Publicar na Google Play Store

---

**Data da verificação:** {DATA}
**Testado por:** Sindy / Júnior
**Versão do Android:** ______
**Versão do Chrome:** ______
**Status geral:** 🟢 Funcionando / 🟡 Parcial / 🔴 Problemas

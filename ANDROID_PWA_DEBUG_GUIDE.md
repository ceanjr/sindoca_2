# 📱 Guia de Debug para Android PWA (Sem DevTools)

**Data:** 2025-11-14
**Objetivo:** Diagnosticar notificações que não chegam em PWAs Android instalados

---

## 🎯 O Problema

PWAs instalados no Android **não têm acesso fácil ao DevTools**, mas os logs do Service Worker são essenciais para diagnosticar por que notificações não estão sendo recebidas.

**Solução:** Sistema de logging visual integrado no app!

---

## ✅ Como Diagnosticar (Passo a Passo)

### **1. Abrir o Visualizador de Logs**

1. Abra o **Sindoca** (PWA instalado)
2. Clique no menu (⋯) no canto superior direito
3. Clique em **"Debug"** (badge DEV roxo)
4. Role até o final da página
5. Você verá uma seção: **"📱 Logs do App (Mobile Debug)"**

---

### **2. Deixar a Tela Aberta**

⚠️ **IMPORTANTE:** Mantenha a tela do Debug aberta durante o teste!

Os logs aparecem **automaticamente** quando eventos acontecem. Não precisa recarregar.

---

### **3. Pedir para Alguém Enviar uma Notificação de Teste**

Opção A: **Health Check (Você mesmo)**
1. Na mesma tela de Debug
2. Seção **"🩺 Verificar Saúde da Subscription"**
3. Clique em **"🚀 Testar Notificação Real"**

Opção B: **Teste de Envio (Outra pessoa)**
1. Peça para o parceiro abrir Debug → **"Testar Envio"**
2. Ele seleciona você como destinatário
3. Clica em "Enviar Notificação"

---

### **4. Observar os Logs**

Aguarde **10 segundos** e observe a seção de logs.

#### **Cenário A: Logs aparecem ✅**

Você verá algo como:

```
12:34:56 INFO [SW] Push notification received
12:34:56 INFO [SW] Service Worker state
12:34:56 INFO [SW] Push data parsed
12:34:56 INFO [SW] Preparing to show notification
12:34:56 INFO [SW] ✅ Notification displayed successfully
```

**Interpretação:**
- ✅ Service Worker está funcionando
- ✅ Notificação foi exibida pelo SW
- ❓ Se você NÃO viu a notificação, o problema é do **sistema operacional**:
  - Modo "Não Perturbe" ativado
  - App silenciado nas configurações
  - Notificações bloqueadas para o site
  - Bateria em modo de economia extrema

**Solução:**
1. Configurações Android → Apps → Sindoca → Notificações → **Ativar tudo**
2. Desativar "Não Perturbe"
3. Retirar app de "Apps em segundo plano restritos"

---

#### **Cenário B: Nenhum log `[SW]` aparece ❌**

A tela de logs fica vazia ou sem logs do tipo `[SW]`.

**Interpretação:**
- ❌ Service Worker NÃO está recebendo push events
- ❌ Subscription pode estar desatualizada
- ❌ Service Worker pode estar inativo

**Solução:**
1. **Fechar completamente o app:**
   - Recentes → Deslizar Sindoca para fora
   - OU: Configurações → Apps → Sindoca → Forçar parada

2. **Reabrir o app** e esperar 10 segundos

3. **Reativar notificações:**
   - Menu → Debug → Push Notifications
   - Botão **"▶️ Testar Subscription"**
   - Aguardar 5 segundos
   - Verificar se "Push ativo (completo)" está **verde**

4. **Testar novamente** com health check

---

#### **Cenário C: Logs aparecem mas com erro ⚠️**

```
12:34:56 INFO [SW] Push notification received
12:34:56 ERROR [SW] ❌ Failed to display notification
12:34:56 ERROR [SW] NotAllowedError: Permission denied
```

**Interpretação:**
- ✅ Service Worker está recebendo
- ❌ Permissões foram revogadas

**Solução:**
1. Configurações Android → Apps → Sindoca → Permissões → **Ativar notificações**
2. OU: Desinstalar e reinstalar o PWA:
   - Chrome → ⋮ → Mais ferramentas → Desinstalar Sindoca
   - Abrir site novamente
   - Clicar em "Instalar app" no banner
   - Permitir notificações quando solicitado

---

### **5. Copiar e Enviar Logs para Análise**

Se o problema persistir, copie os logs e envie para análise:

1. Na seção **"📱 Logs do App"**
2. Clique no ícone de **copiar** (📋) no canto superior direito
3. Verá toast: **"Logs copiados!"**
4. Abra WhatsApp/Telegram
5. Cole os logs (Ctrl+V ou manter pressionado → Colar)
6. Envie para quem está ajudando

**Ou baixar arquivo:**
1. Clique no ícone de **download** (⬇️)
2. Arquivo `.txt` será baixado
3. Compartilhe via qualquer app

---

## 🧹 Limpar Logs

Os logs são salvos localmente no dispositivo. Para limpar:

1. Clique no ícone de **lixeira** (🗑️) na seção de logs
2. Confirme "Tem certeza?"
3. Logs são apagados

**Quando limpar:**
- Antes de fazer novo teste
- Quando logs ficarem muito grandes
- Para começar diagnóstico do zero

---

## 🔍 Interpretando Cores dos Logs

| Cor | Nível | Significado |
|-----|-------|-------------|
| 🔵 Azul | `INFO` | Informação normal |
| 🟡 Amarelo | `WARN` | Aviso (não é erro fatal) |
| 🔴 Vermelho | `ERROR` | Erro que impediu operação |
| ⚪ Cinza | `DEBUG` | Informação técnica detalhada |

---

## 📊 Filtros

Use os filtros para focar em logs específicos:

### **Filtro de Nível:**
- **Todos os níveis:** Ver tudo
- **INFO:** Apenas informações
- **ERROR:** Apenas erros (útil para ver problemas)
- **WARN:** Avisos

### **Filtro de Categoria:**
- **Todas categorias:** Ver tudo
- **SW:** Apenas Service Worker (notificações)
- **Push:** Apenas eventos de push
- **Subscribe:** Apenas criação de subscriptions

### **Auto-refresh:**
- ✅ **Ativado (padrão):** Logs aparecem automaticamente
- ❌ **Desativado:** Logs param de atualizar (útil para ler com calma)

---

## 🚨 Problemas Comuns

### **1. "Logs não aparecem após enviar notificação"**

**Causa:** Service Worker não está ativo

**Soluções:**
1. Fechar e reabrir app completamente
2. Reativar notificações (Testar Subscription)
3. Verificar se Service Worker v8 está instalado:
   - Console do navegador (se disponível): `navigator.serviceWorker.ready`
   - Ou recarregar app com força (fechar e reabrir)

---

### **2. "Ver ✅ Notification displayed mas não recebo"**

**Causa:** Sistema operacional está bloqueando

**Soluções:**
1. Configurações → Apps → Sindoca → Notificações → **Ativar tudo**
2. Verificar Modo "Não Perturbe": Puxar barra de notificações → Ver se sino está riscado
3. Verificar se app não está em "segundo plano restrito":
   - Configurações → Apps → Sindoca → Bateria → **Irrestrito**
4. Testar com outro app de notificação para confirmar que notificações funcionam no dispositivo

---

### **3. "Logs mostram erro NotAllowedError"**

**Causa:** Permissões revogadas

**Solução:**
1. Configurações → Apps → Sindoca → Permissões → Notificações → **Ativar**
2. OU: Chrome → Configurações → Configurações do site → Notificações → Procurar Sindoca → **Permitir**

---

### **4. "App não instala no Android"**

**Requisitos para PWA Android:**
- Chrome 67+ ou Edge 88+
- HTTPS (site seguro)
- Service Worker registrado
- Manifest.json válido

**Como instalar:**
1. Abra Sindoca no Chrome
2. Banner "Instalar app" aparecerá no topo
3. OU: ⋮ → "Instalar app" ou "Adicionar à tela inicial"
4. Confirme instalação

---

## 📝 Checklist de Resolução

Quando notificações não chegam no Android PWA:

- [ ] **1. Verificar Status Geral**
  - [ ] Menu → Debug → Push Notifications
  - [ ] "Push ativo (completo)" está verde?
  - [ ] Se não, clicar em "Testar Subscription"

- [ ] **2. Abrir Visualizador de Logs**
  - [ ] Role até "📱 Logs do App"
  - [ ] Deixe tela aberta

- [ ] **3. Enviar Notificação de Teste**
  - [ ] Health check ou pedir para parceiro enviar
  - [ ] Aguardar 10 segundos

- [ ] **4. Verificar Logs**
  - [ ] Logs `[SW]` aparecem?
  - [ ] Há "✅ Notification displayed"?
  - [ ] Há erros em vermelho?

- [ ] **5. Se sem logs, reativar SW**
  - [ ] Fechar app completamente
  - [ ] Reabrir
  - [ ] Testar Subscription novamente

- [ ] **6. Se com logs mas sem notificação**
  - [ ] Verificar Modo "Não Perturbe"
  - [ ] Configurações → Apps → Sindoca → Notificações → Ativar
  - [ ] Retirar de apps em segundo plano restritos

- [ ] **7. Copiar logs e enviar para análise**

---

## 🎓 Conceitos Importantes

### **Service Worker**
É um "programa" que roda em segundo plano no navegador, mesmo quando o app está fechado. Ele é responsável por **receber** e **exibir** notificações.

### **Push Subscription**
É um "endereço" único do seu dispositivo onde notificações são enviadas. Se este endereço mudar (ex: atualização do Chrome), as notificações param de chegar até você reativar.

### **Delivered vs Recebida**
- **Delivered:** Google/Apple aceitou a notificação
- **Recebida:** Você viu a notificação no dispositivo

Pode estar "delivered" mas você não receber por causa de:
- Modo silencioso
- Permissões revogadas
- Service Worker inativo

---

## ✅ Resumo Rápido

**Para o usuário Android que não recebe:**

1. Abra **Menu → Debug → Push Notifications**
2. Role até **"📱 Logs do App"** no final
3. Deixe a tela aberta
4. Peça notificação de teste
5. Veja se logs aparecem:
   - ✅ **Aparecem com "✅ displayed"** → Problema é do sistema (configurações)
   - ❌ **Não aparecem** → Service Worker inativo (reativar subscription)
   - ⚠️ **Aparecem com erro** → Permissões revogadas
6. Copie logs (ícone 📋) e envie para análise se precisar

---

**Última atualização:** 2025-11-14
**Service Worker:** v8 com mobile logging

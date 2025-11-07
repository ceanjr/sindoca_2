# Como Limpar Cache - Guia para Usuários

## 🔄 Atualização Automática (Aguardar)

O Service Worker v3 foi implantado com **atualização automática**.

**O que vai acontecer:**
1. Ao acessar o site, o novo SW será baixado
2. Em até **1 minuto**, o SW v3 será instalado
3. A página **recarregará automaticamente**
4. Cache antigo será deletado
5. Site funcionará normalmente ✅

**Se a página recarregar sozinha em 1-2 minutos, está funcionando!**

---

## 🛠️ Limpeza Manual (se necessário)

Se após 5 minutos a página ainda não carregar, faça limpeza manual:

### Desktop (Chrome/Edge/Firefox)

**Opção 1: Reload forçado**
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Opção 2: DevTools**
1. Pressione `F12` (abre DevTools)
2. Vá em **Application** → **Service Workers**
3. Clique em **Unregister** em todos os service workers
4. Vá em **Application** → **Storage**
5. Clique em **Clear site data**
6. Feche DevTools
7. Recarregue a página (`Ctrl+R`)

**Opção 3: Console (mais rápido)**
1. Pressione `F12`
2. Vá em **Console**
3. Cole e execute:
```javascript
navigator.serviceWorker.getRegistrations().then(regs =>
  regs.forEach(reg => reg.unregister())
).then(() =>
  caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
).then(() => location.reload())
```

---

### Mobile (Android Chrome)

**Opção 1: Limpar dados do site**
1. Chrome → Menu (⋮) → **Configurações**
2. **Privacidade e segurança** → **Limpar dados de navegação**
3. Selecione:
   - ✅ Cookies e dados de sites
   - ✅ Imagens e arquivos em cache
4. Período: **Última hora**
5. **Limpar dados**
6. Acesse o site novamente

**Opção 2: Dados do site específico**
1. Chrome → Acesse `sindoca.vercel.app`
2. Toque no **cadeado** na barra de endereço
3. **Configurações do site**
4. **Limpar e redefinir**
5. Confirme
6. Recarregue a página

**Opção 3: Forçar atualização**
1. Segure o botão de **recarregar** (↻)
2. Aparecerá opção **Atualização forçada**
3. Toque nela

---

### Mobile (Safari iOS)

**Opção 1: Limpar cache do Safari**
1. **Ajustes** → **Safari**
2. Role até **Limpar Histórico e Dados de Sites**
3. Confirme
4. Abra Safari e acesse o site

**Opção 2: Modo privado (temporário)**
1. Safari → Botão de **Abas**
2. Toque em **Privado**
3. Acesse `sindoca.vercel.app`
4. Se funcionar, volte ao modo normal e limpe cache (Opção 1)

---

## ✅ Como Saber se Funcionou?

Após limpar cache, você deve ver no **Console (F12)**:

```
Registrando Service Worker...
[SW] Install event - v3
[SW] Activate event - v3 cleaning ALL old caches
[SW] Found caches: [...]
[SW] 🗑️ Deleting old cache: sindoca-v1
[SW] 🗑️ Deleting old cache: sindoca-v2
[SW] ✅ All clients now controlled by v3
Service Worker registrado: https://sindoca.vercel.app/
```

**Sinais de sucesso:**
- ✅ Página carrega completamente
- ✅ Conteúdo aparece (não só barra de navegação)
- ✅ Console mostra "v3" nas mensagens do SW

---

## 🆘 Ainda não funciona?

Se após limpar cache MANUALMENTE ainda não funcionar:

1. **Desinstale o PWA** (se instalado):
   - Desktop: Chrome → Menu → Apps → Sindoca → Desinstalar
   - Mobile: Segure o ícone → Desinstalar/Remover

2. **Limpe TUDO do navegador**:
   - Chrome → Configurações → Privacidade → Limpar dados de navegação
   - Selecione TUDO (Cookies, Cache, etc)
   - Período: **Todo o período**

3. **Reinicie o navegador completamente**

4. **Acesse em modo anônimo primeiro** para testar:
   - Desktop: `Ctrl+Shift+N` (Chrome)
   - Mobile: Menu → Nova janela anônima

5. Se funcionar em modo anônimo mas não no normal:
   - É cache do navegador
   - Repita passo 2 com mais cuidado

---

## 🔍 Debug

Para desenvolvedores, verificar estado atual:

```javascript
// Ver versão do SW
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW:', reg);
  console.log('Active:', reg?.active);
  console.log('Waiting:', reg?.waiting);
  console.log('Installing:', reg?.installing);
});

// Ver caches
caches.keys().then(keys => console.log('Caches:', keys));

// Forçar update
navigator.serviceWorker.getRegistration().then(reg => reg?.update());
```

---

## 📱 Contato

Se nada funcionar, reporte o problema com:
- Device: Android/iOS/Desktop
- Browser: Chrome/Safari/Firefox + versão
- Screenshot do console (F12)

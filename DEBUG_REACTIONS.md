# 🐛 Debug - Sistema de Reações

## Como Testar

### 1. Verificar o Console do Navegador

Abra as DevTools (F12) e vá na aba Console. Você deve ver:

```
[ReactableContent] Mouse enter - starting 2s timer
[ReactableContent] 2s elapsed - opening menu
```

### 2. Indicadores Visuais

**Quando estiver funcionando:**
- Ao passar o mouse, deve aparecer um outline azul no elemento
- Aparece um badge "Segure..." no canto superior esquerdo
- Após 2 segundos, o menu de emojis aparece

**No Mobile:**
- Pressione e segure por 500ms
- Deve sentir vibração (se disponível)
- Menu aparece

### 3. Verificar Condições

O menu SÓ aparece se:
- [x] Você está logado (user existe)
- [x] O item tem um authorId
- [x] O authorId é diferente do seu userId (não é seu conteúdo)

## Problemas Comuns

### Menu não aparece

**Causa 1: Você é o autor**
- O sistema não permite reagir ao próprio conteúdo
- Teste com conteúdo criado pelo parceiro

**Causa 2: authorId não está sendo passado**
- Verifique se ReactableContent recebe `authorId={item.author_id}`

**Causa 3: Mouse sai do elemento antes de 2s**
- Mantenha o mouse completamente parado por 2 segundos
- Veja se aparece o outline azul e o badge "Segure..."

**Causa 4: Events estão sendo bloqueados**
- Veja o console do navegador
- Outros event listeners podem estar interferindo

### Como Verificar

```javascript
// No console do navegador:
// 1. Verifique se há erros
console.log('Errors:', window.errors);

// 2. Inspecione um elemento com reações
// Clique com botão direito > Inspect
// Veja se tem a classe "relative" e os event handlers
```

### Checklist de Debug

1. **Console está aberto?**
   - [ ] Sim, vejo as mensagens de log

2. **Outline azul aparece ao passar mouse?**
   - [ ] Sim → Timer está funcionando
   - [ ] Não → Event handlers não estão funcionando

3. **Badge "Segure..." aparece?**
   - [ ] Sim → isHovering está setando
   - [ ] Não → handleMouseEnter não está sendo chamado

4. **Após 2s, menu aparece?**
   - [ ] Sim → Funciona! 🎉
   - [ ] Não → Timer está sendo cancelado

5. **Sou o autor do conteúdo?**
   - [ ] Não → OK
   - [ ] Sim → Normal, não pode reagir ao próprio conteúdo

## Logs para Verificar

Adicione temporariamente no seu código:

```javascript
// Em ReactableContent
useEffect(() => {
  console.log('[DEBUG] ReactableContent mounted', {
    contentId,
    authorId,
    userId: user?.id,
    canReact: user && authorId && authorId !== user.id
  });
}, []);
```

## Quick Fix

Se nada funcionar, tente:

1. **Recarregar página completa** (Ctrl+Shift+R)
2. **Limpar cache** do navegador
3. **Verificar se migration foi aplicada**
4. **Testar em janela anônima**

## Teste Manual Simples

1. Abra `/musica`
2. Adicione uma música (se ainda não tiver)
3. Peça ao parceiro para adicionar uma música
4. Passe o mouse sobre a música DO PARCEIRO
5. Aguarde 2 segundos SEM MOVER o mouse
6. Menu deve aparecer

## Se Ainda Não Funcionar

Reverta para uma abordagem mais simples:

1. Reduza o tempo de hover de 2s para 0.5s
2. Adicione um botão visível para abrir o menu
3. Use click ao invés de hover

Para fazer isso, edite `ReactableContent.jsx`:

```javascript
// Reduzir tempo
setTimeout(() => {
  setIsMenuOpen(true);
}, 500); // era 2000

// OU adicionar botão
<button 
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  className="absolute top-2 right-2 z-20"
>
  😊 Reagir
</button>
```

## Contato

Se o problema persistir:
1. Verifique se todas as mudanças foram salvas
2. Reinicie o servidor (`npm run dev`)
3. Verifique os logs do console
4. Consulte `TECHNICAL_IMPLEMENTATION.md` para detalhes

---

**Última atualização:** 12/11/2025 - Debug aids adicionados

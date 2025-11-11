# Guia de Teste: Integração Spotify

## Correções Implementadas

✅ **1. Polling com Retry** (MusicSection.jsx)
   - Agora tenta 5 vezes com 300ms entre cada tentativa
   - Total de 1.5 segundos para encontrar os tokens
   - Tolera latência variável do Supabase

✅ **2. .env.local Corrigido**
   - URI localhost para desenvolvimento local
   - Comentários para facilitar troca entre dev/prod

✅ **3. RLS Policy Melhorada** (Migration 013)
   - Agora apenas você e seu parceiro podem ver perfis
   - Maior privacidade

✅ **4. Build Validado**
   - Sem erros TypeScript
   - Todas as rotas gerando corretamente

---

## Pré-requisitos para Testar

### 1. Configurar Redirect URI no Painel do Spotify

Acesse: https://developer.spotify.com/dashboard/applications

1. Selecione sua aplicação (ou crie uma nova)
2. Clique em "Edit Settings"
3. Em "Redirect URIs", adicione:
   ```
   http://localhost:3000/api/spotify/callback
   ```
4. Clique em "Add" e depois em "Save"

**IMPORTANTE:** Se estiver testando em produção (sindoca.vercel.app), você também precisa adicionar:
```
https://sindoca.vercel.app/api/spotify/callback
```

### 2. Aplicar Nova Migration

Execute no console SQL do Supabase:

```sql
-- Execute o conteúdo de: supabase/migrations/013_improve_profiles_rls.sql
```

Ou via CLI do Supabase:
```bash
supabase migration up
```

### 3. Reiniciar Servidor de Desenvolvimento

```bash
# Se estiver rodando, pare com Ctrl+C
npm run dev
```

---

## Checklist de Teste Completo

### Teste 1: Verificar Configuração

- [ ] Abrir `.env.local` e confirmar que `SPOTIFY_REDIRECT_URI` está com `http://localhost:3000/api/spotify/callback`
- [ ] Verificar que as variáveis `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` estão preenchidas
- [ ] Confirmar no painel do Spotify que o redirect URI está configurado

### Teste 2: Fluxo de Autenticação Completo

1. [ ] Abrir o navegador em **modo anônimo/incógnito** (para simular primeira vez)
2. [ ] Acessar: `http://localhost:3000/musica`
3. [ ] Deve aparecer o botão "Conectar Spotify"
4. [ ] Clicar em "Conectar Spotify"
5. [ ] Deve redirecionar para o site do Spotify
6. [ ] Fazer login no Spotify (se necessário)
7. [ ] Clicar em "Autorizar" quando solicitado
8. [ ] **OBSERVAR:** Deve voltar para `/musica` e mostrar:
   - ✅ Toast de sucesso: "Spotify conectado com sucesso!"
   - ✅ Mensagem: "É a sua vez de adicionar uma música!"
   - ✅ Botão "Adicionar Música" visível
9. [ ] **NÃO deve aparecer:** Erro "Erro ao salvar conexão"

### Teste 3: Verificar Logs Remotos

Após o teste acima, verifique os logs:

```sql
-- No console SQL do Supabase
SELECT
  created_at,
  level,
  category,
  message,
  data
FROM debug_logs
WHERE category LIKE 'spotify%'
ORDER BY created_at DESC
LIMIT 20;
```

**O que procurar:**
- ✅ "Parâmetro connected=true detectado!"
- ✅ "Iniciando verificação com retry..."
- ✅ "Tentativa 1/5", "Tentativa 2/5", etc.
- ✅ "✅ Conexão confirmada na tentativa X!"
- ❌ Não deve ter "❌ Tokens não encontrados após todas as tentativas"

### Teste 4: Verificar Tokens no Banco

```sql
-- No console SQL do Supabase
SELECT
  id,
  email,
  spotify_user_id,
  spotify_display_name,
  spotify_tokens IS NOT NULL as has_tokens,
  (spotify_tokens->>'expires_at')::bigint as expires_at,
  to_timestamp((spotify_tokens->>'expires_at')::bigint / 1000) as expires_at_readable
FROM profiles
WHERE spotify_user_id IS NOT NULL;
```

**Verificar:**
- ✅ `has_tokens` deve ser `true`
- ✅ `spotify_user_id` deve estar preenchido
- ✅ `spotify_display_name` deve ter seu nome do Spotify
- ✅ `expires_at_readable` deve ser ~1 hora no futuro

### Teste 5: Adicionar Música

1. [ ] Clicar em "Adicionar Música"
2. [ ] Buscar uma música (ex: "Bohemian Rhapsody")
3. [ ] Clicar em "Adicionar"
4. [ ] Deve aparecer toast de sucesso
5. [ ] Música deve aparecer na lista

### Teste 6: Persistência da Conexão

1. [ ] Recarregar a página (F5)
2. [ ] **Deve continuar conectado** (não pedir para conectar novamente)
3. [ ] Deve mostrar "É a sua vez..." ou "É a vez do parceiro..."
4. [ ] Botão "Adicionar Música" deve estar visível

### Teste 7: Simular Latência (Opcional)

No console do navegador (F12), execute:

```javascript
// Simular latência de rede lenta
const supabase = createClient();
const user = (await supabase.auth.getUser()).data.user;

// Teste em diferentes tempos
for (let delay of [0, 300, 600, 900, 1200]) {
  setTimeout(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('spotify_tokens')
      .eq('id', user.id)
      .single();
    console.log(`${delay}ms:`, data?.spotify_tokens ? '✅ FOUND' : '❌ NOT FOUND');
  }, delay);
}
```

**Esperado:** Deve encontrar tokens em uma das tentativas (provavelmente na primeira ou segunda)

---

## Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa:** O redirect URI no código não bate com o configurado no Spotify

**Solução:**
1. Verificar `.env.local`: `SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback`
2. Verificar painel do Spotify: deve ter exatamente a mesma URI
3. Reiniciar servidor: `npm run dev`

### Erro: "state_mismatch"

**Causa:** Cookie de STATE expirou ou foi deletado

**Solução:**
1. Limpar cookies do navegador
2. Tentar novamente
3. Se persistir, verificar se middleware não está deletando cookies

### Ainda mostra "Erro ao salvar conexão"

**Causa:** Supabase muito lento (>1.5s)

**Solução Temporária:**
1. Recarregar a página (F5) - deve funcionar
2. Aumentar `maxAttempts` de 5 para 8 em `MusicSection.jsx:151`

**Solução Permanente:**
1. Implementar Real-time Subscription (documentado em SPOTIFY_IMPLEMENTATION_GUIDE.md)

### Erro: "Usuario não autenticado no recheck"

**Causa:** Sessão expirou durante o OAuth

**Solução:**
1. Fazer login novamente
2. Tentar conectar Spotify

---

## Validação Final

Se todos os testes passaram:

✅ Autenticação OAuth funcionando
✅ Tokens sendo salvos corretamente
✅ Frontend detectando conexão com sucesso
✅ Sem mensagens de erro falsas
✅ Persistência funcionando (F5 mantém conexão)

**Status: Integração Spotify 100% funcional!** 🎉

---

## Próximos Passos (Opcional)

### 1. Deploy em Produção

Antes do deploy:
1. Mudar `.env.local` para usar URI de produção (ou configurar variável no Vercel)
2. Adicionar URI de produção no painel do Spotify
3. Deploy: `git push origin main` (se configurado com Vercel)

### 2. Otimizações Futuras

- Implementar Real-time Subscription para feedback instantâneo
- Adicionar refresh automático de tokens expirados
- Melhorar UI de loading durante verificação

### 3. Monitoramento

- Verificar logs regularmente: `SELECT * FROM debug_logs WHERE category LIKE 'spotify%'`
- Monitorar tempo de resposta das tentativas
- Ajustar `delayMs` se necessário (atualmente 300ms)

---

## Contato para Dúvidas

Se encontrar problemas:
1. Verificar logs em `debug_logs` no Supabase
2. Consultar documentação em:
   - `RESUMO_EXECUTIVO.md`
   - `SPOTIFY_INTEGRATION_REPORT.md`
   - `SPOTIFY_IMPLEMENTATION_GUIDE.md`

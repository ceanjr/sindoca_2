# Como Configurar os Avatares no Supabase

Os avatares `eu.png` e `sindy.png` já existem em `public/images/`.

## Opção 1: Via Supabase Dashboard (MAIS FÁCIL) ✅

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. No menu lateral, vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o seguinte SQL:

```sql
-- Update avatars for Célio Júnior and Sindy
UPDATE profiles
SET avatar_url = '/images/eu.png'
WHERE email = 'celiojunior0110@gmail.com';

UPDATE profiles
SET avatar_url = '/images/sindy.png'
WHERE email = 'sindyguimaraes.a@gmail.com';

-- Verify the updates
SELECT full_name, email, avatar_url 
FROM profiles
ORDER BY created_at;
```

6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Você deve ver os 2 perfis com os avatares atualizados ✅

## Opção 2: Via Linha de Comando (Requer Service Role Key)

**Nota**: Este método não funciona com a chave anônima devido ao RLS (Row Level Security).
Para usar este método, você precisaria da Service Role Key do Supabase, que tem
permissões administrativas completas. Por segurança, recomendamos usar a Opção 1.

## Verificar se Funcionou

Após executar o SQL, você pode verificar:

```bash
npm run check-avatars
```

Ou simplesmente:
1. Acesse a galeria (`/galeria`)
2. Favorite uma foto
3. Você deve ver o avatar aparecer no canto da foto! 📸

## Como os Avatares Funcionam

- Os avatares estão em `public/images/eu.png` e `public/images/sindy.png`
- O Supabase armazena o caminho `/images/eu.png` no campo `avatar_url`
- O Next.js serve automaticamente arquivos de `public/` na raiz do site
- Quando alguém favorita uma foto, o avatar aparece automaticamente! 🎉

## Estrutura dos Avatares

- **Desktop**: Coração vermelho + avatares (32x32px) no canto superior direito
- **Mobile**: Avatares (28x28px) no canto superior esquerdo
- Se não houver avatar, mostra a inicial do nome em um círculo colorido

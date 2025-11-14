#!/bin/bash

# Script para testar a API de push subscription

echo "🧪 Testando POST /api/push/subscribe"
echo ""

# Dados de teste
SUBSCRIPTION_DATA='{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/test-'$(date +%s)'",
    "keys": {
      "p256dh": "test-p256dh-key-'$(date +%s)'",
      "auth": "test-auth-key-'$(date +%s)'"
    }
  }
}'

echo "📝 Dados enviados:"
echo "$SUBSCRIPTION_DATA" | jq .
echo ""

# Fazer requisição
echo "📡 Enviando requisição..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d "$SUBSCRIPTION_DATA")

echo "📥 Resposta:"
echo "$RESPONSE" | jq .
echo ""

# Verificar resultado
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Subscription salva com sucesso!"
else
  echo "❌ Erro ao salvar subscription"
  echo "$RESPONSE" | jq -r '.error // .details // "Erro desconhecido"'
fi

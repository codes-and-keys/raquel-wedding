# Configuração do Asaas (Sandbox)

## 1. Criar conta na sandbox

Acesse [https://sandbox.asaas.com](https://sandbox.asaas.com) e crie uma conta.
A sandbox é isolada da produção — use dados fictícios.

## 2. Gerar a API Key

1. No painel sandbox, vá em **Configurações → Integrações**
2. Clique em **Gerar nova chave de API**
3. Copie o valor gerado e adicione no `.env.local`:
   ```
   ASAAS_API_KEY=<valor copiado>
   ```

## 3. Configurar o Webhook

### Expor a rota local com ngrok

```bash
npx ngrok http 3000
# Anote a URL pública, ex: https://abc123.ngrok.io
```

### Cadastrar no painel Asaas

1. Vá em **Configurações → Notificações via Webhook**
2. Clique em **Adicionar webhook**
3. URL: `https://<url-ngrok>/api/webhooks/asaas`
4. Token: gere uma string aleatória e adicione no `.env.local`:
   ```bash
   # Gerar token:
   openssl rand -hex 32
   ```
   ```
   ASAAS_WEBHOOK_TOKEN=<token gerado>
   ```
5. Eventos: marque todos relacionados a pagamentos:
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_REFUNDED`
   - `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`
   - `PAYMENT_DELETED`

## 4. Configurar variáveis Firebase client

Os valores estão no Firebase Console em **Configurações do projeto → Seus apps → Web app**:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wedding-raquel
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 5. Subir o servidor

```bash
npm run dev
```

## 6. Testar fluxo PIX

1. Use um dos componentes `PixPayment` + `CardPayment` integrado ao `GiftModal`
2. Preencha os dados do comprador com um CPF válido de teste (não use CPF real)
   - Gerador: [https://www.4devs.com.br/gerador_de_cpf](https://www.4devs.com.br/gerador_de_cpf)
   - Telefone: `(11) 91234-5678`
3. Após criar o pagamento PIX, vá ao painel sandbox → **Cobranças**
4. Encontre a cobrança e clique em **Receber em dinheiro** para simular confirmação
5. Em ≤ 5 segundos, o `PaymentStatus` deve mudar para "Pagamento confirmado!"

## 7. Testar fluxo Cartão de Crédito

Use o cartão de teste oficial do Asaas:

| Campo | Valor |
|---|---|
| Número | `5162306219378829` |
| Validade | qualquer data futura (ex: `12/2030`) |
| CVV | `318` |
| Nome | qualquer |

O pagamento de teste é aprovado imediatamente.

## 8. Testar idempotência do Webhook

1. No painel sandbox, localize o webhook enviado
2. Clique em **Reenviar**
3. Verifique que o array `webhookEvents` no Firestore não ganhou entrada duplicada
   e que `confirmedAt` não foi sobrescrito

## 9. Testar rejeição de token inválido

```bash
curl -X POST https://<url-ngrok>/api/webhooks/asaas \
  -H "asaas-access-token: token_errado" \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test","event":"PAYMENT_CONFIRMED","payment":{"id":"pay_test"}}'
# Esperado: HTTP 401
```

## Observações para produção

- Trocar `ASAAS_ENV=sandbox` para `ASAAS_ENV=prod`
- Usar a API Key de produção (gerada em [https://asaas.com](https://asaas.com))
- Configurar webhook com URL de produção
- **Remover CPFs de teste** — nunca usar CPFs reais em sandbox
- Revisar a regra do Firestore `allow get: if true` para `payments`: considerar adicionar
  autenticação ou validação de origem antes de ir para produção

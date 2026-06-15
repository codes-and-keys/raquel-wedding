# Implementar sistema de pagamento com Asaas (sandbox) para o site de casamento

## Contexto e objetivo

Implementar a base completa do sistema de pagamentos de presentes do site de casamento. Convidados devem conseguir pagar presentes via **PIX** ou **cartão de crédito com parcelamento (1-12x)**, com confirmação em tempo real para o convidado quando o pagamento for processado. Toda a integração deve apontar para a **sandbox do Asaas** (`https://api-sandbox.asaas.com/v3`) nesta fase.

## Stack confirmada
- Next.js (App Router, TypeScript, Route Handlers)
- Firebase: Firestore como banco; Firebase Admin SDK no backend; Firebase JS SDK no client
- Asaas Sandbox como gateway

## Estado atual do projeto (não modificar)
A collection `gifts` no Firestore já existe e contém: `name`, `description`, `price` (number, em reais), `imageUrl`, `category`, `available` (boolean). Use-a apenas para leitura — a contabilidade de "quanto já foi pago" deve sair da collection `payments` que será criada.

## Escopo desta task

### Em escopo
1. Helper de chamadas à API do Asaas
2. Inicialização do Firebase Admin
3. Rota de criação de cobrança (PIX e cartão)
4. Rota de tokenização de cartão (server-side, para evitar PCI scope na aplicação)
5. Rota de webhook do Asaas
6. Componente client para exibir QR PIX e escutar status em tempo real
7. Componente client para checkout de cartão usando tokenização
8. Firestore Security Rules para a collection `payments`
9. `.env.local.example` com todas as variáveis necessárias
10. README curto com instruções de setup da sandbox

### Fora de escopo
- UI/styling além do mínimo funcional (botões nativos, layout simples)
- Página de listagem de presentes (já existe)
- Confirmação por e-mail
- Fluxo de reembolso
- Ambiente de produção

## Estrutura de arquivos a criar

```
lib/
  asaas.ts                          # cliente HTTP para Asaas
  firebase-admin.ts                 # init do Admin SDK (singleton)
  payment-status.ts                 # mapa de eventos Asaas → status interno
types/
  payment.ts                        # types compartilhados
app/
  api/
    payments/
      create/route.ts               # POST: cria cobrança PIX ou cartão
      [id]/route.ts                 # GET: status atual (fallback ao listener)
      card-token/route.ts           # POST: tokeniza cartão server-side
    webhooks/
      asaas/route.ts                # POST: recebe webhooks do Asaas
components/
  payment/
    PixPayment.tsx                  # mostra QR + copia-e-cola + listener
    CardPayment.tsx                 # form de cartão com tokenização
    PaymentStatus.tsx               # listener onSnapshot que dispara success/fail screens
firestore.rules                     # adicionar regras para `payments`
.env.local.example                  # template das envs
docs/asaas-setup.md                 # como configurar a sandbox
```

## Especificação técnica

### `lib/asaas.ts`
Exportar uma função `asaas(path, init?)` que faz `fetch` em `${ASAAS_BASE}${path}` injetando os headers `Content-Type: application/json` e `access_token: ${ASAAS_API_KEY}`. `ASAAS_BASE` deve vir de `process.env.ASAAS_ENV === 'prod' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'`. Em erro HTTP, lançar exceção contendo o status e o corpo da resposta.

### `lib/firebase-admin.ts`
Singleton do Firebase Admin SDK usando service account em `FIREBASE_ADMIN_KEY` (JSON em base64 ou string). Exportar `adminDb` (Firestore) e `adminAuth` se necessário.

### `lib/payment-status.ts`
Exportar `STATUS_MAP`:
```typescript
{
  PAYMENT_CONFIRMED: 'CONFIRMED',
  PAYMENT_RECEIVED: 'RECEIVED',
  PAYMENT_OVERDUE: 'OVERDUE',
  PAYMENT_REFUNDED: 'REFUNDED',
  PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: 'REFUSED',
  PAYMENT_DELETED: 'DELETED',
}
```

### `types/payment.ts`
Types `PaymentMethod = 'PIX' | 'CREDIT_CARD'`, `PaymentStatus = 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'REFUSED' | 'DELETED'`, e a interface `PaymentDoc` com os campos da collection `payments`.

### `POST /api/payments/create`
**Request body:**
```typescript
{
  giftId: string;
  buyer: { name: string; email: string; cpf: string; phone: string };
  method: 'PIX' | 'CREDIT_CARD';
  installments?: number;       // só para CREDIT_CARD; 1-12
  creditCardToken?: string;    // só para CREDIT_CARD; obtido em /api/payments/card-token
}
```

**Comportamento:**
1. Valida o body com Zod (ou outra lib de validação).
2. Lê o documento `gifts/{giftId}` — se não existir, retorna 404. Usa `gift.price` como valor (nunca confiar em valor vindo do client).
3. Faz `POST /customers` no Asaas com nome, email, CPF e telefone do buyer. Não é necessário cachear cliente nesta fase.
4. Faz `POST /payments` no Asaas com `customer`, `billingType`, `value`, `dueDate` (24h à frente), `description`, `externalReference: giftId`. Para cartão parcelado, inclui `installmentCount` e `installmentValue`. Para cartão, inclui `creditCardToken` e `creditCardHolderInfo`.
5. Se PIX, faz `GET /payments/{id}/pixQrCode` e captura `encodedImage` e `payload`.
6. Cria o doc `payments/{asaasPaymentId}` com todos os campos do `PaymentDoc`, status `PENDING`, `webhookEvents: []`, `createdAt: serverTimestamp()`.
7. Retorna `{ paymentId, pixQrCode?, pixCopyPaste?, invoiceUrl, status }`.

**Importante:** O doc ID no Firestore deve ser **exatamente** o `id` retornado pelo Asaas — isso garante idempotência do webhook.

### `POST /api/payments/card-token`
**Request body:**
```typescript
{
  customerId: string;          // opcional; se ausente, cria customer primeiro
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  holderInfo: { name: string; email: string; cpfCnpj: string; postalCode: string; addressNumber: string; phone: string };
  remoteIp: string;
}
```

Faz `POST /creditCard/tokenize` no Asaas e retorna `{ creditCardToken, creditCardBrand, creditCardNumber }` (últimos 4 dígitos). Os dados sensíveis nunca devem ser persistidos.

### `POST /api/webhooks/asaas`
1. Valida o header `asaas-access-token` contra `process.env.ASAAS_WEBHOOK_TOKEN`. Se diferente → 401.
2. Faz parse do body. Se `event` não está em `STATUS_MAP` → retorna 200 (evento que não interessa).
3. Em uma transação do Firestore:
   - Lê `payments/{event.payment.id}`. Se não existe, retorna 200 (provavelmente lixo de sandbox).
   - Verifica se `event.id` já está em `webhookEvents` (dedupe). Se sim, retorna 200.
   - Atualiza `status`, define `confirmedAt: serverTimestamp()` se status for `CONFIRMED` ou `RECEIVED`, e faz `arrayUnion` em `webhookEvents` com `{ id: event.id, event: event.event, receivedAt }`.
4. Retorna 200 rapidamente. **Nunca** retornar 4xx/5xx para evento válido — o Asaas reenfileira agressivamente.

### `GET /api/payments/[id]`
Retorna o doc do pagamento (sem dados sensíveis do buyer além do primeiro nome). Serve como fallback caso o listener client falhe.

### Componente `PixPayment.tsx`
Recebe `paymentId`, `pixQrCode` (base64), `pixCopyPaste`. Renderiza:
- `<img>` com o QR (`data:image/png;base64,${pixQrCode}`)
- Bloco com o copia-e-cola e botão "copiar"
- `<PaymentStatus paymentId={paymentId} />` embaixo

### Componente `CardPayment.tsx`
Form controlado para os dados do cartão. No submit:
1. Chama `/api/payments/card-token` para tokenizar.
2. Chama `/api/payments/create` passando `method: 'CREDIT_CARD'`, `installments`, `creditCardToken`.
3. Mostra `<PaymentStatus paymentId={paymentId} />` aguardando confirmação.

Mostra um seletor de parcelamento (1x a 12x) com cálculo de valor por parcela.

### Componente `PaymentStatus.tsx`
Usa `onSnapshot` em `payments/{paymentId}` no Firebase JS SDK. Renderiza:
- Status `PENDING` → "aguardando pagamento" com spinner
- Status `CONFIRMED` ou `RECEIVED` → tela de sucesso ("Obrigado!")
- Status `REFUSED`, `OVERDUE`, `DELETED` → tela de falha com botão "tentar novamente"

### `firestore.rules`
Adicionar regras para `payments`:
- Leitura: permitida apenas se o usuário conhece o `paymentId` (não há listagem pública). Implementar: `allow get: if true; allow list: if false;`.
- Escrita: bloqueada para client (`allow write: if false;`) — toda escrita vem via Admin SDK no backend.

## Variáveis de ambiente (`.env.local.example`)

```bash
# Asaas
ASAAS_ENV=sandbox
ASAAS_API_KEY=                    # gerar em https://sandbox.asaas.com/config/integracao
ASAAS_WEBHOOK_TOKEN=              # string aleatória; configurar a mesma no painel

# Firebase Admin (já configurado no projeto)
FIREBASE_ADMIN_KEY=               # service account JSON em base64

# Firebase JS (público, já configurado)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
# ... demais vars existentes
```

## Critérios de aceite

A implementação está completa quando:

1. `npm run build` (ou equivalente) passa sem erros de tipo.
2. Submetendo um pagamento PIX via UI gera um QR code válido (verificável visualmente no painel sandbox do Asaas em "Cobranças").
3. Submetendo um pagamento de cartão de teste do Asaas (`5162306219378829`, validade qualquer futura, CCV `318`) cria a cobrança e retorna sucesso.
4. Clicando "Receber em dinheiro" / "Confirmar recebimento" no painel sandbox dispara o webhook, e o status do pagamento no Firestore muda para `RECEIVED` em até 5 segundos.
5. A UI do `PaymentStatus` reflete a mudança automaticamente, sem refresh.
6. Reenvio do mesmo webhook (botão "Reenviar" no painel) não duplica eventos em `webhookEvents` nem altera `confirmedAt`.
7. Webhook com token errado retorna 401.
8. Dados do cartão nunca trafegam pelo backend além da rota `card-token` e nunca são persistidos no Firestore.

## Pontos de atenção (não negligenciar)

- **Runtime do webhook**: declarar `export const runtime = 'nodejs'` na rota — Firebase Admin SDK não roda no Edge Runtime.
- **CPF**: sandbox aceita CPFs válidos (use um gerador). Não usar CPFs reais.
- **Telefone**: formato `(11) 99999-9999` ou `11999999999`.
- **Datas no Asaas**: `dueDate` sempre no formato `YYYY-MM-DD`.
- **Parcelado**: `installmentCount + installmentValue` é mutuamente exclusivo com `value`. Se for parcelado, mandar os dois primeiros; se for à vista, mandar só `value`.
- **Webhook URL local**: para testar localmente, expor a rota com ngrok (`ngrok http 3000`) e configurar a URL pública no painel do Asaas → Configurações → Notificações via Webhook.
- **Logs**: logar todos os webhooks recebidos (com `event.id`) — facilita debug.

## Como testar (sandbox)

1. Criar conta em https://sandbox.asaas.com
2. Gerar a API key em Configurações → Integrações
3. Configurar o webhook em Configurações → Notificações → URL `https://<ngrok-url>/api/webhooks/asaas`, token = mesmo do `.env.local`, eventos: marcar todos os relacionados a pagamento.
4. Subir o servidor local + ngrok.
5. Testar fluxo PIX: criar pagamento → conferir QR → no painel Asaas, confirmar manualmente o recebimento → ver status mudar na UI.
6. Testar fluxo cartão: usar cartão de teste do Asaas → conferir aprovação imediata → confirmar via webhook.
7. Testar reenvio de webhook → confirmar idempotência (sem duplicação no `webhookEvents`).

## Entregáveis finais

- Código completo conforme estrutura acima
- `docs/asaas-setup.md` com passo-a-passo da configuração da sandbox
- Atualização do README principal mencionando as novas envs e a rota do webhook
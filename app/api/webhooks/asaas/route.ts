export const runtime = 'nodejs';

import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/FirebaseAdmin';
import { STATUS_MAP, FAILURE_STATUSES } from '@/lib/payment-status';
import { PaymentStatus, WebhookEvent } from '@/types/payment';

interface AsaasWebhookBody {
  id: string;
  event: string;
  payment?: { id: string };
}

/** Comparação de tempo constante — evita vazar o token via timing attack. */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  // 1. Valida token do webhook (correção: 401 em token inválido)
  const token = request.headers.get('asaas-access-token');
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken || !token || !safeCompare(token, expectedToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: AsaasWebhookBody;
  try {
    body = await request.json();
  } catch {
    // Body malformado — retornar 200 para o Asaas não reenfileirar
    return NextResponse.json({ ok: true });
  }

  console.log('[webhook/asaas] received', body.id, body.event);

  // 2. Ignora eventos que não mapeiam para status interno
  const mappedStatus = STATUS_MAP[body.event];
  if (!mappedStatus || !body.payment?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentRef = adminDb.collection('payments').doc(body.payment.id);

  // 3. Atualiza status em transação para garantir atomicidade e dedupe
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(paymentRef);

    if (!snap.exists) {
      // Provavelmente lixo de sandbox — ignorar silenciosamente
      return;
    }

    const existingEvents: WebhookEvent[] = snap.data()!.webhookEvents ?? [];

    // Dedupe: se o event.id já foi processado, não aplicar novamente.
    if (existingEvents.some((e) => e.id === body.id)) {
      return;
    }

    const prevStatus = (snap.data()!.status ?? 'PENDING') as PaymentStatus;
    const isNowConfirmed = mappedStatus === 'CONFIRMED' || mappedStatus === 'RECEIVED';
    const isNowFailure = FAILURE_STATUSES.includes(mappedStatus);
    const wasFailure = FAILURE_STATUSES.includes(prevStatus);

    const update: Record<string, unknown> = {
      status: mappedStatus,
      webhookEvents: FieldValue.arrayUnion({
        id: body.id,
        event: body.event,
        receivedAt: new Date().toISOString(),
      } satisfies WebhookEvent),
    };

    if (isNowConfirmed) {
      update.confirmedAt = FieldValue.serverTimestamp();
    }

    tx.update(paymentRef, update);

    // O estoque já foi reservado na criação do pagamento (/api/payments/create).
    // Se a cobrança não se concretizar, libera a unidade reservada de volta.
    if (isNowFailure && !wasFailure) {
      const giftId: string = snap.data()!.giftId;
      if (giftId) {
        const giftRef = adminDb.collection('gifts').doc(giftId);
        tx.update(giftRef, { reservedCount: FieldValue.increment(-1) });
      }
    }
  });

  // Nunca retornar 4xx/5xx para evento válido — Asaas reenfileira agressivamente
  return NextResponse.json({ ok: true });
}

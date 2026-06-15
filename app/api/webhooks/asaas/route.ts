export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/FirebaseAdmin';
import { STATUS_MAP } from '@/lib/payment-status';
import { WebhookEvent } from '@/types/payment';

interface AsaasWebhookBody {
  id: string;
  event: string;
  payment?: { id: string };
}

export async function POST(request: NextRequest) {
  // 1. Valida token do webhook (correção: 401 em token inválido)
  const token = request.headers.get('asaas-access-token');
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
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
    // Importante: arrayUnion do Firestore NÃO deduplica se receivedAt diferir,
    // por isso verificamos manualmente antes (correção #7).
    if (existingEvents.some((e) => e.id === body.id)) {
      return;
    }

    const update: Record<string, unknown> = {
      status: mappedStatus,
      webhookEvents: FieldValue.arrayUnion({
        id: body.id,
        event: body.event,
        receivedAt: new Date().toISOString(),
      } satisfies WebhookEvent),
    };

    if (mappedStatus === 'CONFIRMED' || mappedStatus === 'RECEIVED') {
      update.confirmedAt = FieldValue.serverTimestamp();
    }

    tx.update(paymentRef, update);
  });

  // Nunca retornar 4xx/5xx para evento válido — Asaas reenfileira agressivamente
  return NextResponse.json({ ok: true });
}

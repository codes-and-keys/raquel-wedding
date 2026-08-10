export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/FirebaseAdmin';
import { reconcilePendingPayment } from '@/lib/reconcile-payment';

// Não mexe em pagamentos criados há menos de 2 minutos — o polling do cliente já cobre esse caso.
const STALE_AFTER_MS = 2 * 60 * 1000;
const BATCH_LIMIT = 50;

/**
 * Rede de segurança para pagamentos que ficaram PENDING porque o webhook do Asaas não chegou
 * (ex: convidado pagou o PIX e fechou a aba antes do polling detectar a confirmação).
 * Vercel Cron chama esta rota periodicamente com o header `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = Date.now() - STALE_AFTER_MS;

  const snap = await adminDb
    .collection('payments')
    .where('status', '==', 'PENDING')
    .limit(BATCH_LIMIT)
    .get();

  const stale = snap.docs.filter((doc) => {
    const createdAt = doc.data().createdAt?.toMillis?.() ?? 0;
    return createdAt <= cutoff;
  });

  let updated = 0;
  let failed = 0;

  for (const doc of stale) {
    try {
      const mapped = await reconcilePendingPayment(doc.id);
      if (mapped) updated++;
    } catch (err) {
      failed++;
      console.error('[cron/reconcile-payments]', doc.id, err);
    }
  }

  return NextResponse.json({ checked: stale.length, updated, failed });
}

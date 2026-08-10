export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/FirebaseAdmin';
import { reconcilePendingPayment } from '@/lib/reconcile-payment';
import { PaymentStatus } from '@/types/payment';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const paymentRef = adminDb.collection('payments').doc(id);
    const snap = await paymentRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    const data = snap.data()!;
    let currentStatus = data.status as PaymentStatus;

    // Quando ainda PENDING, consulta o Asaas diretamente e sincroniza o Firestore.
    // Isso garante que o status sempre converge mesmo que o webhook não chegue.
    if (currentStatus === 'PENDING') {
      try {
        const mapped = await reconcilePendingPayment(id);
        if (mapped) currentStatus = mapped;
      } catch {
        // Falha silenciosa — retorna o que está no Firestore
      }
    }

    const buyerFirstName = (data.buyerName as string).split(' ')[0];

    return NextResponse.json({
      paymentId: snap.id,
      status: currentStatus,
      method: data.method,
      amount: data.amount,
      installments: data.installments,
      buyerFirstName,
      pixQrCode: data.pixQrCode ?? null,
      pixCopyPaste: data.pixCopyPaste ?? null,
      invoiceUrl: data.invoiceUrl,
      createdAt: data.createdAt,
      confirmedAt: data.confirmedAt ?? null,
    });
  } catch (error) {
    console.error('[payments/[id]]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

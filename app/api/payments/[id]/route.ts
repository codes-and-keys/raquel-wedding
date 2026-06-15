export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/FirebaseAdmin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const snap = await adminDb.collection('payments').doc(id).get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
    }

    const data = snap.data()!;

    // Retorna apenas o primeiro nome — CPF e dados sensíveis nunca saem do backend
    const buyerFirstName = (data.buyerName as string).split(' ')[0];

    return NextResponse.json({
      paymentId: snap.id,
      status: data.status,
      method: data.method,
      amount: data.amount,
      installments: data.installments,
      buyerFirstName,
      pixQrCode: data.pixQrCode,
      pixCopyPaste: data.pixCopyPaste,
      invoiceUrl: data.invoiceUrl,
      createdAt: data.createdAt,
      confirmedAt: data.confirmedAt ?? null,
    });
  } catch (error) {
    console.error('[payments/[id]]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

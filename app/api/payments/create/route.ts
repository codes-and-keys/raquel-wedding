// Firebase Admin SDK não roda no Edge Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/FirebaseAdmin';
import { asaas } from '@/lib/asaas';
import { PaymentDoc } from '@/types/payment';

const buyerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  cpf: z.string().min(11).max(14),
  phone: z.string().min(10),
});

const bodySchema = z.discriminatedUnion('method', [
  z.object({
    giftId: z.string().min(1),
    buyer: buyerSchema,
    method: z.literal('PIX'),
  }),
  z.object({
    giftId: z.string().min(1),
    buyer: buyerSchema,
    method: z.literal('CREDIT_CARD'),
    installments: z.number().int().min(1).max(12).default(1),
    // customerId vem do step card-token — evita criar customer duplicado (correção #4)
    customerId: z.string().min(1),
    creditCardToken: z.string().min(1),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // 1. Busca presente — o valor vem do backend, nunca do cliente
    const giftSnap = await adminDb.collection('gifts').doc(data.giftId).get();
    if (!giftSnap.exists) {
      return NextResponse.json({ error: 'Presente não encontrado' }, { status: 404 });
    }
    const amount = giftSnap.data()!.price as number;
    const giftName = giftSnap.data()!.name as string;

    // 2. Cria customer no Asaas apenas para PIX (cartão já criou no card-token)
    let customerId: string;
    if (data.method === 'PIX') {
      const customer = await asaas<{ id: string }>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: data.buyer.name,
          email: data.buyer.email,
          cpfCnpj: data.buyer.cpf,
          mobilePhone: data.buyer.phone,
        }),
      });
      customerId = customer.id;
    } else {
      customerId = data.customerId;
    }

    // 3. dueDate = 24h a partir de agora (formato YYYY-MM-DD exigido pelo Asaas)
    const due = new Date();
    due.setDate(due.getDate() + 1);
    const dueDate = due.toISOString().split('T')[0];

    // 4. Monta payload de cobrança
    const installments = data.method === 'CREDIT_CARD' ? data.installments : 1;
    const paymentBody: Record<string, unknown> = {
      customer: customerId,
      billingType: data.method === 'PIX' ? 'PIX' : 'CREDIT_CARD',
      dueDate,
      description: `Presente: ${giftName}`,
      externalReference: data.giftId,
    };

    if (installments > 1) {
      // Parcelado: installmentCount + installmentValue (mutuamente exclusivo com value)
      const installmentValue = Math.round((amount / installments) * 100) / 100;
      paymentBody.installmentCount = installments;
      paymentBody.installmentValue = installmentValue;
    } else {
      paymentBody.value = amount;
    }

    if (data.method === 'CREDIT_CARD') {
      paymentBody.creditCardToken = data.creditCardToken;
    }

    const payment = await asaas<{ id: string; invoiceUrl: string }>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentBody),
    });

    // 5. Para PIX, busca QR Code
    let pixQrCode: string | undefined;
    let pixCopyPaste: string | undefined;

    if (data.method === 'PIX') {
      const pix = await asaas<{ encodedImage: string; payload: string }>(
        `/payments/${payment.id}/pixQrCode`,
      );
      pixQrCode = pix.encodedImage;
      pixCopyPaste = pix.payload;
    }

    // 6. Persiste no Firestore — doc ID = ID do Asaas (garante idempotência do webhook)
    const doc: Omit<PaymentDoc, 'createdAt' | 'confirmedAt'> & { createdAt: FieldValue } = {
      giftId: data.giftId,
      buyerName: data.buyer.name,
      method: data.method,
      status: 'PENDING',
      amount,
      installments,
      asaasCustomerId: customerId,
      invoiceUrl: payment.invoiceUrl,
      pixQrCode,
      pixCopyPaste,
      webhookEvents: [],
      createdAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('payments').doc(payment.id).set(doc);

    return NextResponse.json({
      paymentId: payment.id,
      pixQrCode,
      pixCopyPaste,
      invoiceUrl: payment.invoiceUrl,
      status: 'PENDING',
    });
  } catch (error) {
    console.error('[payments/create]', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Firebase Admin SDK não roda no Edge Runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/FirebaseAdmin';
import { asaas, AsaasError } from '@/lib/asaas';
import { PaymentDoc } from '@/types/payment';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/** Erro de negócio ao reservar o presente — distinto de falhas técnicas do Asaas/Firestore */
class GiftError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'SOLD_OUT', message: string) {
    super(message);
  }
}

async function releaseGiftReservation(giftId: string) {
  try {
    await adminDb.collection('gifts').doc(giftId).update({
      reservedCount: FieldValue.increment(-1),
    });
  } catch (err) {
    console.error('[payments/create] falha ao liberar reserva de estoque', giftId, err);
  }
}

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
    installments: z.number().int().min(1).max(12).default(1), // upper bound enforced again below against gift price
    // customerId vem do step card-token — evita criar customer duplicado (correção #4)
    customerId: z.string().min(1),
    creditCardToken: z.string().min(1),
  }),
]);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`payments-create:${ip}`, 8, 60_000)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um momento e tente novamente.' },
      { status: 429 },
    );
  }

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

    // 1. Verifica e reserva o estoque atomicamente — o valor vem do backend, nunca do cliente.
    // Reservar aqui (na criação da cobrança) e não só na confirmação evita que duas pessoas
    // paguem pelo último item do mesmo presente simultaneamente.
    const giftRef = adminDb.collection('gifts').doc(data.giftId);
    let amount: number;
    let giftName: string;
    try {
      const reserved = await adminDb.runTransaction(async (tx) => {
        const giftSnap = await tx.get(giftRef);
        if (!giftSnap.exists) throw new GiftError('NOT_FOUND', 'Presente não encontrado');

        const giftData = giftSnap.data()!;
        const inventory = giftData.inventory ?? 0;
        const reservedCount = giftData.reservedCount ?? 0;
        if (reservedCount >= inventory) {
          throw new GiftError('SOLD_OUT', 'Este presente já foi reservado por outra pessoa.');
        }

        tx.update(giftRef, { reservedCount: reservedCount + 1 });
        return { amount: giftData.price as number, giftName: giftData.name as string };
      });
      amount = reserved.amount;
      giftName = reserved.giftName;
    } catch (err) {
      if (err instanceof GiftError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.code === 'NOT_FOUND' ? 404 : 409 },
        );
      }
      throw err;
    }

    // Valida limite de parcelas no servidor (espelha getMaxInstallments do cliente)
    if (data.method === 'CREDIT_CARD') {
      const maxInstallments = amount < 100 ? 1 : amount < 200 ? 3 : amount < 400 ? 6 : 12;
      if (data.installments > maxInstallments) {
        await releaseGiftReservation(data.giftId);
        return NextResponse.json(
          { error: `Parcelamento máximo para este presente é ${maxInstallments}x.` },
          { status: 400 },
        );
      }
    }

    // A partir daqui o estoque já está reservado — qualquer falha abaixo precisa liberar de volta.
    try {
      // 2. Sanitiza CPF e telefone (strip de não-dígitos) antes de enviar ao Asaas
      const cpf   = data.buyer.cpf.replace(/\D/g, '');
      const phone = data.buyer.phone.replace(/\D/g, '');

      // 3. Cria customer no Asaas apenas para PIX (cartão já criou no card-token)
      let customerId: string;
      if (data.method === 'PIX') {
        const customer = await asaas<{ id: string }>('/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: data.buyer.name,
            email: data.buyer.email,
            cpfCnpj: cpf,
            mobilePhone: phone,
          }),
        });
        customerId = customer.id;
      } else {
        customerId = data.customerId;
      }

      // 4. dueDate = 3 dias (PIX expira; cartão ignora este campo)
      const due = new Date();
      due.setDate(due.getDate() + 3);
      const dueDate = due.toISOString().split('T')[0];

      // 5. Monta payload de cobrança
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

      // 6. Para PIX, busca QR Code
      let pixQrCode: string | undefined;
      let pixCopyPaste: string | undefined;

      if (data.method === 'PIX') {
        const pix = await asaas<{ encodedImage: string; payload: string }>(
          `/payments/${payment.id}/pixQrCode`,
        );
        pixQrCode = pix.encodedImage;
        pixCopyPaste = pix.payload;
      }

      // 7. Persiste no Firestore — doc ID = ID do Asaas (garante idempotência do webhook)
      const doc: Omit<PaymentDoc, 'createdAt' | 'confirmedAt'> & { createdAt: FieldValue } = {
        giftId: data.giftId,
        buyerName: data.buyer.name,
        buyerEmail: data.buyer.email,
        method: data.method,
        status: 'PENDING',
        amount,
        installments,
        asaasCustomerId: customerId,
        invoiceUrl: payment.invoiceUrl,
        ...(pixQrCode !== undefined && { pixQrCode }),
        ...(pixCopyPaste !== undefined && { pixCopyPaste }),
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
      await releaseGiftReservation(data.giftId);
      throw error;
    }
  } catch (error) {
    console.error('[payments/create]', error);
    const message = error instanceof AsaasError
      ? error.userMessage()
      : 'Erro interno ao processar pagamento.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

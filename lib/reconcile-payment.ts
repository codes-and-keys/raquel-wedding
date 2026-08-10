import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/FirebaseAdmin';
import { asaas } from '@/lib/asaas';
import { ASAAS_STATUS_MAP, FAILURE_STATUSES } from '@/lib/payment-status';
import { PaymentStatus } from '@/types/payment';

/**
 * Consulta o status atual de um pagamento PENDING direto no Asaas e sincroniza o Firestore.
 * Usada tanto pelo polling do cliente (GET /api/payments/[id]) quanto pelo cron de reconciliação
 * — garante que o status converge mesmo quando o webhook do Asaas não chega.
 *
 * Retorna o novo status caso tenha mudado, ou null se não havia nada para atualizar.
 */
export async function reconcilePendingPayment(paymentId: string): Promise<PaymentStatus | null> {
  const paymentRef = adminDb.collection('payments').doc(paymentId);

  const asaasPayment = await asaas<{ status: string }>(`/payments/${paymentId}`);
  const mapped = ASAAS_STATUS_MAP[asaasPayment.status];
  if (!mapped || mapped === 'PENDING') return null;

  const isConfirmed = mapped === 'CONFIRMED' || mapped === 'RECEIVED';
  const isFailure = FAILURE_STATUSES.includes(mapped);

  let applied = false;

  await adminDb.runTransaction(async (tx) => {
    const fresh = await tx.get(paymentRef);
    if (!fresh.exists || fresh.data()!.status !== 'PENDING') return;

    const update: Record<string, unknown> = { status: mapped };
    if (isConfirmed) update.confirmedAt = FieldValue.serverTimestamp();
    tx.update(paymentRef, update);

    // O estoque já foi reservado na criação do pagamento (/api/payments/create).
    // Se a cobrança não se concretizar, libera a unidade reservada de volta.
    if (isFailure) {
      const giftId = fresh.data()!.giftId as string;
      if (giftId) {
        tx.update(adminDb.collection('gifts').doc(giftId), {
          reservedCount: FieldValue.increment(-1),
        });
      }
    }

    applied = true;
  });

  return applied ? mapped : null;
}

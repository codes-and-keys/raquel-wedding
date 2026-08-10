import { PaymentStatus } from '@/types/payment';

/** Mapeia eventos do webhook Asaas para status interno da aplicação. */
export const STATUS_MAP: Record<string, PaymentStatus> = {
  PAYMENT_CONFIRMED: 'CONFIRMED',
  PAYMENT_RECEIVED: 'RECEIVED',
  PAYMENT_OVERDUE: 'OVERDUE',
  PAYMENT_REFUNDED: 'REFUNDED',
  PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: 'REFUSED',
  PAYMENT_DELETED: 'DELETED',
};

/** Mapeia o campo `status` retornado pelo GET /payments/{id} do Asaas para status interno. */
export const ASAAS_STATUS_MAP: Record<string, PaymentStatus> = {
  CONFIRMED: 'CONFIRMED',
  RECEIVED: 'RECEIVED',
  OVERDUE: 'OVERDUE',
  REFUNDED: 'REFUNDED',
  DELETED: 'DELETED',
  AWAITING_RISK_ANALYSIS: 'PENDING',
};

/** Status terminais que liberam de volta o estoque reservado na criação do pagamento. */
export const FAILURE_STATUSES: PaymentStatus[] = ['OVERDUE', 'REFUSED', 'DELETED', 'REFUNDED'];

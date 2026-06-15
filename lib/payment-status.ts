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

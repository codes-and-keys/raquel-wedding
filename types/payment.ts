export type PaymentMethod = 'PIX' | 'CREDIT_CARD';

export type PaymentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RECEIVED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'REFUSED'
  | 'DELETED';

export interface WebhookEvent {
  id: string;
  event: string;
  receivedAt: string;
}

export interface PaymentDoc {
  giftId: string;
  /** Nome completo do comprador — nunca armazenar CPF neste documento */
  buyerName: string;
  buyerEmail: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  installments: number;
  asaasCustomerId: string;
  invoiceUrl?: string;
  /** QR Code PIX em base64 (encodedImage do Asaas) */
  pixQrCode?: string;
  /** Copia-e-cola PIX (payload do Asaas) */
  pixCopyPaste?: string;
  webhookEvents: WebhookEvent[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  confirmedAt?: any;
}

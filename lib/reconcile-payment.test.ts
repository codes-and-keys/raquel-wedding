import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFakeFirestore, FakeFieldValue } from '../test/helpers/fake-firestore';

const asaasMock = vi.fn();

beforeEach(() => {
  vi.resetModules();
  asaasMock.mockReset();
  vi.doMock('firebase-admin/firestore', () => ({ FieldValue: FakeFieldValue }));
  vi.doMock('@/lib/asaas', () => ({ asaas: asaasMock }));
});

describe('reconcilePendingPayment', () => {
  it('confirma o pagamento e mantém o estoque reservado (já foi reservado na criação)', async () => {
    const fake = createFakeFirestore({
      'payments/pay_1': { status: 'PENDING', giftId: 'gift_1' },
      'gifts/gift_1': { inventory: 1, reservedCount: 1 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    asaasMock.mockResolvedValueOnce({ status: 'CONFIRMED' });

    const { reconcilePendingPayment } = await import('./reconcile-payment');
    const result = await reconcilePendingPayment('pay_1');

    expect(result).toBe('CONFIRMED');
    expect(fake.getDoc('payments', 'pay_1')?.status).toBe('CONFIRMED');
    expect(fake.getDoc('payments', 'pay_1')?.confirmedAt).toBeDefined();
    expect(fake.getDoc('gifts', 'gift_1')?.reservedCount).toBe(1);
  });

  it('libera a unidade reservada quando o pagamento vence (OVERDUE)', async () => {
    const fake = createFakeFirestore({
      'payments/pay_2': { status: 'PENDING', giftId: 'gift_2' },
      'gifts/gift_2': { inventory: 1, reservedCount: 1 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    asaasMock.mockResolvedValueOnce({ status: 'OVERDUE' });

    const { reconcilePendingPayment } = await import('./reconcile-payment');
    const result = await reconcilePendingPayment('pay_2');

    expect(result).toBe('OVERDUE');
    expect(fake.getDoc('payments', 'pay_2')?.status).toBe('OVERDUE');
    expect(fake.getDoc('gifts', 'gift_2')?.reservedCount).toBe(0);
  });

  it('não faz nada quando o Asaas ainda reporta status pendente/desconhecido', async () => {
    const fake = createFakeFirestore({
      'payments/pay_3': { status: 'PENDING', giftId: 'gift_3' },
      'gifts/gift_3': { inventory: 1, reservedCount: 1 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    asaasMock.mockResolvedValueOnce({ status: 'AWAITING_RISK_ANALYSIS' });

    const { reconcilePendingPayment } = await import('./reconcile-payment');
    const result = await reconcilePendingPayment('pay_3');

    expect(result).toBeNull();
    expect(fake.getDoc('payments', 'pay_3')?.status).toBe('PENDING');
    expect(fake.getDoc('gifts', 'gift_3')?.reservedCount).toBe(1);
  });

  it('não reprocessa um pagamento que outra chamada concorrente já resolveu', async () => {
    // Simula corrida: entre a leitura fora da transação (implícita) e a transação em si,
    // outro processo (ex: o webhook) já mudou o status para CONFIRMED.
    const fake = createFakeFirestore({
      'payments/pay_4': { status: 'CONFIRMED', giftId: 'gift_4' },
      'gifts/gift_4': { inventory: 1, reservedCount: 1 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    asaasMock.mockResolvedValueOnce({ status: 'OVERDUE' });

    const { reconcilePendingPayment } = await import('./reconcile-payment');
    const result = await reconcilePendingPayment('pay_4');

    // A transação vê que o status não é mais PENDING e não aplica nada — evita
    // que o estoque seja liberado indevidamente para um pagamento já confirmado.
    expect(result).toBeNull();
    expect(fake.getDoc('payments', 'pay_4')?.status).toBe('CONFIRMED');
    expect(fake.getDoc('gifts', 'gift_4')?.reservedCount).toBe(1);
  });
});

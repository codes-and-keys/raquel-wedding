import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createFakeFirestore, FakeFieldValue } from '../../../../test/helpers/fake-firestore';

const WEBHOOK_TOKEN = 'test-webhook-secret';

function makeRequest(body: unknown, opts: { token?: string | null; rawBody?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.token !== null) headers['asaas-access-token'] = opts.token ?? WEBHOOK_TOKEN;
  return new NextRequest('https://example.com/api/webhooks/asaas', {
    method: 'POST',
    headers,
    body: opts.rawBody ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  process.env.ASAAS_WEBHOOK_TOKEN = WEBHOOK_TOKEN;
  vi.doMock('firebase-admin/firestore', () => ({ FieldValue: FakeFieldValue }));
});

afterEach(() => {
  delete process.env.ASAAS_WEBHOOK_TOKEN;
});

describe('POST /api/webhooks/asaas', () => {
  it('retorna 401 quando o token está ausente', async () => {
    const fake = createFakeFirestore();
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ id: 'evt_1', event: 'PAYMENT_CONFIRMED' }, { token: null }));

    expect(res.status).toBe(401);
  });

  it('retorna 401 quando o token está errado', async () => {
    const fake = createFakeFirestore();
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ id: 'evt_1', event: 'PAYMENT_CONFIRMED' }, { token: 'token-errado' }));

    expect(res.status).toBe(401);
  });

  it('retorna 200 e ignora corpo malformado sem lançar erro', async () => {
    const fake = createFakeFirestore();
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest(null, { rawBody: 'isso não é json' }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('retorna 200 e não escreve nada para eventos não mapeados', async () => {
    const fake = createFakeFirestore();
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ id: 'evt_1', event: 'PAYMENT_CREATED', payment: { id: 'pay_1' } }));

    expect(res.status).toBe(200);
    expect(fake.getDoc('payments', 'pay_1')).toBeUndefined();
  });

  it('retorna 200 quando o pagamento referenciado não existe (lixo de sandbox)', async () => {
    const fake = createFakeFirestore();
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ id: 'evt_1', event: 'PAYMENT_CONFIRMED', payment: { id: 'nao_existe' } }));

    expect(res.status).toBe(200);
  });

  it('confirma o pagamento e mantém o estoque (já reservado na criação)', async () => {
    const fake = createFakeFirestore({
      'payments/pay_1': { status: 'PENDING', giftId: 'gift_1', webhookEvents: [] },
      'gifts/gift_1': { inventory: 1, reservedCount: 1 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ id: 'evt_1', event: 'PAYMENT_CONFIRMED', payment: { id: 'pay_1' } }));

    expect(res.status).toBe(200);
    const payment = fake.getDoc('payments', 'pay_1');
    expect(payment?.status).toBe('CONFIRMED');
    expect(payment?.confirmedAt).toBeDefined();
    expect((payment?.webhookEvents as unknown[]).length).toBe(1);
    expect(fake.getDoc('gifts', 'gift_1')?.reservedCount).toBe(1);
  });

  it('libera o estoque quando o pagamento vence (OVERDUE)', async () => {
    const fake = createFakeFirestore({
      'payments/pay_2': { status: 'PENDING', giftId: 'gift_2', webhookEvents: [] },
      'gifts/gift_2': { inventory: 1, reservedCount: 1 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest({ id: 'evt_2', event: 'PAYMENT_OVERDUE', payment: { id: 'pay_2' } }));

    expect(res.status).toBe(200);
    expect(fake.getDoc('payments', 'pay_2')?.status).toBe('OVERDUE');
    expect(fake.getDoc('gifts', 'gift_2')?.reservedCount).toBe(0);
  });

  it('dedupe: o mesmo event.id enviado duas vezes não é processado de novo', async () => {
    const fake = createFakeFirestore({
      'payments/pay_3': { status: 'PENDING', giftId: 'gift_3', webhookEvents: [] },
      'gifts/gift_3': { inventory: 1, reservedCount: 1 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const body = { id: 'evt_dup', event: 'PAYMENT_OVERDUE', payment: { id: 'pay_3' } };
    await POST(makeRequest(body));
    await POST(makeRequest(body));

    // Se o dedupe falhasse, a segunda chamada tentaria liberar o estoque de novo (reservedCount: -1).
    expect(fake.getDoc('gifts', 'gift_3')?.reservedCount).toBe(0);
    expect((fake.getDoc('payments', 'pay_3')?.webhookEvents as unknown[]).length).toBe(1);
  });
});

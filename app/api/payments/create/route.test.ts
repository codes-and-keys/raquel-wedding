import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createFakeFirestore, FakeFieldValue } from '../../../../test/helpers/fake-firestore';

class FakeAsaasError extends Error {
  constructor(public readonly httpStatus: number, public readonly path: string, public readonly rawBody: string) {
    super(`Asaas ${httpStatus} ${path}: ${rawBody}`);
  }
  userMessage() {
    return 'Erro ao processar pagamento (simulado).';
  }
}

const asaasMock = vi.fn();

function validPixBody(giftId = 'gift_1') {
  return {
    giftId,
    buyer: { name: 'Fulano de Tal', email: 'fulano@example.com', cpf: '52998224725', phone: '11912345678' },
    method: 'PIX',
  };
}

function makeRequest(body: unknown, ip = '203.0.113.10') {
  return new NextRequest('https://example.com/api/payments/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  asaasMock.mockReset();
  vi.doMock('firebase-admin/firestore', () => ({ FieldValue: FakeFieldValue }));
  vi.doMock('@/lib/asaas', () => ({ asaas: asaasMock, AsaasError: FakeAsaasError }));
});

describe('POST /api/payments/create', () => {
  it('retorna 409 e não chama o Asaas quando o presente já está esgotado', async () => {
    const fake = createFakeFirestore({
      'gifts/gift_1': { name: 'Jogo de Panelas', price: 100, inventory: 1, reservedCount: 1 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest(validPixBody()));

    expect(res.status).toBe(409);
    expect(asaasMock).not.toHaveBeenCalled();
    expect(fake.getDoc('gifts', 'gift_1')?.reservedCount).toBe(1);
  });

  it('retorna 404 quando o presente não existe', async () => {
    const fake = createFakeFirestore();
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const res = await POST(makeRequest(validPixBody('nao_existe')));

    expect(res.status).toBe(404);
  });

  it('reserva o estoque e cria a cobrança PIX com sucesso', async () => {
    const fake = createFakeFirestore({
      'gifts/gift_1': { name: 'Jogo de Panelas', price: 100, inventory: 2, reservedCount: 0 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    asaasMock
      .mockResolvedValueOnce({ id: 'cus_1' }) // POST /customers
      .mockResolvedValueOnce({ id: 'pay_1', invoiceUrl: 'https://asaas.test/i/pay_1' }) // POST /payments
      .mockResolvedValueOnce({ encodedImage: 'base64img', payload: 'copia-e-cola' }); // GET /pixQrCode

    const { POST } = await import('./route');
    const res = await POST(makeRequest(validPixBody()));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.paymentId).toBe('pay_1');
    expect(fake.getDoc('gifts', 'gift_1')?.reservedCount).toBe(1);
    expect(fake.getDoc('payments', 'pay_1')?.status).toBe('PENDING');
  });

  it('libera o estoque quando o limite de parcelas é excedido', async () => {
    const fake = createFakeFirestore({
      'gifts/gift_1': { name: 'Fone', price: 50, inventory: 1, reservedCount: 0 }, // preço < 100 => máx 1x
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    const { POST } = await import('./route');

    const body = {
      giftId: 'gift_1',
      buyer: { name: 'Fulano de Tal', email: 'fulano@example.com', cpf: '52998224725', phone: '11912345678' },
      method: 'CREDIT_CARD',
      installments: 3,
      customerId: 'cus_1',
      creditCardToken: 'tok_1',
    };
    const res = await POST(makeRequest(body));

    expect(res.status).toBe(400);
    expect(asaasMock).not.toHaveBeenCalled();
    expect(fake.getDoc('gifts', 'gift_1')?.reservedCount).toBe(0);
  });

  it('libera o estoque quando o Asaas falha ao criar a cobrança', async () => {
    const fake = createFakeFirestore({
      'gifts/gift_1': { name: 'Jogo de Panelas', price: 100, inventory: 1, reservedCount: 0 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    asaasMock
      .mockResolvedValueOnce({ id: 'cus_1' }) // /customers ok
      .mockRejectedValueOnce(new FakeAsaasError(400, '/payments', '{"errors":[{"code":"invalid_cpf_cnpj"}]}'));

    const { POST } = await import('./route');
    const res = await POST(makeRequest(validPixBody()));

    expect(res.status).toBe(500);
    expect(fake.getDoc('gifts', 'gift_1')?.reservedCount).toBe(0);
    expect(fake.getDoc('payments', 'pay_1')).toBeUndefined();
  });

  it('retorna 429 após exceder o limite de tentativas por IP', async () => {
    const fake = createFakeFirestore({
      'gifts/gift_1': { name: 'Jogo de Panelas', price: 100, inventory: 100, reservedCount: 0 },
    });
    vi.doMock('@/lib/FirebaseAdmin', () => ({ adminDb: fake.adminDb }));
    asaasMock.mockResolvedValue({ id: 'cus_x', invoiceUrl: 'x', encodedImage: 'x', payload: 'x' });

    const { POST } = await import('./route');
    const ip = '198.51.100.1';

    let lastStatus = 0;
    for (let i = 0; i < 9; i++) {
      const res = await POST(makeRequest(validPixBody(), ip));
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});

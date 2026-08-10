// Firebase Admin não é usado aqui, mas fetch para Asaas exige Node runtime
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { asaas, AsaasError } from '@/lib/asaas';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const bodySchema = z.object({
  buyer: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    cpf: z.string().min(11).max(14),
    phone: z.string().min(10),
    postalCode: z.string().min(8).max(9),
    addressNumber: z.string().min(1),
  }),
  card: z.object({
    holderName: z.string().min(3),
    number: z.string().min(13).max(19),
    expiryMonth: z.string().length(2),
    expiryYear: z.string().length(4),
    ccv: z.string().min(3).max(4),
  }),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`card-token:${ip}`, 5, 60_000)) {
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

    const { buyer, card } = parsed.data;

    // Sanitiza CPF e telefone (só dígitos); CEP mantém formato XXXXX-XXX que o Asaas espera
    const cpf        = buyer.cpf.replace(/\D/g, '');
    const phone      = buyer.phone.replace(/\D/g, '');
    const postalDigits = buyer.postalCode.replace(/\D/g, '');
    const postalCode   = `${postalDigits.slice(0, 5)}-${postalDigits.slice(5)}`;

    // remoteIp extraído dos headers — nunca confiar no valor vindo do client
    const remoteIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';

    // 1. Cria customer no Asaas (necessário para tokenização)
    const customer = await asaas<{ id: string }>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: buyer.name,
        email: buyer.email,
        cpfCnpj: cpf,
        mobilePhone: phone,
      }),
    });

    // 2. Tokeniza cartão — dados sensíveis nunca persistidos nem retornados além do token
    const tokenResult = await asaas<{
      creditCardToken: string;
      creditCardBrand: string;
      creditCardNumber: string;
    }>('/creditCard/tokenize', {
      method: 'POST',
      body: JSON.stringify({
        customer: customer.id,
        creditCard: {
          holderName: card.holderName,
          number: card.number,
          expiryMonth: card.expiryMonth,
          expiryYear: card.expiryYear,
          ccv: card.ccv,
        },
        creditCardHolderInfo: {
          name: buyer.name,
          email: buyer.email,
          cpfCnpj: cpf,
          postalCode,
          addressNumber: buyer.addressNumber,
          phone,
        },
        remoteIp,
      }),
    });

    return NextResponse.json({
      customerId: customer.id,
      creditCardToken: tokenResult.creditCardToken,
      creditCardBrand: tokenResult.creditCardBrand,
      creditCardNumber: tokenResult.creditCardNumber,
    });
  } catch (error) {
    console.error('[payments/card-token]', error);
    const message = error instanceof AsaasError
      ? error.userMessage()
      : 'Erro ao processar cartão. Tente novamente.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

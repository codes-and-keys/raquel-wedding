const ASAAS_BASE =
  process.env.ASAAS_ENV === 'prod'
    ? 'https://api.asaas.com/v3'
    : 'https://api-sandbox.asaas.com/v3';

export async function asaas<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY!,
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AsaasError(res.status, path, body);
  }

  return res.json() as Promise<T>;
}

/** Erro estruturado do Asaas — usado para extrair mensagens amigáveis nas rotas */
export class AsaasError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly path: string,
    public readonly rawBody: string,
  ) {
    super(`Asaas ${httpStatus} ${path}: ${rawBody}`);
  }

  /** Retorna a primeira mensagem de erro amigável da resposta Asaas, ou fallback genérico. */
  userMessage(): string {
    const CODE_MAP: Record<string, string> = {
      invalid_cpf_cnpj:                  'CPF inválido. Verifique o número e tente novamente.',
      cpf_duplicated:                     'CPF já cadastrado com outro e-mail.',
      invalid_email:                      'E-mail inválido.',
      invalid_credit_card_number:         'Número de cartão inválido.',
      credit_card_expired:                'Cartão vencido.',
      credit_card_declined:               'Cartão recusado pelo banco. Tente outro cartão ou método.',
      insufficient_funds:                 'Saldo insuficiente no cartão.',
      invalid_cvv:                        'CVV inválido.',
      unauthorized_ip_address_for_token:  'IP não autorizado para tokenização.',
      invalid_action:                     'Operação não permitida nesta cobrança.',
      invalid_postal_code:                'CEP inválido. Verifique o número e tente novamente.',
      'invalid.creditCardHolderInfo.postalCode': 'CEP inválido. Verifique o número e tente novamente.',
    };

    try {
      const body = JSON.parse(this.rawBody) as { errors?: { code: string; description: string }[] };
      const first = body.errors?.[0];
      if (!first) return 'Erro ao processar pagamento. Tente novamente.';
      return CODE_MAP[first.code] ?? first.description ?? 'Erro ao processar pagamento.';
    } catch {
      return 'Erro ao processar pagamento. Tente novamente.';
    }
  }
}

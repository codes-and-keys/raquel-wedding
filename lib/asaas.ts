const ASAAS_BASE =
  process.env.ASAAS_ENV === 'prod'
    ? 'https://api.asaas.com/v3'
    : 'https://api-sandbox.asaas.com/v3';

/**
 * Cliente HTTP tipado para a API do Asaas.
 * Injeta Content-Type e access_token automaticamente.
 * Lança erro contendo status HTTP e corpo da resposta em caso de falha.
 */
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
    throw new Error(`Asaas ${res.status} ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

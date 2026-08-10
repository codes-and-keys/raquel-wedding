const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit simples em memória, por chave (ex: IP + rota).
 * Não é distribuído entre instâncias serverless, mas contém scripts
 * simples e picos de erro enquanto o volume do site for baixo.
 */
export function checkRateLimit(key: string, maxRequests = 8, windowMs = 60_000): boolean {
  const now = Date.now();

  if (hits.size > 1000) {
    for (const [k, v] of hits) {
      if (v.resetAt < now) hits.delete(k);
    }
  }

  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count += 1;
  return true;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

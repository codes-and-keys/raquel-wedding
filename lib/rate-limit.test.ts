import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, getClientIp } from './rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite requisições até o limite', () => {
    const key = `key-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    }
  });

  it('bloqueia a partir da requisição que excede o limite', () => {
    const key = `key-${Math.random()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it('trata chaves diferentes de forma independente', () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    checkRateLimit(keyA, 1, 60_000);
    expect(checkRateLimit(keyA, 1, 60_000)).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000)).toBe(true);
  });

  it('libera novamente depois que a janela expira', () => {
    const key = `window-${Math.random()}`;
    checkRateLimit(key, 1, 60_000);
    expect(checkRateLimit(key, 1, 60_000)).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
  });
});

describe('getClientIp', () => {
  it('usa o primeiro IP de x-forwarded-for', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
    });
    expect(getClientIp(req)).toBe('203.0.113.5');
  });

  it('cai para x-real-ip quando x-forwarded-for está ausente', () => {
    const req = new Request('https://example.com', {
      headers: { 'x-real-ip': '203.0.113.9' },
    });
    expect(getClientIp(req)).toBe('203.0.113.9');
  });

  it('retorna "unknown" quando nenhum header de IP está presente', () => {
    const req = new Request('https://example.com');
    expect(getClientIp(req)).toBe('unknown');
  });
});

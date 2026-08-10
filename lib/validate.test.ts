import { describe, it, expect } from 'vitest';
import { isValidCPF, isValidPhone, isValidCard, isValidExpiry, detectCardBrand } from './validate';

describe('isValidCPF', () => {
  it('aceita um CPF válido', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  it('rejeita CPF com dígito verificador errado', () => {
    expect(isValidCPF('529.982.247-26')).toBe(false);
  });

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
  });

  it('rejeita CPF com tamanho errado', () => {
    expect(isValidCPF('123')).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('aceita celular com DDD (11 dígitos)', () => {
    expect(isValidPhone('(11) 91234-5678')).toBe(true);
  });

  it('aceita fixo com DDD (10 dígitos)', () => {
    expect(isValidPhone('(11) 3456-7890')).toBe(true);
  });

  it('rejeita número curto demais', () => {
    expect(isValidPhone('123456')).toBe(false);
  });
});

describe('isValidCard', () => {
  it('aceita um número de cartão que passa no algoritmo de Luhn', () => {
    expect(isValidCard('4111 1111 1111 1111')).toBe(true);
  });

  it('rejeita um número que falha no Luhn', () => {
    expect(isValidCard('4111 1111 1111 1112')).toBe(false);
  });

  it('rejeita números fora do range de tamanho', () => {
    expect(isValidCard('123')).toBe(false);
  });
});

describe('isValidExpiry', () => {
  it('rejeita formato inválido', () => {
    expect(isValidExpiry('13/99')).toBe(false);
    expect(isValidExpiry('')).toBe(false);
  });

  it('rejeita mês fora do range 1-12', () => {
    expect(isValidExpiry('13/30')).toBe(false);
    expect(isValidExpiry('00/30')).toBe(false);
  });

  it('rejeita data já vencida', () => {
    expect(isValidExpiry('01/20')).toBe(false);
  });

  it('aceita data futura válida', () => {
    expect(isValidExpiry('12/99')).toBe(true);
  });
});

describe('detectCardBrand', () => {
  it('detecta Visa', () => {
    expect(detectCardBrand('4111111111111111')).toBe('Visa');
  });

  it('detecta Mastercard', () => {
    expect(detectCardBrand('5500000000000004')).toBe('Mastercard');
  });

  it('detecta Amex', () => {
    expect(detectCardBrand('340000000000009')).toBe('Amex');
  });

  it('retorna null para bandeira desconhecida', () => {
    expect(detectCardBrand('9999999999999999')).toBe(null);
  });
});

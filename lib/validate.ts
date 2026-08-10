export function isValidCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r >= 10 ? 0 : r;
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

export function isValidPhone(phone: string): boolean {
  const d = phone.replace(/\D/g, '');
  return d.length === 10 || d.length === 11;
}

export function isValidCard(number: string): boolean {
  const d = number.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let odd = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i]);
    if (odd) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    odd = !odd;
  }
  return sum % 10 === 0;
}

export function isValidExpiry(expiry: string): boolean {
  const [month, yearStr] = expiry.split('/');
  if (!month || !yearStr) return false;
  const m = parseInt(month);
  let y = parseInt(yearStr);
  if (isNaN(m) || isNaN(y) || m < 1 || m > 12) return false;
  if (yearStr.length === 2) y += 2000;
  else if (yearStr.length !== 4) return false;
  const now = new Date();
  return y > now.getFullYear() || (y === now.getFullYear() && m >= now.getMonth() + 1);
}

export function detectCardBrand(number: string): 'Visa' | 'Mastercard' | 'Amex' | 'Elo' | null {
  const d = number.replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^5[1-5]|^2[2-7]/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  if (/^(401178|401179|431274|438935|45164[35]|45763[12]|504175|627780|6362[57]0)/.test(d)) return 'Elo';
  return null;
}

'use client';

import { useState } from 'react';
import { Loader2, Lock, CreditCard, User } from 'lucide-react';
import PaymentStatus from './PaymentStatus';
import { maskCPF, maskPhone, maskCard, maskExpiry, maskCEP } from '@/lib/masks';
import { isValidCPF, isValidPhone, isValidCard, isValidExpiry, detectCardBrand } from '@/lib/validate';

interface CardPaymentProps {
  giftId: string;
  amount: number;
}

type Step = 'FORM' | 'PROCESSING' | 'STATUS';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMaxInstallments(amount: number): number {
  if (amount < 100) return 1;
  if (amount < 200) return 3;
  if (amount < 400) return 6;
  return 12;
}

function SectionHeader({ num, icon: Icon, label }: { num: number; icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">
        {num}
      </span>
      <Icon className="w-4 h-4 text-primary/70" />
      <span className="text-sm font-medium text-foreground/80">{label}</span>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-destructive">{msg}</p>;
}

export default function CardPayment({ giftId, amount }: CardPaymentProps) {
  const [step, setStep] = useState<Step>('FORM');
  const [installments, setInstallments] = useState(1);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [buyer, setBuyer] = useState({
    name: '', email: '', cpf: '', phone: '', postalCode: '', addressNumber: '',
  });

  const [card, setCard] = useState({
    holderName: '', number: '', expiry: '', ccv: '',
  });

  const installmentValue = Math.round((amount / installments) * 100) / 100;
  const brand = detectCardBrand(card.number);
  const cvvLen = brand === 'Amex' ? 4 : 3;

  const validate = () => {
    const e: Record<string, string> = {};
    if (buyer.name.trim().length < 3) e.name = 'Informe seu nome completo';
    if (!/\S+@\S+\.\S+/.test(buyer.email)) e.email = 'E-mail inválido';
    if (!isValidCPF(buyer.cpf)) e.cpf = 'CPF inválido';
    if (!isValidPhone(buyer.phone)) e.phone = 'Telefone inválido';
    if (buyer.postalCode.replace(/\D/g, '').length !== 8) e.postalCode = 'CEP inválido';
    if (!buyer.addressNumber.trim()) e.addressNumber = 'Número obrigatório';
    if (card.holderName.trim().length < 3) e.holderName = 'Nome muito curto';
    if (!isValidCard(card.number)) e.cardNumber = 'Número de cartão inválido';
    if (!isValidExpiry(card.expiry)) e.expiry = 'Validade inválida ou expirada';
    if (card.ccv.length < cvvLen) e.ccv = `CVV deve ter ${cvvLen} dígitos`;
    return e;
  };

  const clearErr = (field: string) => {
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const handleReset = () => { setStep('FORM'); setPaymentId(null); setApiError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setApiError(null);
    setStep('PROCESSING');

    try {
      const [expiryMonth, expiryYearRaw] = card.expiry.split('/');
      const expiryYear = expiryYearRaw?.length === 2 ? `20${expiryYearRaw}` : (expiryYearRaw ?? '');

      const tokenRes = await fetch('/api/payments/card-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer,
          card: {
            holderName: card.holderName,
            number: card.number.replace(/\s/g, ''),
            expiryMonth: expiryMonth?.padStart(2, '0') ?? '',
            expiryYear,
            ccv: card.ccv,
          },
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error ?? 'Erro ao processar cartão');

      const paymentRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId,
          buyer: { name: buyer.name, email: buyer.email, cpf: buyer.cpf, phone: buyer.phone },
          method: 'CREDIT_CARD',
          installments,
          customerId: tokenData.customerId,
          creditCardToken: tokenData.creditCardToken,
        }),
      });
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.error ?? 'Erro ao criar pagamento');

      setPaymentId(paymentData.paymentId);
      setStep('STATUS');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStep('FORM');
    }
  };

  if (step === 'STATUS' && paymentId) {
    return <PaymentStatus paymentId={paymentId} onRetry={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {apiError && (
        <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r">
          {apiError}
        </div>
      )}

      {/* ① Parcelamento */}
      <div>
        <SectionHeader num={1} icon={CreditCard} label="Parcelamento" />
        <select
          value={installments}
          onChange={(e) => setInstallments(Number(e.target.value))}
          className="field"
        >
          {Array.from({ length: getMaxInstallments(amount) }, (_, i) => i + 1).map((n) => {
            const val = Math.round((amount / n) * 100) / 100;
            return (
              <option key={n} value={n}>
                {n}x de R$ {formatCurrency(val)}{n === 1 ? ' (à vista)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="h-px bg-border/60" />

      {/* ② Dados pessoais */}
      <div>
        <SectionHeader num={2} icon={User} label="Dados do comprador" />
        <div className="space-y-3">
          <div>
            <input
              placeholder="Nome completo"
              value={buyer.name}
              onChange={(e) => { setBuyer(b => ({ ...b, name: e.target.value })); clearErr('name'); }}
              className={`field ${errors.name ? 'border-destructive focus:ring-destructive/30' : ''}`}
            />
            <FieldError msg={errors.name} />
          </div>

          <div>
            <input
              type="email"
              placeholder="E-mail"
              value={buyer.email}
              onChange={(e) => { setBuyer(b => ({ ...b, email: e.target.value })); clearErr('email'); }}
              className={`field ${errors.email ? 'border-destructive focus:ring-destructive/30' : ''}`}
            />
            <FieldError msg={errors.email} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                placeholder="CPF"
                inputMode="numeric"
                value={buyer.cpf}
                onChange={(e) => {
                  const masked = maskCPF(e.target.value);
                  setBuyer(b => ({ ...b, cpf: masked }));
                  const digits = masked.replace(/\D/g, '');
                  if (digits.length === 11) {
                    setErrors(prev => ({ ...prev, cpf: isValidCPF(masked) ? '' : 'CPF inválido' }));
                  } else if (errors.cpf) {
                    clearErr('cpf');
                  }
                }}
                className={`field ${errors.cpf ? 'border-destructive focus:ring-destructive/30' : ''}`}
              />
              <FieldError msg={errors.cpf} />
            </div>
            <div>
              <input
                placeholder="Telefone"
                inputMode="tel"
                value={buyer.phone}
                onChange={(e) => { setBuyer(b => ({ ...b, phone: maskPhone(e.target.value) })); clearErr('phone'); }}
                className={`field ${errors.phone ? 'border-destructive focus:ring-destructive/30' : ''}`}
              />
              <FieldError msg={errors.phone} />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <input
                placeholder="CEP"
                inputMode="numeric"
                value={buyer.postalCode}
                onChange={(e) => { setBuyer(b => ({ ...b, postalCode: maskCEP(e.target.value) })); clearErr('postalCode'); }}
                className={`field ${errors.postalCode ? 'border-destructive focus:ring-destructive/30' : ''}`}
              />
              <FieldError msg={errors.postalCode} />
            </div>
            <div className="col-span-2">
              <input
                placeholder="Número"
                value={buyer.addressNumber}
                onChange={(e) => { setBuyer(b => ({ ...b, addressNumber: e.target.value })); clearErr('addressNumber'); }}
                className={`field ${errors.addressNumber ? 'border-destructive focus:ring-destructive/30' : ''}`}
              />
              <FieldError msg={errors.addressNumber} />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* ③ Cartão */}
      <div>
        <SectionHeader num={3} icon={Lock} label="Dados do cartão" />
        <div className="space-y-3">
          <div>
            <input
              placeholder="Nome impresso no cartão"
              value={card.holderName}
              onChange={(e) => { setCard(c => ({ ...c, holderName: e.target.value.toUpperCase() })); clearErr('holderName'); }}
              className={`field uppercase tracking-wide ${errors.holderName ? 'border-destructive focus:ring-destructive/30' : ''}`}
            />
            <FieldError msg={errors.holderName} />
          </div>

          <div>
            <div className="relative">
              <input
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                value={card.number}
                onChange={(e) => { setCard(c => ({ ...c, number: maskCard(e.target.value) })); clearErr('cardNumber'); }}
                className={`field font-mono tracking-widest pr-20 ${errors.cardNumber ? 'border-destructive focus:ring-destructive/30' : ''}`}
              />
              {brand && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary/70 bg-primary/8 px-2 py-0.5 rounded">
                  {brand}
                </span>
              )}
            </div>
            <FieldError msg={errors.cardNumber} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                placeholder="MM/AA"
                inputMode="numeric"
                value={card.expiry}
                onChange={(e) => { setCard(c => ({ ...c, expiry: maskExpiry(e.target.value, c.expiry) })); clearErr('expiry'); }}
                className={`field font-mono text-center ${errors.expiry ? 'border-destructive focus:ring-destructive/30' : ''}`}
                maxLength={5}
              />
              <FieldError msg={errors.expiry} />
            </div>
            <div>
              <input
                placeholder={`CVV`}
                inputMode="numeric"
                value={card.ccv}
                onChange={(e) => { setCard(c => ({ ...c, ccv: e.target.value.replace(/\D/g, '').slice(0, cvvLen) })); clearErr('ccv'); }}
                className={`field font-mono text-center ${errors.ccv ? 'border-destructive focus:ring-destructive/30' : ''}`}
                maxLength={cvvLen}
              />
              <FieldError msg={errors.ccv} />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={step === 'PROCESSING'}
        className="btn-primary w-full py-4 text-base shadow-md shadow-primary/20"
      >
        {step === 'PROCESSING' ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
        ) : (
          <><Lock className="w-4 h-4" /> Pagar {installments}x de R$ {formatCurrency(installmentValue)}</>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" /> Pagamento processado com segurança via Asaas
      </p>
    </form>
  );
}

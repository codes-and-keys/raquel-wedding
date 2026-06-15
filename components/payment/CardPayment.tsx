'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import PaymentStatus from './PaymentStatus';

interface CardPaymentProps {
  giftId: string;
  amount: number;
}

type Step = 'FORM' | 'PROCESSING' | 'STATUS';

interface BuyerState {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  postalCode: string;
  addressNumber: string;
}

interface CardState {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CardPayment({ giftId, amount }: CardPaymentProps) {
  const [step, setStep] = useState<Step>('FORM');
  const [installments, setInstallments] = useState(1);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [buyer, setBuyer] = useState<BuyerState>({
    name: '', email: '', cpf: '', phone: '', postalCode: '', addressNumber: '',
  });

  const [card, setCard] = useState<CardState>({
    holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '',
  });

  const installmentValue = Math.round((amount / installments) * 100) / 100;

  const handleReset = () => {
    setStep('FORM');
    setPaymentId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('PROCESSING');

    try {
      // Step 1: tokenizar cartão (cria customer + tokeniza)
      const tokenRes = await fetch('/api/payments/card-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer, card }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error ?? 'Erro ao processar cartão');

      // Step 2: criar cobrança usando o customerId já existente (sem duplicar customer)
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
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStep('FORM');
    }
  };

  if (step === 'STATUS' && paymentId) {
    return <PaymentStatus paymentId={paymentId} onRetry={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r">
          {error}
        </div>
      )}

      {/* Parcelamento */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">
          Parcelamento
        </label>
        <select
          value={installments}
          onChange={(e) => setInstallments(Number(e.target.value))}
          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
            const val = Math.round((amount / n) * 100) / 100;
            return (
              <option key={n} value={n}>
                {n}x de R$ {formatCurrency(val)}{n === 1 ? ' (à vista)' : ' sem juros'}
              </option>
            );
          })}
        </select>
      </div>

      {/* Dados pessoais */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted-foreground">Dados do comprador</legend>

        <input
          required
          placeholder="Nome completo"
          value={buyer.name}
          onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))}
          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />

        <input
          required
          type="email"
          placeholder="E-mail"
          value={buyer.email}
          onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))}
          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="CPF (somente números)"
            maxLength={11}
            inputMode="numeric"
            value={buyer.cpf}
            onChange={(e) => setBuyer((b) => ({ ...b, cpf: e.target.value.replace(/\D/g, '') }))}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <input
            required
            placeholder="Telefone"
            inputMode="tel"
            value={buyer.phone}
            onChange={(e) => setBuyer((b) => ({ ...b, phone: e.target.value }))}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="CEP"
            maxLength={9}
            inputMode="numeric"
            value={buyer.postalCode}
            onChange={(e) => setBuyer((b) => ({ ...b, postalCode: e.target.value.replace(/\D/g, '') }))}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <input
            required
            placeholder="Número (endereço)"
            value={buyer.addressNumber}
            onChange={(e) => setBuyer((b) => ({ ...b, addressNumber: e.target.value }))}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
      </fieldset>

      {/* Dados do cartão */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted-foreground">Dados do cartão</legend>

        <input
          required
          placeholder="Nome impresso no cartão"
          value={card.holderName}
          onChange={(e) => setCard((c) => ({ ...c, holderName: e.target.value.toUpperCase() }))}
          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all uppercase tracking-wider"
        />

        <input
          required
          placeholder="Número do cartão"
          maxLength={16}
          inputMode="numeric"
          value={card.number}
          onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/\D/g, '') }))}
          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono tracking-widest"
        />

        <div className="grid grid-cols-3 gap-3">
          <input
            required
            placeholder="MM"
            maxLength={2}
            inputMode="numeric"
            value={card.expiryMonth}
            onChange={(e) => setCard((c) => ({ ...c, expiryMonth: e.target.value.replace(/\D/g, '') }))}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-center font-mono transition-all"
          />
          <input
            required
            placeholder="AAAA"
            maxLength={4}
            inputMode="numeric"
            value={card.expiryYear}
            onChange={(e) => setCard((c) => ({ ...c, expiryYear: e.target.value.replace(/\D/g, '') }))}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-center font-mono transition-all"
          />
          <input
            required
            placeholder="CVV"
            maxLength={4}
            inputMode="numeric"
            value={card.ccv}
            onChange={(e) => setCard((c) => ({ ...c, ccv: e.target.value.replace(/\D/g, '') }))}
            className="w-full px-3 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-center font-mono transition-all"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={step === 'PROCESSING'}
        className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
      >
        {step === 'PROCESSING' ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
        ) : (
          `Pagar ${installments}x de R$ ${formatCurrency(installmentValue)}`
        )}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { X, HeartHandshake, Loader2, QrCode, CreditCard } from 'lucide-react';
import { Gift } from '@/types/gift';
import { formatPrice } from '@/lib/formatters';
import PixPayment from '@/components/payment/PixPayment';
import CardPayment from '@/components/payment/CardPayment';

type Step = 'SELECT' | 'PIX_FORM' | 'PIX_PAYMENT' | 'CARD';

interface GiftModalProps {
  gift: Gift;
  onClose: () => void;
}

interface PixResult {
  paymentId: string;
  pixQrCode: string;
  pixCopyPaste: string;
}

interface BuyerState {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

export default function GiftModal({ gift, onClose }: GiftModalProps) {
  const [step, setStep] = useState<Step>('SELECT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixResult, setPixResult] = useState<PixResult | null>(null);
  const [buyer, setBuyer] = useState<BuyerState>({ name: '', email: '', cpf: '', phone: '' });

  const handleCreatePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftId: gift.id, buyer, method: 'PIX' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPixResult({
        paymentId: data.paymentId,
        pixQrCode: data.pixQrCode,
        pixCopyPaste: data.pixCopyPaste,
      });
      setStep('PIX_PAYMENT');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar PIX');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('SELECT');
    setPixResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full sm:max-w-xl sm:rounded-[var(--radius-xl)] rounded-t-[var(--radius-xl)] shadow-2xl relative border border-border animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[92svh] overflow-y-auto">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 space-y-6">

          {/* Cabeçalho com nome e valor do presente */}
          <div className="text-center space-y-3 pr-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-serif text-primary">Presentear</h2>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
              <span className="text-sm font-medium text-foreground">{gift.name}</span>
              <span className="font-serif text-primary font-medium">{formatPrice(gift.price)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Seleção do método */}
          {step === 'SELECT' && (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">Como você prefere pagar?</p>

              <button
                onClick={() => setStep('PIX_FORM')}
                className="w-full p-4 flex items-center gap-4 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">PIX</p>
                  <p className="text-xs text-muted-foreground">Confirmação em tempo real</p>
                </div>
              </button>

              <button
                onClick={() => setStep('CARD')}
                className="w-full p-4 flex items-center gap-4 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all text-left group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cartão de Crédito</p>
                  <p className="text-xs text-muted-foreground">Parcelamento em até 12x sem juros</p>
                </div>
              </button>
            </div>
          )}

          {/* Formulário de dados do comprador para PIX */}
          {step === 'PIX_FORM' && (
            <form onSubmit={handleCreatePix} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Informe seus dados para identificarmos o pagamento.
              </p>

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
                  placeholder="CPF (só números)"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando PIX...</>
                  : 'Gerar QR Code PIX'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar
              </button>
            </form>
          )}

          {/* QR Code + listener em tempo real */}
          {step === 'PIX_PAYMENT' && pixResult && (
            <>
              <PixPayment
                paymentId={pixResult.paymentId}
                pixQrCode={pixResult.pixQrCode}
                pixCopyPaste={pixResult.pixCopyPaste}
                onRetry={handleReset}
              />
              <button
                onClick={onClose}
                className="w-full py-3 bg-muted text-foreground rounded-lg text-sm hover:bg-muted-foreground/20 transition-colors"
              >
                Fechar
              </button>
            </>
          )}

          {/* Formulário de cartão (coleta tudo internamente) */}
          {step === 'CARD' && (
            <>
              <CardPayment giftId={gift.id} amount={gift.price} />
              <button
                type="button"
                onClick={handleReset}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

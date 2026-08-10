'use client';

import { useState } from 'react';
import { X, HeartHandshake, Loader2, QrCode, CreditCard } from 'lucide-react';
import { Gift } from '@/types/gift';
import { formatPrice } from '@/lib/formatters';
import PixPayment from '@/components/payment/PixPayment';
import CardPayment from '@/components/payment/CardPayment';
import { maskCPF, maskPhone } from '@/lib/masks';
import { isValidCPF, isValidPhone } from '@/lib/validate';

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

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-destructive">{msg}</p>;
}

export default function GiftModal({ gift, onClose }: GiftModalProps) {
  const [step, setStep] = useState<Step>('SELECT');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pixResult, setPixResult] = useState<PixResult | null>(null);
  const [buyer, setBuyer] = useState<BuyerState>({ name: '', email: '', cpf: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearErr = (field: string) => {
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const validatePix = () => {
    const e: Record<string, string> = {};
    if (buyer.name.trim().length < 3) e.name = 'Informe seu nome completo';
    if (!/\S+@\S+\.\S+/.test(buyer.email)) e.email = 'E-mail inválido';
    if (!isValidCPF(buyer.cpf)) e.cpf = 'CPF inválido';
    if (!isValidPhone(buyer.phone)) e.phone = 'Telefone inválido';
    return e;
  };

  const handleCreatePix = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePix();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setIsLoading(true);
    setApiError(null);

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
      setApiError(err instanceof Error ? err.message : 'Erro ao gerar PIX');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('SELECT');
    setPixResult(null);
    setApiError(null);
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full sm:max-w-2xl sm:rounded-[var(--radius-xl)] rounded-t-[var(--radius-xl)] shadow-2xl relative border border-border animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[92svh] overflow-y-auto">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 space-y-6">

          {/* Cabeçalho */}
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

          {apiError && (
            <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {apiError}
            </div>
          )}

          {/* Seleção do método */}
          {step === 'SELECT' && (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">Como você prefere pagar?</p>

              <button
                onClick={() => setStep('PIX_FORM')}
                className="w-full p-4 flex items-center gap-4 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">PIX</p>
                  <p className="text-xs text-muted-foreground">Confirmação instantânea</p>
                </div>
              </button>

              <button
                onClick={() => setStep('CARD')}
                className="w-full p-4 flex items-center gap-4 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Cartão de Crédito</p>
                  <p className="text-xs text-muted-foreground">
                    {gift.price < 100
                      ? 'Pagamento à vista'
                      : `Em até ${gift.price < 200 ? 3 : gift.price < 400 ? 6 : 12}x`}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Formulário PIX */}
          {step === 'PIX_FORM' && (
            <form onSubmit={handleCreatePix} className="space-y-4" noValidate>
              <p className="text-sm text-muted-foreground text-center">
                Informe seus dados para identificarmos o pagamento.
              </p>

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

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-4"
              >
                {isLoading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando PIX...</>
                  : 'Gerar QR Code PIX'}
              </button>

              <button type="button" onClick={handleReset} className="btn-ghost w-full py-2">
                ← Voltar
              </button>
            </form>
          )}

          {/* QR Code PIX */}
          {step === 'PIX_PAYMENT' && pixResult && (
            <>
              <PixPayment
                paymentId={pixResult.paymentId}
                pixQrCode={pixResult.pixQrCode}
                pixCopyPaste={pixResult.pixCopyPaste}
                onRetry={handleReset}
              />
              <button onClick={onClose} className="btn-muted w-full py-3 text-sm">
                Fechar
              </button>
            </>
          )}

          {/* Cartão */}
          {step === 'CARD' && (
            <>
              <CardPayment giftId={gift.id} amount={gift.price} />
              <button type="button" onClick={handleReset} className="btn-ghost w-full py-2">
                ← Voltar
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

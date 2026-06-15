'use client';

import { useState } from 'react';
import PixPayment from '@/components/payment/PixPayment';
import CardPayment from '@/components/payment/CardPayment';

// ID de um presente que já existe no Firestore (troque pelo ID real)
const TEST_GIFT_ID = 'COLE_AQUI_O_ID_DE_UM_PRESENTE';
const TEST_AMOUNT = 50; // R$ 50,00

type Method = 'PIX' | 'CREDIT_CARD' | null;

interface PixResult {
  paymentId: string;
  pixQrCode: string;
  pixCopyPaste: string;
}

export default function TestPaymentPage() {
  const [method, setMethod] = useState<Method>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixResult, setPixResult] = useState<PixResult | null>(null);

  const handleCreatePix = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftId: TEST_GIFT_ID,
          buyer: {
            name: 'Convidado Teste',
            email: 'teste@teste.com',
            // Use um CPF válido gerado em https://www.4devs.com.br/gerador_de_cpf
            cpf: '00000000000',
            phone: '11912345678',
          },
          method: 'PIX',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPixResult({
        paymentId: data.paymentId,
        pixQrCode: data.pixQrCode,
        pixCopyPaste: data.pixCopyPaste,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMethod(null);
    setPixResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-start justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-serif text-primary">Teste de Pagamento</h1>
          <p className="text-sm text-muted-foreground">
            Presente: <code className="font-mono text-xs bg-muted px-1 rounded">{TEST_GIFT_ID}</code>
            {' · '}
            R$ {TEST_AMOUNT.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r">
            {error}
          </div>
        )}

        {/* Seleção do método */}
        {!method && !pixResult && (
          <div className="space-y-3">
            <button
              onClick={() => { setMethod('PIX'); handleCreatePix(); }}
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {loading ? 'Gerando PIX...' : 'Pagar via PIX'}
            </button>
            <button
              onClick={() => setMethod('CREDIT_CARD')}
              className="w-full py-4 border border-border text-foreground rounded-lg font-medium hover:bg-muted/50 transition-all"
            >
              Pagar com Cartão de Crédito
            </button>
          </div>
        )}

        {/* PIX */}
        {method === 'PIX' && pixResult && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <PixPayment
              paymentId={pixResult.paymentId}
              pixQrCode={pixResult.pixQrCode}
              pixCopyPaste={pixResult.pixCopyPaste}
              onRetry={handleReset}
            />
            <button onClick={handleReset} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar
            </button>
          </div>
        )}

        {/* Cartão */}
        {method === 'CREDIT_CARD' && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <CardPayment giftId={TEST_GIFT_ID} amount={TEST_AMOUNT} />
            <button onClick={handleReset} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

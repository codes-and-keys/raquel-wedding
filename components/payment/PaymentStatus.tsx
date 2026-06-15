'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PaymentStatus as PaymentStatusType } from '@/types/payment';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface PaymentStatusProps {
  paymentId: string;
  onRetry?: () => void;
}

const SUCCESS_STATUSES: PaymentStatusType[] = ['CONFIRMED', 'RECEIVED'];
const FAILED_STATUSES: PaymentStatusType[] = ['REFUSED', 'OVERDUE', 'DELETED', 'REFUNDED'];

function toDisplayStatus(status: PaymentStatusType): 'PENDING' | 'SUCCESS' | 'FAILED' {
  if (SUCCESS_STATUSES.includes(status)) return 'SUCCESS';
  if (FAILED_STATUSES.includes(status)) return 'FAILED';
  return 'PENDING';
}

export default function PaymentStatus({ paymentId, onRetry }: PaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatusType>('PENDING');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'payments', paymentId), (snap) => {
      if (snap.exists()) {
        setStatus(snap.data().status as PaymentStatusType);
      }
    });
    return unsubscribe;
  }, [paymentId]);

  const display = toDisplayStatus(status);

  if (display === 'PENDING') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Aguardando confirmação do pagamento...</p>
        <p className="text-xs text-muted-foreground/60">
          A tela atualiza automaticamente. Não feche esta janela.
        </p>
      </div>
    );
  }

  if (display === 'SUCCESS') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <p className="font-serif text-xl text-primary">Pagamento confirmado!</p>
        <p className="text-sm text-muted-foreground">
          Obrigado pelo carinho! Seu presente foi reservado com sucesso.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-center">
      <XCircle className="w-10 h-10 text-destructive" />
      <p className="font-semibold text-destructive">Pagamento não aprovado</p>
      <p className="text-sm text-muted-foreground">
        Verifique os dados do cartão ou tente outro método.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted-foreground/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}

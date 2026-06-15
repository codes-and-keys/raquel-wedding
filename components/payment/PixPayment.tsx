'use client';

import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';
import PaymentStatus from './PaymentStatus';

interface PixPaymentProps {
  paymentId: string;
  pixQrCode: string;
  pixCopyPaste: string;
  onRetry?: () => void;
}

export default function PixPayment({ paymentId, pixQrCode, pixCopyPaste, onRetry }: PixPaymentProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCopyPaste);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 bg-white rounded-xl border border-border shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${pixQrCode}`}
            alt="QR Code PIX"
            className="w-48 h-48 sm:w-56 sm:h-56"
          />
        </div>

        {/* Copia e cola */}
        <div className="w-full space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-center">
            Ou copie o código PIX
          </p>
          <div className="flex gap-2">
            <code className="flex-1 text-xs px-3 py-2.5 bg-muted/30 border border-border rounded-lg font-mono truncate">
              {pixCopyPaste}
            </code>
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shrink-0 active:scale-[0.98]"
              aria-label="Copiar código PIX"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Status em tempo real via onSnapshot */}
      <div className="border-t border-border pt-4">
        <PaymentStatus paymentId={paymentId} onRetry={onRetry} />
      </div>
    </div>
  );
}

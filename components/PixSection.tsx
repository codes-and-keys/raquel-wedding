'use client';

import { useState } from 'react';
import { Copy, CheckCircle2, QrCode } from 'lucide-react';

interface PixSectionProps {
  pixKey: string;
  holderName: string;
  bankName: string;
}

export default function PixSection({ pixKey, holderName, bankName }: PixSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      id="pix-section"
      className="mt-16 bg-gradient-to-br from-card to-muted border border-border rounded-[var(--radius-xl)] p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12"
    >
      <div className="bg-background p-4 rounded-2xl shadow-sm shrink-0 border border-border">
        <div className="w-40 h-40 bg-muted-foreground/10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border gap-2">
          <QrCode className="w-12 h-12 text-primary/50" />
          <span className="text-xs text-muted-foreground font-mono">QR CODE AQUI</span>
        </div>
      </div>

      <div className="space-y-6 text-center md:text-left flex-1">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif text-primary">Cotas & Contribuições</h2>
          <p className="text-foreground/80 text-base sm:text-lg">
            Você pode contribuir com qualquer valor para a nossa lua de mel ou projetos futuros através do nosso PIX.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Chave PIX (CPF)
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <code className="px-6 py-4 bg-background border border-border rounded-lg text-lg font-mono text-foreground w-full sm:w-auto text-center">
              {pixKey}
            </code>
            <button
              onClick={handleCopy}
              className="w-full sm:w-auto px-6 py-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
            >
              {copied ? (
                <><CheckCircle2 className="w-5 h-5" /> Copiado!</>
              ) : (
                <><Copy className="w-5 h-5" /> Copiar Chave</>
              )}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Nome: {holderName} / Banco: {bankName}
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { 
  X, CheckCircle2, HeartHandshake, QrCode, 
  Loader2, MessageSquareHeart, Ticket, Copy 
} from 'lucide-react';
import { reserveGift } from '@/actions/gifts';
import { Gift } from '@/types/gift';

interface GiftModalProps {
  gift: Gift;
  onClose: () => void;
}

export default function GiftModal({ gift, onClose }: GiftModalProps) {
  const [isReserving, setIsReserving] = useState(false);
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  const [error, setError] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const [code, setCode] = useState('');
  const [confirmedGuestName, setConfirmedGuestName] = useState(''); // Armazena o nome retornado pelo banco
  const [message, setMessage] = useState('');

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText('123.456.789-00');
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleConfirmReservation = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsReserving(true);
    setError(null);

    const result = await reserveGift({
      giftId: gift.id,
      code: code.trim().toUpperCase(),
      message,
    });

    if (result.error) {
      setError(result.error);
      setIsReserving(false);
    } else {
      setConfirmedGuestName(result.guestName || '');
      setStep('SUCCESS');
      setIsReserving(false);
    }
  };

  return (
    <div className="m-0 fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-xl rounded-[var(--radius-xl)] shadow-2xl overflow-hidden relative border border-border animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'FORM' ? (
          <form onSubmit={handleConfirmReservation} className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartHandshake className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-serif text-primary">Reservar Presente</h2>
              <p className="text-sm text-muted-foreground">
                Preencha os detalhes abaixo para nos enviar sua mensagem e reservar o item.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r flex items-center gap-2">
                <X className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg flex items-center justify-between border border-border/50">
                <div className="text-sm font-medium">{gift.name}</div>
                <div className="font-serif text-primary">{formatPrice(gift.price)}</div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Ticket className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <input 
                    required
                    type="text" 
                    placeholder="Seu Código (Ex: A7X9P)" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/40 outline-none transition-all uppercase tracking-widest font-mono"
                    maxLength={10}
                  />
                </div>
                <div className="relative">
                  <MessageSquareHeart className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <textarea 
                    rows={3}
                    placeholder="Escreva uma mensagem para os noivos..." 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/40 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Instruções de PIX</span>
                <QrCode className="w-4 h-4 text-primary/50" />
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white p-3 rounded-lg border border-primary/20 text-sm font-mono truncate">
                  123.456.789-00
                </code>
                <button 
                  type="button"
                  onClick={handleCopyPix}
                  className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                >
                  {copiedPix ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isReserving}
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {isReserving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Reserva'}
            </button>
          </form>
        ) : (
          <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-serif text-primary">Reserva Confirmada!</h2>
              <p className="text-foreground/80">
                Obrigado pelo carinho, <strong>{confirmedGuestName}</strong>! Sua mensagem e reserva foram registradas.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl text-sm italic text-muted-foreground">
               Não se esqueça de realizar o PIX para concluir seu presente.
            </div>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
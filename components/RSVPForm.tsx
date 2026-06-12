'use client';

import { useState } from 'react';
import { getGuestByCode, submitRsvp } from '@/actions/rsvp';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

type Guest = {
  id: string;
  name: string;
  isAttending: boolean | null;
};

export default function RSVPForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await getGuestByCode(code);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (result.success && result.guest) {
      setGuest(result.guest);
      setStep(2);
    }
    setIsLoading(false);
  };

  const handleToggleAttendance = (status: boolean) => {
    if (guest) {
      setGuest({ ...guest, isAttending: status });
    }
  };

  const handleSubmitRSVP = async () => {
    if (!guest || guest.isAttending === null) {
      setError('Por favor, selecione se você irá ou não ao evento.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await submitRsvp({
      id: guest.id,
      isAttending: guest.isAttending,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setStep(3);
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-[var(--radius-xl)] shadow-sm border border-border p-5 sm:p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">
      
      {step !== 3 && (
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif text-primary mb-2 sm:mb-3">Confirmação de Presença</h1>
          <p className="text-foreground/80 text-sm sm:text-base w-full max-w-lg mx-auto">
            Ficaremos muito felizes em ter você conosco neste dia tão especial.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 w-full max-w-md mx-auto p-4 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r-md flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ESTADO 1: Inserção do Código */}
      {step === 1 && (
        <form onSubmit={handleSearchCode} className="space-y-4 sm:space-y-5 w-full max-w-md mx-auto">
          <div>
            <label htmlFor="code" className="sr-only">Digite seu código individual</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Digite seu código (Ex: A7X9P)"
              className="w-full h-14 px-4 bg-input-background border border-border rounded-lg text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60 placeholder:tracking-normal placeholder:text-sm"
              required
              maxLength={10}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || code.length < 3}
            className="w-full h-14 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continuar
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      )}

      {step === 2 && guest && (
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-300">
          <div className="p-6 sm:p-8 rounded-xl border border-border bg-background text-center space-y-6 max-w-md mx-auto">
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Convidado</p>
              <h2 className="font-serif text-2xl text-foreground">{guest.name}</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleToggleAttendance(true)}
                className={`flex items-center justify-center gap-2 flex-1 px-5 py-4 rounded-lg border transition-all text-sm font-medium ${
                  guest.isAttending === true
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm scale-[1.02]'
                    : 'bg-card border-border text-foreground hover:bg-muted/50'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Eu irei
              </button>
              
              <button
                type="button"
                onClick={() => handleToggleAttendance(false)}
                className={`flex items-center justify-center gap-2 flex-1 px-5 py-4 rounded-lg border transition-all text-sm font-medium ${
                  guest.isAttending === false
                    ? 'bg-muted border-muted-foreground/50 text-foreground shadow-inner scale-[1.02]'
                    : 'bg-card border-border text-foreground hover:bg-muted/50'
                }`}
              >
                <XCircle className="w-5 h-5" />
                Não irei
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-border/50 w-full max-w-md mx-auto space-y-3 sm:space-y-4">
            <button
              onClick={handleSubmitRSVP}
              disabled={isLoading || guest.isAttending === null}
              className="w-full h-14 flex items-center justify-center bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Presença'}
            </button>
            
            <button
               onClick={() => { setStep(1); setGuest(null); setCode(''); }}
               disabled={isLoading}
               className="w-full py-2 sm:py-3 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Voltar / Inserir outro código
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-4 py-6 sm:py-8 animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-primary">Obrigado!</h2>
          <p className="text-foreground/80 text-base sm:text-lg">
            Sua resposta foi registrada com sucesso.
          </p>
          <button
            onClick={() => { setStep(1); setGuest(null); setCode(''); }}
            className="mt-6 sm:mt-8 px-6 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted-foreground/20 transition-colors"
          >
            Responder por outra pessoa
          </button>
        </div>
      )}
    </div>
  );
}
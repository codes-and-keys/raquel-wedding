'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getGuestByCode, submitRsvp } from '@/actions/rsvp';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import StepIndicator from '@/components/StepIndicator';

type Guest = {
  id: string;
  name: string;
  isAttending: boolean | null;
};

export default function RSVPForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
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

    router.push(
      `/obrigado?name=${encodeURIComponent(guest.name)}&attending=${guest.isAttending}`
    );
  };

  const handleReset = () => {
    setStep(1);
    setGuest(null);
    setCode('');
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-[var(--radius-xl)] shadow-sm border border-border p-5 sm:p-8 md:p-12 animate-in fade-in zoom-in-95 duration-500">

      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif text-primary mb-2 sm:mb-3">
          Confirmação de Presença
        </h1>
        <p className="text-foreground/80 text-sm sm:text-base max-w-lg mx-auto">
          Ficaremos muito felizes em ter você conosco neste dia tão especial.
        </p>
      </div>
      <StepIndicator currentStep={step} totalSteps={2} />

      {error && (
        <div className="mb-6 w-full max-w-md mx-auto p-4 bg-destructive/10 border-l-4 border-destructive text-destructive text-sm rounded-r-md flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSearchCode} className="space-y-4 sm:space-y-5 w-full max-w-md mx-auto">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-muted-foreground mb-2 text-center">
              Digite seu código individual
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: A7X9P"
              className="field h-14 text-center text-lg tracking-widest uppercase placeholder:tracking-normal"
              required
              maxLength={10}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || code.length < 3}
            className="btn-primary w-full h-14 group"
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
              className="btn-primary w-full h-14"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Presença'}
            </button>

            <button
              onClick={handleReset}
              disabled={isLoading}
              className="btn-ghost w-full py-2 sm:py-3"
            >
              Voltar / Inserir outro código
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

import Header from '@/components/Header';
import SongSuggestionForm from '@/components/SongSuggestionForm';
import Link from 'next/link';
import { CheckCircle2, XCircle, Music, Gift, Home } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Obrigado | Raquel & Filipe',
};

interface Props {
  searchParams: Promise<{ name?: string; attending?: string }>;
}

export default async function ThankYouPage({ searchParams }: Props) {
  const params = await searchParams;
  const firstName = params.name
    ? decodeURIComponent(params.name).split(' ')[0]
    : null;
  const isAttending = params.attending === 'true';

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-lg space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Card principal */}
          <div className="bg-card border border-border rounded-[var(--radius-xl)] p-8 text-center space-y-4 shadow-sm">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isAttending ? 'bg-primary/10' : 'bg-muted'}`}>
              {isAttending
                ? <CheckCircle2 className="w-8 h-8 text-primary" />
                : <XCircle className="w-8 h-8 text-muted-foreground" />
              }
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif text-primary">
              {firstName ? `${firstName}, obrigado!` : 'Obrigado!'}
            </h1>

            <p className="text-foreground/80 text-sm sm:text-base leading-relaxed">
              {isAttending
                ? 'Sua presença foi confirmada. Mal podemos esperar para celebrar com você neste dia tão especial!'
                : 'Sua resposta foi registrada. Sentiremos muito a sua falta — esperamos ter você em nosso coração neste dia!'
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {isAttending && (
                <Link
                  href="/presentes"
                  className="btn-primary flex-1 py-3.5 text-sm"
                >
                  <Gift className="w-4 h-4" /> Ver lista de presentes
                </Link>
              )}
              <Link
                href="/rsvp"
                className="btn-muted flex-1 py-3.5 text-sm"
              >
                Responder por outra pessoa
              </Link>
              <Link
                href="/"
                className="btn-ghost flex-1 py-3.5 text-sm"
              >
                <Home className="w-4 h-4" /> Início
              </Link>
            </div>
          </div>

          {/* Sugestão de música — só para quem vai */}
          {isAttending && (
            <div className="bg-card border border-border rounded-[var(--radius-xl)] p-8 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-primary">Sugira uma música</h2>
                  <p className="text-xs text-muted-foreground">Qual música não pode faltar na festa?</p>
                </div>
              </div>
              <SongSuggestionForm guestName={firstName ?? ''} />
            </div>
          )}

        </div>
      </div>

      <footer className="py-6 text-center border-t border-border bg-card">
        <p className="text-sm text-foreground/60">Com amor, Raquel & Filipe • 29.11.2026</p>
      </footer>
    </main>
  );
}

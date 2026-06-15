import Header from '@/components/Header';
import Carousel from '@/components/Carousel';
import InfoCard from '@/components/InfoCard';
import Link from 'next/link';
import { Clock, MapPin, CalendarHeart, Shirt } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section
        id="home"
        className="relative min-h-[85svh] pt-28 pb-16 px-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-primary/20 via-background to-card"
      >
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-5 max-w-2xl w-full">
          <p className="text-xs sm:text-sm font-medium text-primary tracking-[0.3em] uppercase">
            ✦ Você está convidado ✦
          </p>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif text-primary leading-tight">
            Raquel & Filipe
          </h1>

          <div className="flex items-center justify-center gap-3 text-primary/40">
            <div className="h-px w-12 bg-primary/30" />
            <span className="text-base">✦</span>
            <div className="h-px w-12 bg-primary/30" />
          </div>

          <p className="text-base sm:text-lg text-foreground/70 italic font-serif leading-relaxed px-2 sm:px-8">
            &quot;O amor é a única força capaz de transformar um inimigo em amigo e dois caminhos em um só.&quot;
          </p>

          <div className="inline-flex items-center gap-2 px-6 py-3 bg-background border border-border rounded-full shadow-sm">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium text-foreground text-sm sm:text-base">
              16 de Novembro de 2026 às 16:00
            </span>
          </div>

          <div className="pt-2">
            <Link
              href="/rsvp"
              className="inline-block px-8 sm:px-10 py-3.5 sm:py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-md text-sm sm:text-base"
            >
              Confirmar Presença
            </Link>
          </div>
        </div>
      </section>

      {/* Galeria */}
      <section className="py-12 px-4 w-full bg-card">
        <Carousel />
      </section>

      {/* Informações */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          <InfoCard icon={MapPin} title="O Local">
            Fazenda das Flores<br />
            Rodovia SP-123, Km 45<br />
            Interior, SP
          </InfoCard>

          <InfoCard icon={Shirt} title="Dress Code">
            Passeio Completo.<br />
            Sugerimos evitar tons de branco, off-white e a paleta terracota.
          </InfoCard>

          <InfoCard icon={CalendarHeart} title="Cronograma">
            15:30 — Recepção<br />
            16:00 — Cerimônia<br />
            17:30 — Jantar & Festa
          </InfoCard>
        </div>
      </section>

      {/* CTA RSVP */}
      <section id="rsvp" className="py-24 px-4 text-center max-w-3xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex items-center justify-center gap-3 text-primary/40">
          <div className="h-px w-16 bg-primary/30" />
          <span className="text-base">✦</span>
          <div className="h-px w-16 bg-primary/30" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-serif text-primary">
          Sua presença é nosso maior presente
        </h2>
        <p className="text-foreground/80 text-sm sm:text-base leading-relaxed">
          Por favor, confirme sua presença até o dia 16 de Outubro para que possamos organizar tudo com muito carinho.
        </p>

        <Link
          href="/rsvp"
          className="inline-block px-10 py-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-md"
        >
          Confirmar Presença
        </Link>
      </section>

      <footer className="py-8 text-center border-t border-border bg-card">
        <p className="text-sm text-foreground/60">
          Com amor, Raquel & Filipe © 2026
        </p>
      </footer>
    </main>
  );
}

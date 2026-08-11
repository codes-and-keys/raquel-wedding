import Header from '@/components/Header';
import Carousel from '@/components/Carousel';
import InfoCard from '@/components/InfoCard';
import CountdownTimer from '@/components/CountdownTimer';
import AnimatedSection from '@/components/AnimatedSection';
import Link from 'next/link';
import { Clock, MapPin, CalendarHeart, Shirt, MessageSquareHeart } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section
        id="home"
        className="relative min-h-[85svh] pt-28 pb-16 px-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-primary/10 via-background to-card overflow-hidden"
      >
        {/* Blob decorativo */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-5 max-w-2xl w-full">
          <p className="text-xs sm:text-sm font-medium text-primary/70 tracking-[0.35em] uppercase">
            ✦ Você está convidado ✦
          </p>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-serif text-primary leading-tight">
            Raquel & Filipe
          </h1>

          <div className="flex items-center justify-center gap-3 text-primary/30">
            <div className="h-px w-16 bg-primary/25" />
            <span className="text-base text-primary/50">✦</span>
            <div className="h-px w-16 bg-primary/25" />
          </div>

          <p className="text-base sm:text-lg text-foreground/60 italic font-serif leading-relaxed px-2 sm:px-8">
            &quot;O amor é a única força capaz de transformar um inimigo em amigo e dois caminhos em um só.&quot;
          </p>

          <div className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-full shadow-sm">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium text-foreground text-sm sm:text-base">
              29 de Novembro de 2026 às 15h
            </span>
          </div>

          <CountdownTimer />
        </div>
      </section>

      {/* Galeria */}
      <section className="py-14 px-4 w-full bg-card">
        <AnimatedSection>
          <Carousel />
        </AnimatedSection>
      </section>

      {/* Informações */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          <AnimatedSection delay={0} className="h-full">
            <InfoCard icon={MapPin} title="O Local">
              <span className="block">R. Braz F. Silva, 23</span>
              <span className="block">Jardim Arujá — Arujá, SP</span>
              <span className="block">CEP 07432-575</span>
              <a
                href="https://maps.google.com/?q=R.+Braz+F.+Silva,+23,+Jardim+Aruja,+Aruja,+SP,+07432-575"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-primary font-medium hover:underline text-xs"
              >
                <MapPin className="w-3 h-3" /> Como chegar →
              </a>
            </InfoCard>
          </AnimatedSection>

          <AnimatedSection delay={120} className="h-full">
            <InfoCard icon={Shirt} title="Dress Code">
              <span className="block font-medium text-foreground/90 mb-2">Social</span>
              <span className="block mb-1">
                Homens: traje social — blazer ou terno são bem-vindos.
              </span>
              <span className="block mb-1">
                Mulheres: traje social, vestido longo ou conjunto social elegante.
              </span>
              <span className="block mt-2 text-xs text-muted-foreground">
                Evitar: jeans, tênis, shorts, tons de marrom e de branco ou off-white.
              </span>
            </InfoCard>
          </AnimatedSection>

          <AnimatedSection delay={240} className="h-full">
            <InfoCard icon={CalendarHeart} title="Cronograma">
              <ul className="w-full divide-y divide-border/50">
                {[
                  { time: '14h30', label: 'Recepção dos convidados' },
                  { time: '15h00', label: 'Cerimônia de casamento' },
                  { time: '16h00', label: 'Coquetel & fotos' },
                  { time: '17h30', label: 'Jantar' },
                  { time: '19h30', label: 'Festa & abertura da pista' },
                ].map(({ time, label }) => (
                  <li key={time} className="flex items-center gap-3 py-2.5">
                    <span className="font-serif text-primary font-medium shrink-0 w-11 text-right">{time}</span>
                    <span className="w-px h-3 bg-border shrink-0" />
                    <span className="text-foreground/70">{label}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          </AnimatedSection>
        </div>
      </section>

      {/* Mapa */}
      <section className="py-20 px-4 bg-card">
        <AnimatedSection className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif text-primary">Como Chegar</h2>
            <p className="text-foreground/60 text-sm">
              R. Braz F. Silva, 23 — Jardim Arujá, Arujá - SP, 07432-575
            </p>
            <a
              href="https://maps.google.com/?q=R.+Braz+F.+Silva,+23,+Jardim+Aruja,+Aruja,+SP,+07432-575"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <MapPin className="w-4 h-4" />
              Abrir no Google Maps
            </a>
          </div>
          <div className="rounded-[var(--radius-xl)] overflow-hidden border border-border shadow-md w-full h-72 sm:h-96">
            <iframe
              src="https://maps.google.com/maps?q=R.+Braz+F+Silva,+23,+Jardim+Aruja,+Aruja,+SP,+07432-575&output=embed"
              width="100%"
              height="100%"
              loading="lazy"
              title="Local do casamento"
              className="border-0"
            />
          </div>
        </AnimatedSection>
      </section>

      {/* Mural */}
      <section className="py-24 px-4 bg-muted/40">
        <AnimatedSection className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-primary/25" />
            <MessageSquareHeart className="w-4 h-4 text-primary/60" />
            <div className="h-px w-12 bg-primary/25" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-primary">Mural de Mensagens</h2>
          <p className="text-foreground/60 text-sm sm:text-base leading-relaxed">
            Deixe um recado especial para os noivos. Suas palavras vão ficar guardadas para sempre neste dia tão especial.
          </p>
          <Link
            href="/mural"
            className="btn-primary px-8 py-3.5 text-sm sm:text-base shadow-md shadow-primary/20 hover:scale-105"
          >
            <MessageSquareHeart className="w-4 h-4" />
            Escrever mensagem
          </Link>
        </AnimatedSection>
      </section>

      {/* CTA RSVP */}
      <section id="rsvp" className="relative py-28 sm:py-36 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card via-primary/8 to-primary/20" aria-hidden="true" />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full bg-primary/8 blur-3xl" />
        </div>

        <AnimatedSection className="relative max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/60 font-medium">
              ✦ &nbsp;Confirmação de Presença&nbsp; ✦
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif text-primary leading-tight">
              Sua presença é<br />nosso maior presente
            </h2>
          </div>

          <p className="text-foreground/60 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Confirme sua presença até o dia{' '}
            <strong className="text-foreground/80 font-medium">29 de Outubro</strong>{' '}
            para que possamos organizar tudo com muito carinho.
          </p>

          <div className="flex flex-col items-center gap-3 pt-2">
            <Link
              href="/rsvp"
              className="btn-primary px-12 py-5 text-base shadow-lg shadow-primary/30 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
            >
              Confirmar Presença
            </Link>
            <p className="text-xs text-muted-foreground">Prazo final: 29 de Outubro de 2026</p>
          </div>
        </AnimatedSection>
      </section>

      <footer className="py-8 text-center border-t border-border bg-card">
        <p className="text-sm text-foreground/50">
          Com amor, Raquel & Filipe © 2026
        </p>
        <p className="text-xs text-foreground/35 mt-1">
          Desenvolvido por Codes and Keys
        </p>
      </footer>
    </main>
  );
}

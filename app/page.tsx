import Header from '@/components/Header';
import Carousel from '@/components/Carousel';
import Link from 'next/link';
import { Clock, MapPin, CalendarHeart, Shirt } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen scroll-smooth">
      <Header />

      <section id="home" className="relative pt-32 px-4 mx-auto flex flex-col items-center justify-center text-center bg-gradient-to-b from-primary/20 via-background to-card">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-6 max-w-2xl">
          <p className="text-sm md:text-base font-medium text-primary tracking-widest uppercase">
            Você está convidado
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-primary">
            Raquel & Filipe
          </h1>
          <p className="text-lg text-foreground/80 italic font-serif">
            &quot;O amor é a única força capaz de transformar um inimigo em amigo e dois caminhos em um só.&quot;
          </p>
          
          <div className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-background border border-border rounded-full shadow-sm">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">16 de Novembro às 16:00</span>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 w-full bg-card">
        <Carousel />
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-[var(--radius-xl)] p-8 text-center space-y-4 shadow-sm hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-secondary/30 rounded-full flex items-center justify-center mx-auto text-primary">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif">O Local</h3>
            <p className="text-foreground/70 text-sm">
              Fazenda das Flores<br />
              Rodovia SP-123, Km 45<br />
              Interior, SP
            </p>
          </div>

          <div className="bg-card border border-border rounded-[var(--radius-xl)] p-8 text-center space-y-4 shadow-sm hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-secondary/30 rounded-full flex items-center justify-center mx-auto text-primary">
              <Shirt className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif">Dress Code</h3>
            <p className="text-foreground/70 text-sm">
              Passeio Completo.<br />
              Sugerimos evitar tons de branco, off-white e a paleta terracota.
            </p>
          </div>

          <div className="bg-card border border-border rounded-[var(--radius-xl)] p-8 text-center space-y-4 shadow-sm hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-secondary/30 rounded-full flex items-center justify-center mx-auto text-primary">
              <CalendarHeart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif">Cronograma</h3>
            <p className="text-foreground/70 text-sm">
              15:30 - Recepção<br />
              16:00 - Cerimônia<br />
              17:30 - Jantar & Festa
            </p>
          </div>
        </div>
      </section>

      <section id="rsvp" className="py-24 px-4 text-center max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl md:text-4xl font-serif text-primary">
          Sua presença é nosso maior presente
        </h2>
        <p className="text-foreground/80">
          Por favor, confirme sua presença até o dia 16 de Novembro para que possamos organizar tudo com muito carinho.
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
import Header from '@/components/Header';
import RSVPForm from '@/components/RSVPForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RSVP | Raquel & Filipe',
  description: 'Confirme sua presença no casamento de Raquel e Filipe.',
};

export default function RSVPPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="px-4 pt-32 pb-24 flex justify-center">
        <RSVPForm />
      </div>

      <footer className="py-6 text-center border-t border-border bg-card mt-auto">
        <p className="text-sm text-foreground/60 font-sans">
          Raquel & Filipe • 29.11.2026
        </p>
        <p className="text-xs text-foreground/35 mt-1">
          Desenvolvido por Codes and Keys
        </p>
      </footer>
    </main>
  );
}
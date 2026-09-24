import Link from 'next/link';
import { Gift } from 'lucide-react';

type Variant = 'attending' | 'declined';

const copy: Record<Variant, { title: string; text: string }> = {
  attending: {
    title: 'Quer nos presentear?',
    text: 'Preparamos uma lista com muito carinho para o início da nossa nova vida juntos.',
  },
  declined: {
    title: 'Mesmo de longe, você faz parte',
    text: 'Se quiser nos enviar um carinho, nossa lista de presentes está disponível.',
  },
};

export default function GiftsCta({ variant }: { variant: Variant }) {
  const { title, text } = copy[variant];

  return (
    <div className="bg-primary text-primary-foreground rounded-[var(--radius-xl)] p-8 text-center space-y-4 shadow-lg shadow-primary/20">
      <div className="w-14 h-14 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto">
        <Gift className="w-7 h-7" />
      </div>
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="text-primary-foreground/85 text-sm sm:text-base leading-relaxed">{text}</p>
      <Link
        href="/presentes"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 bg-card text-primary font-medium rounded-lg shadow-md transition-all hover:scale-105 active:scale-[0.98]"
      >
        <Gift className="w-4 h-4" /> Ver lista de presentes
      </Link>
    </div>
  );
}

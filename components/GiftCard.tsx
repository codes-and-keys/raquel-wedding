import { HeartHandshake } from 'lucide-react';
import { Gift } from '@/types/gift';
import { formatPrice } from '@/lib/formatters';

interface GiftCardProps {
  gift: Gift;
  onReserve: (gift: Gift) => void;
}

export default function GiftCard({ gift, onReserve }: GiftCardProps) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-xl)] overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col group">
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        {gift.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={gift.imageUrl}
            alt={gift.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-primary/20">
            <HeartHandshake className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 left-3 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium text-primary">
          {gift.category}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="space-y-1">
          <h3 className="font-serif text-lg leading-tight text-foreground">{gift.name}</h3>
          {gift.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{gift.description}</p>
          )}
        </div>

        <div className="mt-auto space-y-4">
          <div className="text-xl font-medium text-foreground">{formatPrice(gift.price)}</div>

          {gift.isAvailable ? (
            <button
              onClick={() => onReserve(gift)}
              className="btn-primary w-full py-3 text-sm shadow-sm"
            >
              Reservar
            </button>
          ) : (
            <div className="btn-muted w-full py-3 text-sm cursor-default">
              Já Reservado!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

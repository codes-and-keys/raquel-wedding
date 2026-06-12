'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';

// Opcional: botões de navegação (podem ser escondidos em mobile)
export default function Carousel() {
  const [emblaRef] = useEmblaCarousel({
    loop: true,
    align: 'start',
    dragFree: false,
    containScroll: 'trimSnaps',
  });


  const slides = [1, 2, 3, 4];

  return (
    <div className="relative group max-w-6xl mx-auto">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 px-4">
          {slides.map((i) => (
            <div
              key={i}
              className="relative w-[85vw] md:w-[400px] h-[400px] md:h-[500px] shrink-0 rounded-[var(--radius-xl)] overflow-hidden shadow-sm border border-border/50 bg-muted/20"
            >
              <Image
                src={`/foto-${i}.jpg`}
                alt={`Foto dos noivos ${i}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 85vw, 400px"
                priority={i === 1}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
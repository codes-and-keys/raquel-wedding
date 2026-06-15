'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';

const slides = [1, 2, 3, 4];

export default function Carousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    dragFree: false,
    containScroll: 'trimSnaps',
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || isPaused) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [emblaApi, isPaused]);

  return (
    <div
      className="relative max-w-6xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 sm:gap-4 px-4">
          {slides.map((i) => (
            <div
              key={i}
              className="relative w-[82vw] sm:w-[65vw] md:w-[400px] h-[340px] sm:h-[400px] md:h-[500px] shrink-0 rounded-[var(--radius-xl)] overflow-hidden shadow-sm border border-border/50 bg-muted/20"
            >
              <Image
                src={`/foto-${i}.jpg`}
                alt={`Foto dos noivos ${i}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 82vw, (max-width: 768px) 65vw, 400px"
                priority={i === 1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores de navegação */}
      <div className="flex justify-center items-center gap-2 mt-5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === selectedIndex ? 'w-6 bg-primary' : 'w-1.5 bg-primary/25'
            }`}
            aria-label={`Ir para foto ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

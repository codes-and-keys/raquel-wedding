'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = Array.from({ length: 22 }, (_, i) => `/photo-${String(i + 1).padStart(2, '0')}.jpg`);

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
          {slides.map((src, i) => (
            <div
              key={src}
              className="relative w-[82vw] sm:w-[65vw] md:w-[400px] h-[340px] sm:h-[400px] md:h-[500px] shrink-0 rounded-[var(--radius-xl)] overflow-hidden shadow-sm border border-border/50 bg-muted/20"
            >
              <Image
                src={src}
                alt={`Foto ${i + 1} dos noivos`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 82vw, (max-width: 768px) 65vw, 400px"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-background transition-all"
        aria-label="Foto anterior"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      <button
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 bg-background/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-background transition-all"
        aria-label="Próxima foto"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>

      <div className="flex justify-center items-center mt-5">
        <span className="text-xs text-muted-foreground font-medium tabular-nums">
          {selectedIndex + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}

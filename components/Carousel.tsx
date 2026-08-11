'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  // No mobile centraliza o slide ativo (mostra um pedaço da foto anterior e da próxima
  // simetricamente); no desktop mantém o alinhamento pelo início, como já era.
  useEffect(() => {
    if (!emblaApi) return;
    const mq = window.matchMedia('(max-width: 640px)');
    const applyAlign = () => emblaApi.reInit({ align: mq.matches ? 'center' : 'start' });
    applyAlign();
    mq.addEventListener('change', applyAlign);
    return () => mq.removeEventListener('change', applyAlign);
  }, [emblaApi]);

  // Trava o scroll do body e permite fechar com Esc enquanto a foto está em tela cheia.
  useEffect(() => {
    if (lightboxIndex === null) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? i : (i + 1) % slides.length));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i === null ? i : (i - 1 + slides.length) % slides.length));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxIndex]);

  return (
    <div
      className="relative max-w-6xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 sm:gap-4 px-4">
          {slides.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label={`Ver foto ${i + 1} em tela cheia`}
              className="relative w-[82vw] sm:w-[65vw] md:w-[400px] h-[340px] sm:h-[400px] md:h-[500px] shrink-0 rounded-[var(--radius-xl)] overflow-hidden shadow-sm border border-border/50 bg-muted/20 cursor-zoom-in"
            >
              <Image
                src={src}
                alt={`Foto ${i + 1} dos noivos`}
                fill
                quality={90}
                className="object-cover"
                sizes="(max-width: 640px) 82vw, (max-width: 768px) 65vw, 400px"
                priority={i === 0}
              />
            </button>
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

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            aria-label="Fechar"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? i : (i - 1 + slides.length) % slides.length)); }}
            aria-label="Foto anterior"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="relative w-full h-full p-4 sm:p-10" onClick={(e) => e.stopPropagation()}>
            <Image
              src={slides[lightboxIndex]}
              alt={`Foto ${lightboxIndex + 1} dos noivos em tela cheia`}
              fill
              quality={95}
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i === null ? i : (i + 1) % slides.length)); }}
            aria-label="Próxima foto"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <span className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/70 font-medium tabular-nums">
            {lightboxIndex + 1} / {slides.length}
          </span>
        </div>
      )}
    </div>
  );
}

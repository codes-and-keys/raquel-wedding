"use client";

import { useState } from "react";
import { Gift} from "@/types/gift";
import GiftModal from './giftModal';
import {
  Copy,
  CheckCircle2,
  HeartHandshake,
  QrCode,
} from "lucide-react";

export default function GiftsList({
  initialGifts,
}: {
  initialGifts: Gift[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  const categories = [
    "Todos",
    ...Array.from(new Set(initialGifts.map((g) => g.category))),
  ];

  const filteredGifts =
    activeCategory === "Todos"
      ? initialGifts
      : initialGifts.filter((g) => g.category === activeCategory);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText("123.456.789-00");
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif text-primary">
          Lista de Presentes
        </h1>
        <p className="text-foreground/80 text-lg">
          O maior presente é a sua presença, mas se desejar nos presentear de
          outra forma, separamos algumas opções e cotas para a nossa lua de mel.
        </p>
      </div>

      <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md py-4 border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar hide-scrollbar md:justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                activeCategory === category
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-foreground/80 hover:border-primary/50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGifts.map((gift) => (
          <div
            key={gift.id}
            className="bg-card border border-border rounded-[var(--radius-xl)] overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col group"
          >
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
                <h3 className="font-serif text-lg leading-tight text-foreground">
                  {gift.name}
                </h3>
                {gift.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {gift.description}
                  </p>
                )}
              </div>

              <div className="mt-auto space-y-4">
                <div className="text-xl font-medium text-foreground">
                  {formatPrice(gift.price)}
                </div>

                {gift.isAvailable ? (
                  <button
                    onClick={() => setSelectedGift(gift)}
                    className="w-full py-3 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Reservar
                  </button>
                ) : (
                  <div className="bg-muted text-muted-foreground w-full py-3 flex items-center justify-center gap-2 rounded-lg font-medium shadow-sm">
                    Já Reservado!
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredGifts.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed border-border rounded-[var(--radius-xl)]">
            Nenhum presente cadastrado nesta categoria ainda.
          </div>
        )}
      </div>

      {selectedGift && (
        <GiftModal 
          gift={selectedGift} 
          onClose={() => setSelectedGift(null)} 
        />
      )}

      <div
        id="pix-section"
        className="mt-16 bg-gradient-to-br from-card to-muted border border-border rounded-[var(--radius-xl)] p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12"
      >
        <div className="bg-background p-4 rounded-2xl shadow-sm shrink-0 border border-border">
          <div className="w-40 h-40 bg-muted-foreground/10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border gap-2">
            <QrCode className="w-12 h-12 text-primary/50" />
            <span className="text-xs text-muted-foreground font-mono">
              QR CODE AQUI
            </span>
          </div>
        </div>

        <div className="space-y-6 text-center md:text-left flex-1">
          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-primary">
              Cotas & Contribuições
            </h2>
            <p className="text-foreground/80 text-lg">
              Você pode contribuir com qualquer valor para a nossa lua de mel ou
              projetos futuros através do nosso PIX.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Chave PIX (CPF)
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <code className="px-6 py-4 bg-background border border-border rounded-lg text-lg font-mono text-foreground w-full sm:w-auto text-center">
                123.456.789-00
              </code>
              <button
                onClick={handleCopyPix}
                className="w-full sm:w-auto px-6 py-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-sm"
              >
                {copiedPix ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" /> Copiar Chave
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Nome: Raquel Pereira / Banco: Nubank
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

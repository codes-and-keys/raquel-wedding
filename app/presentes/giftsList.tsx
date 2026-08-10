"use client";

import { useState } from "react";
import { Gift } from "@/types/gift";
import GiftModal from './giftModal';
import GiftCard from '@/components/GiftCard';
import CategoryFilter from '@/components/CategoryFilter';

export default function GiftsList({ initialGifts }: { initialGifts: Gift[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);

  const categories = [
    "Todos",
    ...Array.from(new Set(initialGifts.map((g) => g.category))),
  ];

  const filteredGifts =
    activeCategory === "Todos"
      ? initialGifts
      : initialGifts.filter((g) => g.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-4">
        <h1 className="text-4xl md:text-5xl font-serif text-primary">
          Lista de Presentes
        </h1>
        <p className="text-foreground/80 text-base sm:text-lg leading-relaxed">
          O maior presente é a sua presença, mas se desejar nos presentear de
          outra forma, separamos algumas opções e cotas para a nossa lua de mel.
        </p>
      </div>

      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onChange={setActiveCategory}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {filteredGifts.map((gift) => (
          <GiftCard key={gift.id} gift={gift} onReserve={setSelectedGift} />
        ))}

        {filteredGifts.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground border border-dashed border-border rounded-[var(--radius-xl)]">
            Nenhum presente cadastrado nesta categoria ainda.
          </div>
        )}
      </div>

      {selectedGift && (
        <GiftModal gift={selectedGift} onClose={() => setSelectedGift(null)} />
      )}

    </div>
  );
}

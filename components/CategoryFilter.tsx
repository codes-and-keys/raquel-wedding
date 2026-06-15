interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ categories, activeCategory, onChange }: CategoryFilterProps) {
  return (
    <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md py-4 border-b border-border -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar md:justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              activeCategory === category
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border border-border text-foreground/80 hover:border-primary/50 hover:text-primary'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

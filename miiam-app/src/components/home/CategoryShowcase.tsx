"use client";

import Link from "next/link";

interface ShowcaseCategory {
  id: string;
  name: string;
  icon: string;
  gradient: string;
  item_count?: number;
}

interface CategoryShowcaseProps {
  categories: ShowcaseCategory[];
}

export default function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (categories.length === 0) return null;

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">🎨</span>
        <h2 className="text-on-surface text-lg font-bold">Explore Categories</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/app/food?filter=${cat.id}`}
            className={`${cat.gradient} group relative overflow-hidden rounded-2xl p-4 shadow-sm transition-all active:scale-[0.97]`}
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-20 w-20 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-150" />
            <span className="mb-2 block text-3xl transition-transform group-hover:scale-110">
              {cat.icon}
            </span>
            <h3 className="text-sm font-bold text-white">{cat.name}</h3>
            {cat.item_count !== undefined && (
              <p className="mt-0.5 text-[10px] text-white/80">{cat.item_count} items</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

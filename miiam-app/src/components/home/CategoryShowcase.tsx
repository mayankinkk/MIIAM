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
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎨</span>
        <h2 className="text-lg font-black text-on-surface">Explore Categories</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/app/food?filter=${cat.id}`}
            className={`${cat.gradient} rounded-2xl p-4 shadow-sm active:scale-[0.97] transition-all relative overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300" />
            <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
            <h3 className="font-bold text-sm text-white">{cat.name}</h3>
            {cat.item_count !== undefined && (
              <p className="text-[10px] text-white/80 mt-0.5">{cat.item_count} items</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
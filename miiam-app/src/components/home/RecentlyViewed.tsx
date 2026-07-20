"use client";

import Link from "next/link";
import BlurImage from "@/components/BlurImage";

interface RecentlyViewedItem {
  id: string;
  name: string;
  image_url?: string;
  cuisine?: string;
  rating?: string | number;
}

interface RecentlyViewedProps {
  items: RecentlyViewedItem[];
}

export default function RecentlyViewed({ items }: RecentlyViewedProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-5 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
          <h2 className="text-lg font-bold text-on-surface">Recently Viewed</h2>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <Link key={item.id} href={`/app/vendor/${item.id}`} className="flex-shrink-0 w-32 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform">
            <div className="relative h-24 bg-surface-container">
              {item.image_url ? (
                <BlurImage src={item.image_url} alt={item.name} fill className="w-full h-full" sizes="128px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
              )}
            </div>
            <div className="p-2">
              <h4 className="font-bold text-xs text-on-surface truncate">{item.name}</h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-bold text-green-700">★ {item.rating || 4.0}</span>
                {item.cuisine && <span className="text-[10px] text-on-surface-variant/70 truncate">• {item.cuisine.split(",")[0]}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

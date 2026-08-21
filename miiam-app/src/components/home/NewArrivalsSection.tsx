"use client";

import Link from "next/link";
import BlurImage from "@/components/BlurImage";

interface NewItem {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  vendor_name: string;
  is_veg?: boolean;
}

interface NewArrivalsSectionProps {
  items: NewItem[];
}

export default function NewArrivalsSection({ items }: NewArrivalsSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg animate-bounce">✨</span>
          <h2 className="text-lg font-black text-on-surface">New on MIIAM</h2>
        </div>
        <Link href="/app/food" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">See All</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/app/food`}
            className="flex-shrink-0 w-40 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-glow active:scale-[0.97] transition-all"
          >
            <div className="relative h-28 overflow-hidden">
              <BlurImage
                src={item.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"}
                alt={item.name}
                fill
                className="object-cover"
                sizes="160px"
                fallbackSrc="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"
              />
              <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-black px-2 py-1 rounded-full">
                NEW
              </div>
              {item.is_veg && (
                <div className="absolute bottom-2 right-2 w-4 h-4 border-2 border-green-600 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm text-on-surface line-clamp-1">{item.name}</h3>
              <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{item.vendor_name}</p>
              <span className="text-sm font-black text-primary mt-2 block">₹{item.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
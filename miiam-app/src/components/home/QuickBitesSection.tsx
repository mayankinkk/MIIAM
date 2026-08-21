"use client";

import Link from "next/link";
import BlurImage from "@/components/BlurImage";

interface QuickBite {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  vendor_name: string;
  is_veg?: boolean;
}

interface QuickBitesSectionProps {
  items: QuickBite[];
}

export default function QuickBitesSection({ items }: QuickBitesSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💸</span>
          <h2 className="text-lg font-black text-on-surface">Quick Bites Under ₹99</h2>
        </div>
        <Link href="/app/food?filter=under_99" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">See All</Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/app/food`}
            className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-glow active:scale-[0.97] transition-all"
          >
            <div className="relative h-24 overflow-hidden">
              <BlurImage
                src={item.image_url || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"}
                alt={item.name}
                fill
                className="object-cover"
                sizes="200px"
                fallbackSrc="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"
              />
              <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full">
                ₹{item.price}
              </div>
              {item.is_veg && (
                <div className="absolute bottom-2 left-2 w-4 h-4 border-2 border-green-600 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full" />
                </div>
              )}
            </div>
            <div className="p-2.5">
              <h3 className="font-bold text-sm text-on-surface line-clamp-1">{item.name}</h3>
              <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{item.vendor_name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
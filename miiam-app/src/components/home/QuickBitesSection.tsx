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
    <div className="px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💸</span>
          <h2 className="text-on-surface text-lg font-bold">Quick Bites Under ₹99</h2>
        </div>
        <Link
          href="/app/food?filter=under_99"
          className="text-accent bg-primary/10 rounded-full px-3 py-1.5 text-xs font-bold"
        >
          See All
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/app/food`}
            className="bg-surface-container-lowest card-glow overflow-hidden rounded-2xl shadow-sm transition-all active:scale-[0.97]"
          >
            <div className="relative h-24 overflow-hidden">
              <BlurImage
                src={
                  item.image_url ||
                  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"
                }
                alt={item.name}
                fill
                className="object-cover"
                sizes="200px"
                fallbackSrc="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80"
              />
              <div className="bg-primary text-on-primary absolute top-2 right-2 rounded-full px-2 py-1 text-[10px] font-black">
                ₹{item.price}
              </div>
              {item.is_veg && (
                <div className="absolute bottom-2 left-2 flex h-4 w-4 items-center justify-center rounded-sm border-2 border-green-600 bg-white">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                </div>
              )}
            </div>
            <div className="p-2.5">
              <h3 className="text-on-surface line-clamp-1 text-sm font-bold">{item.name}</h3>
              <p className="text-on-surface-variant mt-0.5 truncate text-[10px]">
                {item.vendor_name}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

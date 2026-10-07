"use client";

import Link from "next/link";
import BlurImage from "@/components/BlurImage";

interface Combo {
  id: string;
  name: string;
  description: string;
  image_url: string;
  original_price: number;
  combo_price: number;
  items: string[];
  category?: string;
  rating?: number;
  order_count?: number;
}

interface CombosSectionProps {
  combos: Combo[];
}

export default function CombosSection({ combos }: CombosSectionProps) {
  if (combos.length === 0) return null;

  return (
    <div className="px-5 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-black text-on-surface">Combos & Deals</h2>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Save more with combo offers</p>
        </div>
        <Link href="/app/food?filter=combos" className="text-xs font-bold text-accent bg-primary/10 px-3 py-1.5 rounded-full">See All</Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {combos.map((combo) => (
          <Link
            key={combo.id}
            href={`/app/food/combo/${combo.id}`}
            className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/40 active:scale-[0.97] transition-transform"
          >
            <div className="relative h-24 overflow-hidden">
              {combo.image_url ? (
                <BlurImage src={combo.image_url} alt={combo.name} fill className="object-cover" sizes="192px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-orange-100 to-amber-50">🎉</div>
              )}
              <div className="absolute top-1.5 right-1.5 bg-deal text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                {Math.round(((combo.original_price - combo.combo_price) / combo.original_price) * 100)}% OFF
              </div>
            </div>
            <div className="p-2.5">
              <h3 className="font-bold text-xs text-on-surface line-clamp-2 leading-snug">{combo.name}</h3>
              <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-on-surface-variant truncate">
                {combo.rating && combo.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-on-surface flex-shrink-0">
                    <span className="text-yellow-500">★</span>
                    {combo.rating.toFixed(1)}
                  </span>
                )}
                {combo.items && combo.items.length > 0 && <span>{combo.items.length} items</span>}
              </div>
              <div className="flex flex-col items-start mt-1.5 leading-tight">
                <span className="text-xs font-black text-on-surface">₹{combo.combo_price}</span>
                <span className="text-[10px] text-on-surface-variant line-through">₹{combo.original_price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
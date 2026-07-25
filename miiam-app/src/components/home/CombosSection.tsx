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
        <Link href="/app/home#combos" className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">See All</Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {combos.map((combo) => (
          <Link
            key={combo.id}
            href={`/app/food/combo/${combo.id}`}
            className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 active:scale-[0.97] transition-transform"
          >
            <div className="relative h-28 overflow-hidden">
              {combo.image_url ? (
                <BlurImage src={combo.image_url} alt={combo.name} fill className="object-cover" sizes="192px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-orange-100 to-amber-50">🎉</div>
              )}
              <div className="absolute top-2 right-2 bg-status-error text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md">
                {Math.round(((combo.original_price - combo.combo_price) / combo.original_price) * 100)}% OFF
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-bold text-sm text-on-surface line-clamp-2">{combo.name}</h3>
              {combo.category && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full">
                  {combo.category}
                </span>
              )}
              {combo.items && combo.items.length > 0 && (
                <span className="inline-block mt-2 ml-1 px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[9px] font-bold rounded-full">
                  {combo.items.length} items
                </span>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-on-surface-variant line-through">₹{combo.original_price}</span>
                <span className="text-sm font-black text-primary">₹{combo.combo_price}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
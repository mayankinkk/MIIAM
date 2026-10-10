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
    <div className="px-4 pb-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-on-surface text-lg font-bold">Combos & Deals</h2>
          <p className="text-on-surface-variant mt-0.5 text-[11px]">Save more with combo offers</p>
        </div>
        <Link
          href="/app/food?filter=combos"
          className="text-accent bg-primary/10 rounded-full px-3 py-1.5 text-xs font-bold"
        >
          See All
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {combos.map((combo) => (
          <Link
            key={combo.id}
            href={`/app/food/combo/${combo.id}`}
            className="bg-surface-container-lowest border-outline-variant/40 overflow-hidden rounded-xl border transition-transform active:scale-[0.97]"
          >
            <div className="relative h-24 overflow-hidden">
              {combo.image_url ? (
                <BlurImage
                  src={combo.image_url}
                  alt={combo.name}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-3xl">
                  🎉
                </div>
              )}
              <div className="bg-deal absolute top-1.5 right-1.5 rounded-md px-1.5 py-0.5 text-[8px] font-black text-white shadow-sm">
                {Math.round(
                  ((combo.original_price - combo.combo_price) / combo.original_price) * 100
                )}
                % OFF
              </div>
            </div>
            <div className="p-2.5">
              <h3 className="text-on-surface line-clamp-2 text-xs leading-snug font-bold">
                {combo.name}
              </h3>
              <div className="text-on-surface-variant mt-1 flex items-center gap-2 truncate text-[9px] font-bold">
                {combo.rating && combo.rating > 0 && (
                  <span className="text-on-surface flex flex-shrink-0 items-center gap-0.5">
                    <span className="text-yellow-500">★</span>
                    {combo.rating.toFixed(1)}
                  </span>
                )}
                {combo.items && combo.items.length > 0 && <span>{combo.items.length} items</span>}
              </div>
              <div className="mt-1.5 flex flex-col items-start leading-tight">
                <span className="text-on-surface text-xs font-black">₹{combo.combo_price}</span>
                <span className="text-on-surface-variant text-[10px] line-through">
                  ₹{combo.original_price}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

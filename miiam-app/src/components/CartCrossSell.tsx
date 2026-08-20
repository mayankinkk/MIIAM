"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import VegNonVegBadge from "@/components/VegNonVegBadge";

interface SuggestedItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  vendor_id: string;
  vendor_name: string;
}

export default function CartCrossSell() {
  const supabase = useMemo(() => createClient(), []);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);

  const vendorIds = useMemo(
    () => Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean))),
    [items]
  );

  const existingItemIds = useMemo(
    () => new Set(items.map((i) => i.menu_item_id)),
    [items]
  );

  useEffect(() => {
    if (vendorIds.length === 0) return;

    async function loadSuggestions() {
      try {
        const { data: menuItems } = await supabase
          .from("menu_items")
          .select("id, name, price, image_url, is_veg, vendor_id, vendors(shop_name)")
          .in("vendor_id", vendorIds)
          .eq("is_available", true)
          .not("id", "in", `(${Array.from(existingItemIds).join(",")})`)
          .order("popularity", { ascending: false })
          .limit(10);

        if (menuItems) {
          const mapped = menuItems
            .slice(0, 6)
            .map((item: Record<string, unknown>) => ({
              id: item.id as string,
              name: item.name as string,
              price: item.price as number,
              image_url: item.image_url as string | null,
              is_veg: (item.is_veg as boolean) ?? false,
              vendor_id: item.vendor_id as string,
              vendor_name: (item.vendors as { shop_name: string } | null)?.shop_name ?? "",
            }));
          setSuggestions(mapped);
        }
      } catch {
        // silently fail
      }
    }

    loadSuggestions();
  }, [vendorIds, existingItemIds, supabase]);

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-[0px_4px_20px_rgba(77,33,42,0.06)] border border-outline-variant/10 dark:border-[var(--color-border-subtle)]/10">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">recommend</span>
        You might also like
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
        {suggestions.map((item) => (
          <div
            key={item.id}
            className="snap-start shrink-0 w-[140px] bg-surface dark:bg-[var(--color-surface)] rounded-xl overflow-hidden border border-outline-variant/10 dark:border-[var(--color-border-subtle)]/10"
          >
            <div className="relative w-full h-24 bg-surface-container dark:bg-[var(--color-surface-container)]">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="140px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline-variant text-2xl">fastfood</span>
                </div>
              )}
              <div className="absolute top-1.5 left-1.5">
                <VegNonVegBadge isVeg={item.is_veg} size="sm" className="bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-sm p-[1px]" />
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-bold text-on-surface dark:text-[var(--color-on-surface)] truncate leading-tight">
                {item.name}
              </p>
              <p className="text-[11px] text-on-surface-variant dark:text-[var(--color-outline)] mt-0.5 truncate">
                {item.vendor_name}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold text-primary">₹{item.price}</span>
                <button
                  onClick={() =>
                    addItem({
                      id: item.id,
                      menu_item_id: item.id,
                      vendor_id: item.vendor_id,
                      vendor_name: item.vendor_name,
                      name: item.name,
                      price: item.price,
                      image_url: item.image_url ?? undefined,
                      is_veg: item.is_veg,
                    })
                  }
                  className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

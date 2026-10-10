"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-urls";
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

  const existingItemIds = useMemo(() => new Set(items.map((i) => i.menu_item_id)), [items]);

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
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10);

        if (menuItems) {
          const mapped = menuItems.slice(0, 6).map((item: Record<string, unknown>) => ({
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
    <section className="border-outline-variant/60 border-b px-4 py-4">
      <h3 className="text-on-surface mb-3 flex items-center gap-2 text-[15px] font-bold">
        <span className="material-symbols-outlined text-accent text-[18px]">recommend</span>
        You might also like
      </h3>
      <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
        {suggestions.map((item) => (
          <div
            key={item.id}
            className="bg-surface border-outline-variant/60 w-[140px] shrink-0 snap-start overflow-hidden rounded-xl border"
          >
            <div className="bg-surface-container relative h-24 w-full">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="140px"
                  unoptimized={!canOptimizeImage(item.image_url)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="material-symbols-outlined text-outline-variant text-2xl">
                    fastfood
                  </span>
                </div>
              )}
              <div className="absolute top-1.5 left-1.5">
                <VegNonVegBadge
                  isVeg={item.is_veg}
                  size="sm"
                  className="rounded-sm bg-white/90 p-[1px] backdrop-blur-sm dark:bg-black/70"
                />
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-on-surface truncate text-xs leading-tight font-bold">
                {item.name}
              </p>
              <p className="text-on-surface-variant mt-0.5 truncate text-[11px]">
                {item.vendor_name}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-on-surface text-xs font-bold">₹{item.price}</span>
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
                  className="bg-primary text-on-primary hover:bg-primary-dim flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-95"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import BlurImage from "@/components/BlurImage";
import { motion } from "framer-motion";

interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  vendor_id: string | null;
  vendor_name: string | null;
  category: string;
  is_veg: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const BUCKET_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  under_99: { label: "Under ₹99", emoji: "🔥", color: "bg-orange-100 text-orange-700" },
  under_149: { label: "Under ₹149", emoji: "💰", color: "bg-emerald-100 text-emerald-700" },
  under_199: { label: "Under ₹199", emoji: "⭐", color: "bg-deal/10 text-deal" },
  under_249: { label: "Under ₹249", emoji: "🎯", color: "bg-accent/10 text-accent" },
};

export default function StoreItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const supabase = useMemo(() => createClient(), []);
  const { addItem, items, updateQuantity } = useCartStore();

  const [item, setItem] = useState<StoreItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      setLoading(true);
      const { data, error } = await supabase
        .from("store_items")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setItem(data);

      const { data: related } = await supabase
        .from("store_items")
        .select("*")
        .eq("category", data.category)
        .eq("is_active", true)
        .neq("id", id)
        .order("sort_order")
        .limit(6);

      setRelatedItems(related || []);
      setLoading(false);
    }

    if (id) fetchItem();
  }, [id, supabase]);

  const cartItem = items.find((i) => i.menu_item_id === id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    if (!item) return;
    addItem({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url || undefined,
      is_veg: item.is_veg,
      vendor_id: item.vendor_id || "store",
      vendor_name: item.vendor_name || "MIIAM Store",
    });
  };

  if (loading) {
    return (
      <div className="bg-surface min-h-screen">
        <div className="border-outline-variant/60 flex h-14 items-center gap-3 border-b px-3">
          <div className="bg-surface-container-high h-10 w-10 animate-pulse rounded-full" />
          <div className="space-y-1.5">
            <div className="bg-surface-container-high h-3 w-32 animate-pulse rounded" />
            <div className="bg-surface-container-high h-2.5 w-24 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-surface-container-high aspect-square max-h-[70vh] w-full animate-pulse" />
        <div className="space-y-3 px-4 py-4">
          <div className="bg-surface-container-high h-5 w-3/4 animate-pulse rounded" />
          <div className="bg-surface-container-high h-3 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="bg-surface flex min-h-screen flex-col items-center justify-center px-6">
        <span className="material-symbols-outlined text-on-surface-variant/30 mb-4 text-6xl">
          inventory_2
        </span>
        <h1 className="text-on-surface mb-1 text-xl font-black">Item Not Found</h1>
        <p className="text-on-surface-variant mb-4 text-sm">This item may have been removed.</p>
        <Link
          href="/app/food"
          className="bg-primary text-on-primary rounded-xl px-5 py-2.5 text-sm font-bold"
        >
          Browse Food
        </Link>
      </div>
    );
  }

  const bucket = BUCKET_LABELS[item.category];
  const savings = item.original_price ? item.original_price - item.price : 0;
  const discountPct = item.original_price ? Math.round((savings / item.original_price) * 100) : 0;

  return (
    <div className="bg-surface min-h-screen pb-44 md:pb-32">
      {/* Sticky header — back / item + vendor */}
      <header className="bg-surface-container-lowest/95 border-outline-variant/60 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="flex h-14 items-center gap-1 px-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0 flex-1 px-1">
            <p className="text-on-surface truncate text-[13px] font-bold">{item.name}</p>
            <p className="text-on-surface-variant truncate text-[11px]">
              {item.vendor_name || "MIIAM Store"}
            </p>
          </div>
          <div className="w-10 shrink-0" />
        </div>
      </header>

      {/* Full-bleed product image with overlay chips */}
      <div className="bg-surface-container relative aspect-square max-h-[70vh] w-full overflow-hidden">
        <BlurImage
          src={
            item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
          }
          alt={item.name}
          fill
          className="h-full w-full"
          sizes="100vw"
          fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
        />
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          {discountPct > 0 && (
            <span className="bg-status-error rounded-full px-2.5 py-1 text-xs font-black text-white shadow-md">
              {discountPct}% OFF
            </span>
          )}
          {bucket && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-md ${bucket.color}`}
            >
              {bucket.emoji} {bucket.label}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <section className="border-outline-variant/60 border-b px-4 py-4">
        <div className="flex items-start gap-2">
          <span
            aria-label={item.is_veg ? "Veg" : "Non-veg"}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 ${item.is_veg ? "border-green-600" : "border-red-600"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${item.is_veg ? "bg-green-600" : "bg-red-600"}`}
            />
          </span>
          <h1 className="text-on-surface flex-1 text-[17px] leading-snug font-bold">{item.name}</h1>
        </div>
        {item.vendor_name && (
          <p className="text-on-surface-variant mt-1.5 text-sm">{item.vendor_name}</p>
        )}
      </section>

      {/* Description */}
      {item.description && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <p className="text-on-surface-variant text-sm leading-relaxed">{item.description}</p>
        </section>
      )}

      {/* Delivery Info */}
      <section className="border-outline-variant/60 border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
            <span className="material-symbols-outlined text-accent text-lg">local_shipping</span>
          </div>
          <div>
            <p className="text-on-surface text-sm font-bold">Free Delivery</p>
            <p className="text-on-surface-variant text-xs">Delivered in 30-45 minutes</p>
          </div>
        </div>
      </section>

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <section className="px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-on-surface text-[15px] font-bold">Similar Items</h2>
            <Link href="/app/store" className="text-accent text-xs font-bold hover:underline">
              View All
            </Link>
          </div>
          <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {relatedItems.map((ri) => (
              <Link
                key={ri.id}
                href={`/app/store/${ri.id}`}
                className="bg-surface-container-low border-outline-variant/30 w-32 flex-shrink-0 overflow-hidden rounded-xl border shadow-sm transition-transform active:scale-[0.97]"
              >
                <div className="bg-surface-container relative h-20 overflow-hidden">
                  <BlurImage
                    src={
                      ri.image_url ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                    }
                    alt={ri.name}
                    fill
                    className="h-full w-full"
                    sizes="128px"
                    fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                  />
                  <span className="bg-deal absolute right-1 bottom-1 rounded-full px-1.5 py-0.5 text-[9px] font-black text-white">
                    ₹{ri.price}
                  </span>
                </div>
                <div className="p-2">
                  <h3 className="text-on-surface truncate text-[10px] font-bold">{ri.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky bottom bar — price + Add to cart (Blinkit style), sits above bottom nav */}
      <div className="bg-surface-container-lowest border-outline-variant/60 fixed right-0 bottom-[80px] left-0 z-40 border-t shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:right-6 md:left-auto md:max-w-md md:rounded-2xl md:border md:shadow-xl">
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
        >
          {qty === 0 ? (
            <>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-on-surface text-lg font-black">₹{item.price}</span>
                  {item.original_price && (
                    <span className="text-on-surface-variant text-sm line-through">
                      ₹{item.original_price}
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-tight font-bold text-green-600">
                  {discountPct > 0 ? `You save ₹${savings}` : "Inclusive of all taxes"}
                </p>
              </div>
              <motion.button
                onClick={handleAdd}
                whileTap={{ scale: 0.97 }}
                className="bg-primary text-on-primary shadow-primary/20 shrink-0 rounded-xl px-6 py-3 text-sm font-black shadow-md transition-all hover:brightness-95"
              >
                Add to cart
              </motion.button>
            </>
          ) : (
            <>
              <div className="bg-surface-container-lowest border-primary flex items-center gap-1 overflow-hidden rounded-lg border">
                <motion.button
                  onClick={() => updateQuantity(item.id, qty - 1)}
                  whileTap={{ scale: 0.8 }}
                  aria-label="Decrease quantity"
                  className="bg-primary text-on-primary flex h-10 w-10 items-center justify-center font-bold transition-colors hover:brightness-95"
                >
                  −
                </motion.button>
                <motion.span
                  key={qty}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-on-surface min-w-[24px] text-center text-sm font-extrabold"
                >
                  {qty}
                </motion.span>
                <motion.button
                  onClick={handleAdd}
                  whileTap={{ scale: 1.2 }}
                  aria-label="Increase quantity"
                  className="bg-primary text-on-primary flex h-10 w-10 items-center justify-center font-bold transition-colors hover:brightness-95"
                >
                  +
                </motion.button>
              </div>
              <Link
                href="/app/cart"
                className="bg-primary text-on-primary shadow-primary/20 flex-1 rounded-xl py-3 text-center text-sm font-black shadow-lg transition-all active:scale-95"
              >
                View Cart — ₹{(item.price * qty).toFixed(0)}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

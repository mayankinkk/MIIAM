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
      <div className="min-h-screen bg-surface">
        <div className="h-14 border-b border-outline-variant/60 flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-32 bg-surface-container-high animate-pulse rounded" />
            <div className="h-2.5 w-24 bg-surface-container-high animate-pulse rounded" />
          </div>
        </div>
        <div className="w-full aspect-square max-h-[70vh] bg-surface-container-high animate-pulse" />
        <div className="px-4 py-4 space-y-3">
          <div className="h-5 w-3/4 bg-surface-container-high animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-surface-container-high animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">inventory_2</span>
        <h1 className="text-xl font-black text-on-surface mb-1">Item Not Found</h1>
        <p className="text-sm text-on-surface-variant mb-4">This item may have been removed.</p>
        <Link href="/app/food" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold">Browse Food</Link>
      </div>
    );
  }

  const bucket = BUCKET_LABELS[item.category];
  const savings = item.original_price ? item.original_price - item.price : 0;
  const discountPct = item.original_price ? Math.round((savings / item.original_price) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface pb-44 md:pb-32">
      {/* Sticky header — back / item + vendor */}
      <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60">
        <div className="h-14 flex items-center gap-1 px-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0 px-1">
            <p className="text-[13px] font-bold text-on-surface truncate">{item.name}</p>
            <p className="text-[11px] text-on-surface-variant truncate">{item.vendor_name || "MIIAM Store"}</p>
          </div>
          <div className="w-10 shrink-0" />
        </div>
      </header>

      {/* Full-bleed product image with overlay chips */}
      <div className="relative w-full aspect-square max-h-[70vh] overflow-hidden bg-surface-container">
        <BlurImage
          src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"}
          alt={item.name}
          fill
          className="w-full h-full"
          sizes="100vw"
          fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
        />
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          {discountPct > 0 && (
            <span className="bg-status-error text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
              {discountPct}% OFF
            </span>
          )}
          {bucket && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-md ${bucket.color}`}>
              {bucket.emoji} {bucket.label}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <section className="px-4 py-4 border-b border-outline-variant/60">
        <div className="flex items-start gap-2">
          <span
            aria-label={item.is_veg ? "Veg" : "Non-veg"}
            className={`w-4 h-4 mt-0.5 shrink-0 border-2 rounded-[3px] flex items-center justify-center ${item.is_veg ? "border-green-600" : "border-red-600"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? "bg-green-600" : "bg-red-600"}`} />
          </span>
          <h1 className="text-[17px] font-bold text-on-surface leading-snug flex-1">{item.name}</h1>
        </div>
        {item.vendor_name && (
          <p className="text-sm text-on-surface-variant mt-1.5">{item.vendor_name}</p>
        )}
      </section>

      {/* Description */}
      {item.description && (
        <section className="px-4 py-4 border-b border-outline-variant/60">
          <p className="text-sm text-on-surface-variant leading-relaxed">{item.description}</p>
        </section>
      )}

      {/* Delivery Info */}
      <section className="px-4 py-4 border-b border-outline-variant/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-accent text-lg">local_shipping</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Free Delivery</p>
            <p className="text-xs text-on-surface-variant">Delivered in 30-45 minutes</p>
          </div>
        </div>
      </section>

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <section className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-on-surface">Similar Items</h2>
            <Link href="/app/store" className="text-xs font-bold text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {relatedItems.map((ri) => (
              <Link
                key={ri.id}
                href={`/app/store/${ri.id}`}
                className="flex-shrink-0 w-32 bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/30 active:scale-[0.97] transition-transform"
              >
                <div className="relative h-20 bg-surface-container overflow-hidden">
                  <BlurImage
                    src={ri.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                    alt={ri.name}
                    fill
                    className="w-full h-full"
                    sizes="128px"
                    fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                  />
                  <span className="absolute bottom-1 right-1 bg-deal text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">₹{ri.price}</span>
                </div>
                <div className="p-2">
                  <h3 className="font-bold text-on-surface text-[10px] truncate">{ri.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sticky bottom bar — price + Add to cart (Blinkit style), sits above bottom nav */}
      <div className="fixed bottom-[80px] left-0 right-0 md:left-auto md:right-6 md:max-w-md z-40 bg-surface-container-lowest border-t md:border md:rounded-2xl border-outline-variant/60 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:shadow-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}>
          {qty === 0 ? (
            <>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-on-surface">₹{item.price}</span>
                  {item.original_price && (
                    <span className="text-sm text-on-surface-variant line-through">₹{item.original_price}</span>
                  )}
                </div>
                <p className="text-[11px] font-bold leading-tight text-green-600">
                  {discountPct > 0 ? `You save ₹${savings}` : "Inclusive of all taxes"}
                </p>
              </div>
              <motion.button
                onClick={handleAdd}
                whileTap={{ scale: 0.97 }}
                className="shrink-0 bg-primary text-on-primary px-6 py-3 rounded-xl font-black text-sm shadow-md shadow-primary/20 hover:brightness-95 transition-all"
              >
                Add to cart
              </motion.button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 bg-surface-container-lowest border border-primary rounded-lg overflow-hidden">
                <motion.button
                  onClick={() => updateQuantity(item.id, qty - 1)}
                  whileTap={{ scale: 0.8 }}
                  aria-label="Decrease quantity"
                  className="bg-primary text-on-primary font-bold w-10 h-10 flex items-center justify-center hover:brightness-95 transition-colors"
                >
                  −
                </motion.button>
                <motion.span
                  key={qty}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-on-surface font-extrabold text-sm min-w-[24px] text-center"
                >
                  {qty}
                </motion.span>
                <motion.button
                  onClick={handleAdd}
                  whileTap={{ scale: 1.2 }}
                  aria-label="Increase quantity"
                  className="bg-primary text-on-primary font-bold w-10 h-10 flex items-center justify-center hover:brightness-95 transition-colors"
                >
                  +
                </motion.button>
              </div>
              <Link
                href="/app/cart"
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-black text-sm text-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
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

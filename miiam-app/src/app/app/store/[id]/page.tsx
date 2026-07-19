"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import BlurImage from "@/components/BlurImage";
import Breadcrumbs from "@/components/Breadcrumbs";
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
  under_199: { label: "Under ₹199", emoji: "⭐", color: "bg-blue-100 text-blue-700" },
  under_249: { label: "Under ₹249", emoji: "🎯", color: "bg-purple-100 text-purple-700" },
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">inventory_2</span>
        <h1 className="text-xl font-black text-on-surface mb-1">Item Not Found</h1>
        <p className="text-sm text-on-surface-variant mb-4">This item may have been removed.</p>
        <Link href="/app/food" className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold">Browse Food</Link>
      </div>
    );
  }

  const bucket = BUCKET_LABELS[item.category];

  return (
    <div className="min-h-screen bg-surface pb-36">
      {/* Hero Image */}
      <div className="relative h-72 bg-surface-container overflow-hidden">
        <BlurImage
          src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"}
          alt={item.name}
          fill
          className="w-full h-full"
          sizes="100vw"
          fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        {/* Veg badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`w-7 h-7 border-2 ${item.is_veg ? "border-green-500 bg-white" : "border-red-500 bg-white"} rounded-sm flex items-center justify-center shadow-lg`}>
            <span className={`w-3 h-3 ${item.is_veg ? "bg-green-500" : "bg-red-500"} rounded-full`} />
          </span>
        </div>

        {/* Category badge */}
        {bucket && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${bucket.color} backdrop-blur-sm`}>
              {bucket.emoji} {bucket.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
          {/* Title + Price */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h1 className="text-xl font-black text-on-surface leading-tight">{item.name}</h1>
              {item.vendor_name && (
                <p className="text-sm text-on-surface-variant mt-1">{item.vendor_name}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-2xl font-black text-primary">₹{item.price}</span>
              {item.original_price && (
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <span className="text-sm text-on-surface-variant line-through">₹{item.original_price}</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    {Math.round(((item.original_price - item.price) / item.original_price) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-on-surface-variant leading-relaxed mt-3 pt-3 border-t border-outline-variant/20">
              {item.description}
            </p>
          )}
        </div>

        {/* Delivery Info */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 mt-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-green-600 text-lg">local_shipping</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Free Delivery</p>
            <p className="text-xs text-on-surface-variant">Delivered in 30-45 minutes</p>
          </div>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="mt-6">
            <h2 className="text-base font-bold text-on-surface mb-3">Similar Items</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {relatedItems.map((ri) => (
                <Link
                  key={ri.id}
                  href={`/app/store/${ri.id}`}
                  className="flex-shrink-0 w-32 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm active:scale-[0.97] transition-transform"
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
                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">₹{ri.price}</span>
                  </div>
                  <div className="p-2">
                    <h3 className="font-bold text-on-surface text-[10px] truncate">{ri.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Add to Cart Bar — sits above bottom nav */}
      <div className="fixed bottom-[80px] md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-sm bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/10 p-3.5 rounded-2xl z-40 shadow-xl" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 14px)" }}>
        {qty === 0 ? (
          <motion.button
            onClick={handleAdd}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
            Add to Cart — ₹{item.price}
          </motion.button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 bg-primary rounded-xl px-3 py-2">
              <motion.button
                onClick={() => updateQuantity(item.id, qty - 1)}
                whileTap={{ scale: 0.8 }}
                className="text-white font-bold w-9 h-9 flex items-center justify-center"
              >
                −
              </motion.button>
              <motion.span
                key={qty}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-white font-black text-sm min-w-[20px] text-center"
              >
                {qty}
              </motion.span>
              <motion.button
                onClick={handleAdd}
                whileTap={{ scale: 1.2 }}
                className="text-white font-bold w-9 h-9 flex items-center justify-center"
              >
                +
              </motion.button>
            </div>
            <Link
              href="/app/cart"
              className="flex-1 ml-3 py-3.5 bg-primary text-white rounded-xl font-black text-sm text-center shadow-lg shadow-primary/20"
            >
              View Cart — ₹{(item.price * qty).toFixed(0)}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

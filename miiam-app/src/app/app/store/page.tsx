"use client";

import { useState, useEffect, useMemo } from "react";
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
}

const CATEGORIES = [
  { id: "all", label: "All", icon: "apps" },
  { id: "under_99", label: "Under ₹99", icon: "local_fire_department" },
  { id: "under_149", label: "Under ₹149", icon: "savings" },
  { id: "under_199", label: "Under ₹199", icon: "star" },
  { id: "under_249", label: "Under ₹249", icon: "new_releases" },
];

export default function StorePage() {
  const supabase = useMemo(() => createClient(), []);
  const { addItem, items, updateQuantity } = useCartStore();
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("store_items")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setStoreItems(data);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = storeItems.filter((item) => {
    if (activeCategory === "all") return true;
    return item.category === activeCategory;
  });

  const getItemQty = (id: string) => items.find((i) => i.menu_item_id === id)?.quantity ?? 0;

  const handleAdd = (item: StoreItem) => {
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
      <div className="min-h-screen bg-surface pb-36">
        <header className="bg-surface border-b border-outline-variant/10 px-5 pt-5 pb-3">
          <div className="h-6 bg-surface-container rounded w-32 animate-pulse" />
          <div className="h-3 bg-surface-container rounded w-48 mt-1 animate-pulse" />
        </header>
        <div className="px-5 py-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 bg-surface-container rounded-full w-20 animate-pulse flex-shrink-0" />
          ))}
        </div>
        <div className="px-5 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10">
              <div className="h-40 bg-surface-container animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-surface-container rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-surface-container rounded w-1/2 animate-pulse" />
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-surface-container rounded w-16 animate-pulse" />
                  <div className="h-8 bg-primary/20 rounded-lg w-8 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-36">
      {/* Header */}
      <header className="bg-surface border-b border-outline-variant/10 px-5 pt-5 pb-3">
        <h1 className="text-xl font-black text-on-surface">MIIAM Store</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Everything you need, delivered fast</p>
      </header>

      {/* Category Chips */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                activeCategory === cat.id
                  ? "bg-primary text-white border-primary"
                  : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/15"
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-5 pt-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">inventory_2</span>
            <p className="text-sm text-on-surface-variant mt-3">No items in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => {
              const qty = getItemQty(item.id);
              return (
                <Link
                  key={item.id}
                  href={`/app/store/${item.id}`}
                  className="block bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 active:scale-[0.97] transition-transform"
                >
                  <div className="relative h-32 bg-surface-container overflow-hidden">
                    <BlurImage
                      src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                      alt={item.name}
                      fill
                      className="w-full h-full"
                      sizes="(max-width: 640px) 50vw, 25vw"
                      fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                    />
                    {/* Veg badge */}
                    <span className={`absolute top-2 left-2 w-5 h-5 border-2 ${item.is_veg ? "border-green-500 bg-white" : "border-red-500 bg-white"} rounded-sm flex items-center justify-center`}>
                      <span className={`w-2 h-2 ${item.is_veg ? "bg-green-500" : "bg-red-500"} rounded-full`} />
                    </span>
                    {/* Price */}
                    <span className="absolute bottom-2 right-2 bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg">
                      ₹{item.price}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-on-surface truncate">{item.name}</h3>
                    {item.original_price && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-on-surface-variant line-through">₹{item.original_price}</span>
                        <span className="text-[10px] font-bold text-green-600">
                          {Math.round(((item.original_price - item.price) / item.original_price) * 100)}% OFF
                        </span>
                      </div>
                    )}
                    {item.vendor_name && (
                      <p className="text-[10px] text-on-surface-variant/70 mt-1 truncate">{item.vendor_name}</p>
                    )}
                    {/* Add to Cart */}
                    <div className="mt-2">
                      {qty === 0 ? (
                        <motion.button
                          onClick={(e) => { e.preventDefault(); handleAdd(item); }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full py-2 bg-primary text-white rounded-xl text-xs font-bold"
                        >
                          ADD
                        </motion.button>
                      ) : (
                        <div className="flex items-center justify-between bg-primary rounded-xl px-1">
                          <motion.button
                            onClick={(e) => { e.preventDefault(); updateQuantity(item.id, qty - 1); }}
                            whileTap={{ scale: 0.8 }}
                            className="text-white font-bold w-8 h-8 flex items-center justify-center"
                          >
                            −
                          </motion.button>
                          <motion.span key={qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-white font-black text-xs">
                            {qty}
                          </motion.span>
                          <motion.button
                            onClick={(e) => { e.preventDefault(); handleAdd(item); }}
                            whileTap={{ scale: 1.2 }}
                            className="text-white font-bold w-8 h-8 flex items-center justify-center"
                          >
                            +
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

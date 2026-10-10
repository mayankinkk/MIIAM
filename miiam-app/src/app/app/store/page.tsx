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
      <div className="bg-surface min-h-screen pb-36">
        <header className="bg-surface border-outline-variant/10 border-b px-5 pt-5 pb-3">
          <div className="bg-surface-container h-6 w-32 animate-pulse rounded" />
          <div className="bg-surface-container mt-1 h-3 w-48 animate-pulse rounded" />
        </header>
        <div className="flex gap-2 overflow-hidden px-5 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container h-9 w-20 flex-shrink-0 animate-pulse rounded-full"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 px-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest border-outline-variant/10 overflow-hidden rounded-2xl border"
            >
              <div className="bg-surface-container h-40 animate-pulse" />
              <div className="space-y-2 p-3">
                <div className="bg-surface-container h-4 w-3/4 animate-pulse rounded" />
                <div className="bg-surface-container h-3 w-1/2 animate-pulse rounded" />
                <div className="flex items-center justify-between">
                  <div className="bg-surface-container h-5 w-16 animate-pulse rounded" />
                  <div className="bg-primary/20 h-8 w-8 animate-pulse rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-36">
      {/* Header */}
      <header className="bg-surface border-outline-variant/10 border-b px-5 pt-5 pb-3">
        <h1 className="text-on-surface text-xl font-black">MIIAM Store</h1>
        <p className="text-on-surface-variant mt-0.5 text-xs">
          Everything you need, delivered fast
        </p>
      </header>

      {/* Category Chips */}
      <div className="px-5 pt-4 pb-2">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-on-primary border-primary"
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
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-on-surface-variant/30 text-5xl">
              inventory_2
            </span>
            <p className="text-on-surface-variant mt-3 text-sm">No items in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => {
              const qty = getItemQty(item.id);
              return (
                <Link
                  key={item.id}
                  href={`/app/store/${item.id}`}
                  className="bg-surface-container-lowest border-outline-variant/10 block overflow-hidden rounded-2xl border transition-transform active:scale-[0.97]"
                >
                  <div className="bg-surface-container relative h-32 overflow-hidden">
                    <BlurImage
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                      }
                      alt={item.name}
                      fill
                      className="h-full w-full"
                      sizes="(max-width: 640px) 50vw, 25vw"
                      fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                    />
                    {/* Veg badge */}
                    <span
                      className={`absolute top-2 left-2 h-5 w-5 border-2 ${item.is_veg ? "border-green-500 bg-white" : "border-red-500 bg-white"} flex items-center justify-center rounded-sm`}
                    >
                      <span
                        className={`h-2 w-2 ${item.is_veg ? "bg-green-500" : "bg-red-500"} rounded-full`}
                      />
                    </span>
                    {/* Discount badge (deals only — price lives in the stack below) */}
                    {item.original_price && item.original_price > item.price && (
                      <span className="bg-deal absolute right-2 bottom-2 rounded-lg px-2 py-1 text-[10px] font-black text-white">
                        {Math.round(
                          ((item.original_price - item.price) / item.original_price) * 100
                        )}
                        % OFF
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-on-surface truncate text-sm font-bold">{item.name}</h3>
                    <div className="mt-0.5 flex flex-col items-start leading-tight">
                      <span className="text-on-surface text-sm font-black">₹{item.price}</span>
                      {item.original_price && item.original_price > item.price && (
                        <span className="text-on-surface-variant text-[10px] line-through">
                          ₹{item.original_price}
                        </span>
                      )}
                    </div>
                    {item.vendor_name && (
                      <p className="text-on-surface-variant/70 mt-1 truncate text-[10px]">
                        {item.vendor_name}
                      </p>
                    )}
                    {/* Add to Cart */}
                    <div className="mt-2">
                      {qty === 0 ? (
                        <motion.button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAdd(item);
                          }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-primary text-on-primary border-primary h-8 w-full rounded-lg border text-xs font-extrabold transition-all hover:brightness-95"
                        >
                          ADD
                        </motion.button>
                      ) : (
                        <div className="bg-surface-container-lowest border-primary flex items-center justify-between overflow-hidden rounded-lg border">
                          <motion.button
                            onClick={(e) => {
                              e.preventDefault();
                              updateQuantity(item.id, qty - 1);
                            }}
                            whileTap={{ scale: 0.8 }}
                            className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center font-bold transition-colors hover:brightness-95"
                          >
                            −
                          </motion.button>
                          <motion.span
                            key={qty}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            className="text-on-surface text-xs font-extrabold"
                          >
                            {qty}
                          </motion.span>
                          <motion.button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAdd(item);
                            }}
                            whileTap={{ scale: 1.2 }}
                            className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center font-bold transition-colors hover:brightness-95"
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

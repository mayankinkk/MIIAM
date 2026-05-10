"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";

const supabase = createClient();

interface Flower {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url: string;
}

const flowerCategories = [
  { id: "bouquets", name: "Bouquets", icon: "💐", color: "bg-pink-100" },
  { id: "arrangements", name: "Arrangements", icon: "💐", color: "bg-rose-100" },
  { id: "single", name: "Single Stems", icon: "🌹", color: "bg-red-100" },
  { id: "gifts", name: "Gift Sets", icon: "🎁", color: "bg-purple-100" },
  { id: "ceremony", name: "Ceremony", icon: "💒", color: "bg-amber-100" },
];

export default function FlowersPage() {
  const { getSetting } = useServiceSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, items, updateQuantity, totalItems } = useCartStore();
  const flowersSetting = getSetting("flowers");

  if (flowersSetting && !flowersSetting.isEnabled) {
    return <ServiceUnavailable serviceName="Flowers" message={flowersSetting.message} icon="local_florist" />;
  }

  useEffect(() => {
    fetchFlowers();
  }, []);

  const fetchFlowers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("flower_items")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching flowers:", error);
    } else {
      setFlowers(data || []);
    }
    setLoading(false);
  };

  const filteredFlowers = selectedCategory === "all" 
    ? flowers 
    : flowers.filter(f => f.category?.toLowerCase().replace(" ", "") === selectedCategory);

  const addToCart = (flower: any) => {
    addItem({
      id: flower.id,
      menu_item_id: flower.id,
      name: flower.name,
      price: flower.price,
      image_url: flower.image_url,
      vendor_id: "flowers",
      vendor_name: "Flowers & Gifts",
    });
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <Link href="/app/explore" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Flowers & Gifts</h1>
          <Link href="/app/cart" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            {totalItems() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ba001c] text-white text-xs rounded-full flex items-center justify-center">
                {totalItems()}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="px-6 mt-4">
        <div className="rounded-2xl overflow-hidden relative h-40 shadow-sm">
          <img src="/images/flowers_hero.png" alt="Exotic Flowers" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h2 className="text-white text-xl font-black">Premium Bouquets</h2>
            <p className="text-white/90 text-sm">Exotic arrangements for every occasion</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white px-6 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${
              selectedCategory === "all" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            All
          </button>
          {flowerCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id.replace(" ", ""))}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id.replace(" ", "") ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Flowers Grid */}
      <main className="p-6">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading flowers...</div>
        ) : filteredFlowers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No flowers found</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredFlowers.map((flower: any) => (
              <div key={flower.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <img src={flower.image_url || flower.image} alt={flower.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-sm">{flower.name}</p>
                  <p className="text-xs text-slate-500">{flower.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c]">₹{flower.price}</span>
                    <button 
                      onClick={() => addToCart(flower)}
                      className="w-8 h-8 bg-[#ba001c] text-white rounded-full flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {totalItems() > 0 && (
        <Link
          href="/app/cart"
          className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between bg-[#ba001c] text-white px-5 py-4 rounded-2xl shadow-2xl shadow-[#ba001c]/40"
        >
          <div className="flex items-center gap-3">
            <span className="bg-white text-[#ba001c] font-black text-xs px-2 py-0.5 rounded-full">
              {totalItems()}
            </span>
            <span className="font-bold">View Cart</span>
          </div>
          <span className="font-black text-lg">Checkout</span>
        </Link>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { useToastStore } from "@/lib/store/toastStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";

import { useLocationStore } from "@/lib/store/locationStore";

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
  const [isServiceable, setIsServiceable] = useState(true);
  const { addItem, items, updateQuantity, totalItems } = useCartStore();
  const { addToast } = useToastStore();
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;
  const flowersSetting = getSetting("flowers");

  if (flowersSetting && !flowersSetting.isEnabled) {
    return <ServiceUnavailable serviceName="Flowers" message={flowersSetting.message} icon="local_florist" />;
  }

  useEffect(() => {
    fetchFlowers();
  }, [userPincode]);

  const fetchFlowers = async () => {
    setLoading(true);
    setIsServiceable(true);

    let query = supabase.from("flower_items").select("*").order("created_at", { ascending: false });
    if (userPincode) {
      query = query.eq("pincode", userPincode);
    }
    const { data, error } = await query;
    
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

  const FLOWERS_VENDOR_ID = "00000000-0000-4000-8000-000000000001";

  const addToCart = (flower: any) => {
    if (!isServiceable) {
      addToast("Flowers delivery is not available at your location!", "error");
      return;
    }
    addItem({
      id: flower.id,
      menu_item_id: flower.id,
      name: flower.name,
      price: flower.price,
      image_url: flower.image_url,
      vendor_id: FLOWERS_VENDOR_ID,
      vendor_name: "Flowers & Gifts",
    });
    addToast(`${flower.name} added to cart!`, "success");
  };

  const getItemQuantity = (flowerId: string) => {
    const item = items.find(i => i.menu_item_id === flowerId);
    return item?.quantity || 0;
  };

  const FlowerAddButton = ({ flower }: { flower: any }) => {
    const quantity = getItemQuantity(flower.id);
    
    if (quantity === 0) {
      return (
        <button 
          onClick={() => { addToCart(flower); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }}
          className="w-8 h-8 bg-[#ba001c] text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all animate-glow-pulse"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      );
    }
    
    return (
      <div className="flex items-center gap-2 bg-[#ba001c] rounded-full px-2 animate-cart-pop">
        <button 
          onClick={() => { updateQuantity(flower.id, quantity - 1); if (navigator.vibrate) navigator.vibrate(10); }}
          className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <span className="text-white font-bold text-sm min-w-[20px] text-center">{quantity}</span>
        <button 
          onClick={() => { addToCart(flower); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }}
          className="w-6 h-6 text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-24">
      {/* Header */}
      <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
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

      {/* Location / Availability Banner */}
      {!isServiceable && (userPincode || userCity) && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl animate-bounce">warning</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800">Not serviceable at {userPincode ? `Pincode ${userPincode}` : userCity}</p>
            <p className="text-[10px] text-amber-600 font-medium">Flower delivery is coming soon to your area. You can still browse our catalog!</p>
          </div>
        </div>
      )}
      {isServiceable && (userPincode || userCity) && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-green-600 text-sm">location_on</span>
          <p className="text-[11px] font-bold text-green-700">Delivering premium flowers to {userPincode ? `Pincode ${userPincode}` : userCity}</p>
        </div>
      )}

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
            onClick={() => { setSelectedCategory("all"); if (navigator.vibrate) navigator.vibrate(10); }}
            className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${
              selectedCategory === "all" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
            } active:scale-95 transition-all`}
          >
            All
          </button>
          {flowerCategories.map((cat, i) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id.replace(" ", "")); if (navigator.vibrate) navigator.vibrate(10); }}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id.replace(" ", "") ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"
              } active:scale-95 transition-all animate-category-slide`}
              style={{ animationDelay: `${i * 50}ms` }}
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
            {filteredFlowers.map((flower: any, index) => (
              <div key={flower.id} className="bg-white rounded-2xl overflow-hidden shadow-sm card-lift animate-pop-in" style={{ animationDelay: `${Math.min(index * 80, 500)}ms` }}>
                <img src={flower.image_url || flower.image} alt={flower.name} className="w-full h-32 object-cover" />
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-sm">{flower.name}</p>
                  <p className="text-xs text-slate-500">{flower.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-[#ba001c] animate-price-tag">₹{flower.price}</span>
                    <FlowerAddButton flower={flower} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {totalItems() > 0 && (
        <button
          onClick={() => {
            if (!isServiceable) {
              addToast("Cannot checkout: Flowers are not serviceable at your selected location!", "error");
            } else {
              window.location.href = "/app/cart";
            }
          }}
          className={`fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between text-white px-5 py-4 rounded-2xl shadow-2xl active:scale-[0.98] transition-transform animate-slide-reveal ${
            isServiceable ? "bg-[#ba001c] shadow-[#ba001c]/40" : "bg-gray-400 cursor-not-allowed shadow-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="bg-white text-[#ba001c] font-black text-xs px-2 py-0.5 rounded-full">
              {totalItems()}
            </span>
            <span className="font-bold">View Cart</span>
          </div>
          <span className="font-black text-lg">{isServiceable ? "Checkout" : "Unserviceable"}</span>
        </button>
      )}
    </div>
  );
}
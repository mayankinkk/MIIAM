"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const foodCategories = [
  { id: "pizza", name: "Pizza", icon: "🍕", color: "bg-orange-100" },
  { id: "burgers", name: "Burgers", icon: "🍔", color: "bg-amber-100" },
  { id: "biryani", name: "Biryani", icon: "🍚", color: "bg-yellow-100" },
  { id: "chinese", name: "Chinese", icon: "🥡", color: "bg-red-100" },
  { id: "italian", name: "Italian", icon: "🍝", color: "bg-green-100" },
  { id: "desserts", name: "Desserts", icon: "🍰", color: "bg-pink-100" },
];

function AddToCartButton({
  item,
  restaurant,
}: {
  item: { id: string; name: string; price: number; image_url?: string };
  restaurant: { id: string; shop_name?: string };
}) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.menu_item_id === item.id);
  const qty = cartItem?.quantity ?? 0;

  const add = () => {
    addItem({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      vendor_id: restaurant.id,
      vendor_name: restaurant.shop_name,
    });
  };

  if (qty === 0) {
    return (
      <button
        onClick={add}
        className="px-4 py-1.5 bg-[#ba001c] text-white text-xs font-bold rounded-full hover:bg-[#a40017] active:scale-95 transition-all"
      >
        Add +
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-[#ba001c] rounded-full px-2 py-1">
      <button
        onClick={() => updateQuantity(item.id, qty - 1)}
        className="text-white font-bold w-5 h-5 flex items-center justify-center"
      >
        −
      </button>
      <span className="text-white font-bold text-xs min-w-[16px] text-center">{qty}</span>
      <button
        onClick={add}
        className="text-white font-bold w-5 h-5 flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}

function CartFloater() {
  const { items, totalPrice, totalItems } = useCartStore();
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50">
      <Link
        href="/app/cart"
        className="flex items-center justify-between bg-[#ba001c] text-white px-5 py-4 rounded-2xl shadow-2xl shadow-[#ba001c]/40"
      >
        <div className="flex items-center gap-3">
          <span className="bg-white text-[#ba001c] font-black text-xs px-2 py-0.5 rounded-full">
            {totalItems()}
          </span>
          <span className="font-bold">View Cart</span>
        </div>
        <span className="font-black text-lg">₹{totalPrice().toFixed(2)}</span>
      </Link>
    </div>
  );
}

export default function FoodPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: vendors } = await supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (vendors) {
      setRestaurants(vendors);
      const { data: items } = await supabase
        .from("menu_items")
        .select("*")
        .order("name");
      setMenuItems(items || []);
    }
    setLoading(false);
  };

  const getMenuItems = (vendorId: string) => {
    return menuItems.filter((item) => item.vendor_id === vendorId);
  };

  const filteredRestaurants =
    selectedCategory === "all"
      ? restaurants
      : restaurants.filter((r) => r.cuisine?.toLowerCase() === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fff4f4] pb-32">
      <header className="bg-white px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link href="/app/explore" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-[#4d212a]">Food Delivery</h1>
          <Link href="/app/cart" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center relative">
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
        </div>
      </header>

      <div className="px-6 mt-4">
        <div className="rounded-2xl overflow-hidden relative h-44 shadow-sm">
          <img src="/images/food_hero.png" alt="Premium Food" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";}} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
            <h2 className="text-white text-2xl font-black">Gourmet Selection</h2>
            <p className="text-white/90 text-sm mt-1">Order food from top restaurants near you</p>
          </div>
        </div>
      </div>

      <div className="bg-white px-6 py-4 mt-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setSelectedCategory("all")} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${selectedCategory === "all" ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"}`}>
            🍽 All
          </button>
          {foodCategories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? "bg-[#ba001c] text-white" : "bg-slate-100 text-slate-600"}`}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading restaurants...</div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No restaurants found</div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="flex">
                <div className="w-32 h-32 flex-shrink-0 overflow-hidden bg-slate-100">
                  <img src={restaurant.image_url || "/images/food_hero.png"} alt={restaurant.shop_name} className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display = "none";}} />
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-bold text-slate-800 text-base">{restaurant.shop_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">★ {restaurant.rating || "4.0"}</span>
                    <span className="text-xs text-slate-500">{restaurant.delivery_time || "30-40 min"}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Delivery: {restaurant.delivery_fee || "₹49"}</p>
                  <button onClick={() => setExpandedRestaurant(expandedRestaurant === restaurant.id ? null : restaurant.id)} className="mt-2 text-sm font-bold text-[#ba001c] flex items-center gap-1">
                    {expandedRestaurant === restaurant.id ? "Hide Menu" : "View Menu"}
                    <span className="material-symbols-outlined text-sm">{expandedRestaurant === restaurant.id ? "expand_less" : "expand_more"}</span>
                  </button>
                </div>
              </div>

              {expandedRestaurant === restaurant.id && (
                <div className="border-t border-slate-100 px-4 pb-4 space-y-3 bg-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-3 mb-1">Menu</p>
                  {getMenuItems(restaurant.id).map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <img src={item.image_url || "/images/food_hero.png"} alt={item.name} className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display = "none";}} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                          <p className="font-black text-[#ba001c] text-sm">₹{item.price}</p>
                        </div>
                      </div>
                      <AddToCartButton item={item} restaurant={restaurant} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </main>

      <CartFloater />
    </div>
  );
}
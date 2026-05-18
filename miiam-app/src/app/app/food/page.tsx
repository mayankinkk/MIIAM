"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import PullToRefresh from "@/components/PullToRefresh";
import QuickActionsFAB from "@/components/QuickActionsFAB";
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

type SortOption = "rating" | "delivery_time" | "price_low" | "price_high";

function SortDropdown({ sort, setSort }: { sort: SortOption; setSort: (s: SortOption) => void }) {
  const [open, setOpen] = useState(false);
  const options: { value: SortOption; label: string }[] = [
    { value: "rating", label: "★ Rating" },
    { value: "delivery_time", label: "⚡ Delivery Time" },
    { value: "price_low", label: "↓ Price: Low to High" },
    { value: "price_high", label: "↑ Price: High to Low" },
  ];
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-full text-sm font-medium">
        <span className="material-symbols-outlined text-sm">swap_vert</span>
        {options.find(o => o.value === sort)?.label}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 z-20 min-w-[180px]">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { setSort(opt.value); setOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 ${sort === opt.value ? "text-[#ba001c] font-bold" : "text-slate-600"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceRangeFilter({ onApply }: { onApply: (min: number, max: number) => void }) {
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(1000);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-full text-sm font-medium">
        <span className="material-symbols-outlined text-sm">attach_money</span>
        ₹{min}-{max}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 z-20 p-4 min-w-[240px]">
          <p className="text-xs font-bold text-slate-500 mb-2">PRICE RANGE</p>
          <div className="flex gap-2 items-center">
            <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Min" />
            <span className="text-slate-400">-</span>
            <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Max" />
          </div>
          <button onClick={() => { onApply(min, max); setOpen(false); }} className="w-full mt-3 py-2 bg-[#ba001c] text-white text-sm font-bold rounded-lg">Apply</button>
        </div>
      )}
    </div>
  );
}

function AddToCartButton({
  item,
  restaurant,
}: {
  item: { id: string; name: string; price: number; image_url?: string; is_veg?: boolean };
  restaurant: { id: string; shop_name?: string };
}) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.menu_item_id === item.id);
  const qty = cartItem?.quantity ?? 0;
  const cartVendorId = items.length > 0 ? items[0].vendor_id : null;
  const isDifferentVendor = cartVendorId && cartVendorId !== restaurant.id;
  const [bouncing, setBouncing] = useState(false);
  const [prevQty, setPrevQty] = useState(qty);

  useEffect(() => {
    if (qty > prevQty) {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 500);
      setPrevQty(qty);
      return () => clearTimeout(timer);
    }
    setPrevQty(qty);
  }, [qty, prevQty]);

  const handleAdd = () => {
    if (isDifferentVendor && confirm(`Your cart has items from another restaurant. Adding this will create separate orders. Continue?`)) {
      addItem({
        id: item.id,
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        is_veg: item.is_veg,
        vendor_id: restaurant.id,
        vendor_name: restaurant.shop_name || "Restaurant",
      });
    } else if (!isDifferentVendor) {
      addItem({
        id: item.id,
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        is_veg: item.is_veg,
        vendor_id: restaurant.id,
        vendor_name: restaurant.shop_name || "Restaurant",
      });
    }
  };

  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        className={`px-4 py-1.5 bg-[#ba001c] text-white text-xs font-bold rounded-full hover:bg-[#a40017] active:scale-95 transition-all ${
          bouncing ? "animate-bounce shadow-lg shadow-[#ba001c]/40" : ""
        }`}
      >
        Add +
      </button>
    );
  }

  return (
      <div className={`flex items-center gap-1.5 bg-[#ba001c] rounded-full px-2 py-1 transition-all ${bouncing ? "scale-125 shadow-lg shadow-[#ba001c]/40" : ""}`}>
      <button
        onClick={() => updateQuantity(item.id, qty - 1)}
        className="text-white font-bold w-5 h-5 flex items-center justify-center active:scale-75 transition-transform"
      >
        −
      </button>
      <span className="text-white font-bold text-xs min-w-[16px] text-center">{qty}</span>
      <button
        onClick={handleAdd}
        className="text-white font-bold w-5 h-5 flex items-center justify-center active:scale-125 transition-transform"
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
  const { getSetting } = useServiceSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000);
  const [expandedRestaurant, setExpandedRestaurant] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const foodSetting = getSetting("food");

  if (foodSetting && !foodSetting.isEnabled) {
    return <ServiceUnavailable serviceName="Food Delivery" message={foodSetting.message} icon="restaurant" />;
  }

  const handleRefresh = async () => {
    await fetchData();
  };

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

  useEffect(() => {
    fetchData();
    const saved = localStorage.getItem("miiam-favorites");
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  const toggleFavorite = (id: string) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(id)) newFavs.delete(id);
    else newFavs.add(id);
    setFavorites(newFavs);
    localStorage.setItem("miiam-favorites", JSON.stringify([...newFavs]));
  };

  const getMenuItems = (vendorId: string) => {
    let items = menuItems.filter((item) => item.vendor_id === vendorId);
    if (vegFilter !== "all") {
      items = items.filter((item) => item.is_veg === (vegFilter === "veg"));
    }
    return items.filter((item) => item.price >= priceMin && item.price <= priceMax);
  };

  const sortedRestaurants = [...restaurants].sort((a, b) => {
    switch (sortBy) {
      case "rating": return (b.rating || 0) - (a.rating || 0);
      case "delivery_time": return (a.delivery_time_min || 999) - (b.delivery_time_min || 999);
      case "price_low": return (a.min_order_amount || 0) - (b.min_order_amount || 0);
      case "price_high": return (b.min_order_amount || 0) - (a.min_order_amount || 0);
      default: return 0;
    }
  });

  const filteredRestaurants =
    selectedCategory === "all"
      ? sortedRestaurants
      : sortedRestaurants.filter((r) => r.cuisine?.toLowerCase() === selectedCategory);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-[#fff4f4]">
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
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => setVegFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-bold ${vegFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
            All
          </button>
          <button onClick={() => setVegFilter("veg")} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "veg" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>
            <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span> Veg
          </button>
          <button onClick={() => setVegFilter("non_veg")} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "non_veg" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
            <span className="w-3 h-3 border-2 border-red-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span> Non-Veg
          </button>
          <SortDropdown sort={sortBy} setSort={setSortBy} />
          <PriceRangeFilter onApply={(min, max) => { setPriceMin(min); setPriceMax(max); }} />
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
                <div className="w-32 h-32 flex-shrink-0 overflow-hidden bg-slate-100 relative">
                  <img src={restaurant.image_url || "/images/food_hero.png"} alt={restaurant.shop_name} className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display = "none";}} />
                  <button onClick={() => toggleFavorite(restaurant.id)} className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow">
                    <span className={`material-symbols-outlined text-lg ${favorites.has(restaurant.id) ? "text-red-500 fill-red-500" : "text-slate-400"}`}>favorite</span>
                  </button>
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
                  {getMenuItems(restaurant.id).length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No items match filters</p>
                  ) : (
                    getMenuItems(restaurant.id).map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            <img src={item.image_url || "/images/food_hero.png"} alt={item.name} className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display = "none";}} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-3.5 h-3.5 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center`}>
                                <span className={`w-1.5 h-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`}></span>
                              </span>
                              <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                            </div>
                            <p className="font-black text-[#ba001c] text-sm">₹{item.price}</p>
                          </div>
                        </div>
                        <AddToCartButton item={item} restaurant={restaurant} />
                      </div>
))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>

      <CartFloater />
      <QuickActionsFAB />
      </PullToRefresh>
    );
  }

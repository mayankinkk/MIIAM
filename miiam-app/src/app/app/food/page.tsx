"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import PullToRefresh from "@/components/PullToRefresh";
import QuickActionsFAB from "@/components/QuickActionsFAB";
import { createClient } from "@/lib/supabase/client";
import { VendorCardSkeleton } from "@/components/Skeleton";
import { useToastStore } from "@/lib/store/toastStore";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { useLocationStore } from "@/lib/store/locationStore";
import EmptyState from "@/components/EmptyState";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { StaggerContainer, StaggerItem, PressScale, CartBounce } from "@/components/ui/AnimationWrappers";
import { NetworkError } from "@/components/ui/EmptyStates";

const supabase = createClient();

function parseIsOpen(hours: string | null | undefined): boolean {
  if (!hours) return true;
  try {
    const to24 = (t: string) => {
      const [time, mod] = t.trim().split(" ");
      let [h, m] = time.split(":").map(Number);
      if (!m) m = 0;
      if (mod?.toUpperCase() === "PM" && h !== 12) h += 12;
      if (mod?.toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    const parts = hours.replace("–", "-").split("-");
    if (parts.length < 2) return true;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= to24(parts[0]) && cur < to24(parts[1]);
  } catch { return true; }
}

const DEFAULT_BANNERS = [
  { id: "1", label: "🔥 Today's Deal", title: "50% OFF your first order", sub: "Use code FIRST50", color: "from-primary to-primary-container", image_url: "" },
  { id: "2", label: "⚡ Flash Sale", title: "Free delivery all day", sub: "On orders above ₹299", color: "from-violet-600 to-purple-400", image_url: "" },
  { id: "3", label: "🌟 New Arrival", title: "Try something new", sub: "Freshly added restaurants", color: "from-amber-500 to-yellow-300", image_url: "" },
];

function PromoBannerCarousel() {
  const [banners, setBanners] = useState<any[]>(DEFAULT_BANNERS);
  const [active, setActive] = useState(0);

  useEffect(() => {
    async function fetchBanners() {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("position");
      
      if (!error && data && data.length > 0) {
        setBanners(data.map((b: any) => ({
          id: b.id,
          label: "📣 Promotion",
          title: b.title,
          sub: b.link_url || "Check out this offer!",
          color: "from-primary to-primary-container",
          image_url: b.image_url,
        })));
      }
    }
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners]);

  if (banners.length === 0) return null;
  const b = banners[active];

  return (
    <div className="px-6 mt-3">
      <div 
        style={b.image_url ? { backgroundImage: `url(${b.image_url})` } : {}}
        className={`bg-cover bg-center relative rounded-2xl p-4 flex items-center justify-between overflow-hidden transition-all duration-500 h-28 ${
          !b.image_url ? `bg-gradient-to-r ${b.color}` : ""
        }`}
      >
        {b.image_url && <div className="absolute inset-0 bg-black/45 z-0" />}
        
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          <div>
            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">{b.label}</span>
            <p className="text-white font-black text-base mt-0.5 leading-tight">{b.title}</p>
            <p className="text-white/80 text-xs mt-0.5">{b.sub}</p>
          </div>
          
          <div className="flex gap-1 mt-2">
            {banners.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-surface-container-lowest" : "w-1.5 bg-white/40"}`} 
              />
            ))}
          </div>
        </div>
        
        {!b.image_url && (
          <>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -right-8 -top-4 w-28 h-28 bg-white/5 rounded-full" />
          </>
        )}
      </div>
    </div>
  );
}

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
      <button onClick={() => { setOpen(!open); if (navigator.vibrate) navigator.vibrate(10); }} className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-full text-sm font-medium active:scale-95 transition-transform">
        <span className="material-symbols-outlined text-sm">swap_vert</span>
        {options.find(o => o.value === sort)?.label}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant z-20 min-w-[180px] animate-pop-in">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { setSort(opt.value); setOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low ${sort === opt.value ? "text-primary font-bold" : "text-on-surface-variant"}`}>
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
      <button onClick={() => { setOpen(!open); if (navigator.vibrate) navigator.vibrate(10); }} className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-full text-sm font-medium active:scale-95 transition-transform">
        <span className="material-symbols-outlined text-sm">attach_money</span>
        ₹{min}-{max}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant z-20 p-4 min-w-[240px] animate-pop-in">
          <p className="text-xs font-bold text-on-surface-variant mb-2">PRICE RANGE</p>
          <div className="flex gap-2 items-center">
            <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Min" />
            <span className="text-outline">-</span>
            <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Max" />
          </div>
          <button onClick={() => { onApply(min, max); setOpen(false); if (navigator.vibrate) navigator.vibrate(15); }} className="w-full mt-3 py-2 bg-primary text-white text-sm font-bold rounded-lg active:scale-95 transition-transform">Apply</button>
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
      <motion.button
        onClick={handleAdd}
        whileTap={{ scale: 0.9 }}
        animate={bouncing ? { scale: [1, 1.15, 0.95, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-dim shadow-sm"
      >
        Add +
      </motion.button>
    );
  }

  return (
    <motion.div
      animate={bouncing ? { scale: [1, 1.2, 0.95, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-1.5 bg-primary rounded-full px-2 py-1 shadow-md"
    >
      <motion.button
        onClick={() => updateQuantity(item.id, qty - 1)}
        whileTap={{ scale: 0.75 }}
        className="text-white font-bold w-5 h-5 flex items-center justify-center"
      >
        −
      </motion.button>
      <span className="text-white font-bold text-xs min-w-[16px] text-center">{qty}</span>
      <motion.button
        onClick={handleAdd}
        whileTap={{ scale: 1.25 }}
        className="text-white font-bold w-5 h-5 flex items-center justify-center"
      >
        +
      </motion.button>
    </motion.div>
  );
}

function CartFloater() {
  const { items, totalPrice, totalItems } = useCartStore();
  const [showAnimation, setShowAnimation] = useState(false);
  const [prevCount, setPrevCount] = useState(totalItems());
  
  useEffect(() => {
    if (totalItems() > prevCount) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 500);
      setPrevCount(totalItems());
      return () => clearTimeout(timer);
    }
    setPrevCount(totalItems());
  }, [totalItems(), prevCount]);
  
  if (items.length === 0) return null;
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.5 }}
      className="fixed bottom-6 left-4 right-4 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <Link
        href="/app/cart"
        className="flex items-center justify-between bg-primary text-white px-5 py-4 rounded-2xl shadow-2xl shadow-primary/40"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.span
              animate={showAnimation ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-surface-container-lowest text-primary font-black text-xs px-2 py-0.5 rounded-full inline-block"
            >
              {totalItems()}
            </motion.span>
            {showAnimation && (
              <motion.span
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
              />
            )}
          </div>
          <span className="font-bold">View Cart</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-lg">₹{totalPrice().toFixed(2)}</span>
          <span className="material-symbols-outlined text-white/80">arrow_forward</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FoodPage() {
  const { t } = useTranslation();
  const { getSetting } = useServiceSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const { favoriteIds, toggle, setFavorites } = useFavoritesStore();
  const favorites = new Set(favoriteIds);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [heroAsset, setHeroAsset] = useState<{ image_url: string; title: string; subtitle: string } | null>(null);
  const locationStore = useLocationStore();
  const userPincode = locationStore.pincode;
  const userCity = locationStore.city;
  const hasLocation = !!(userPincode || userCity);
  const [noLocalVendors, setNoLocalVendors] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const foodSetting = getSetting("food");

  if (foodSetting && !foodSetting.isEnabled) {
    return <ServiceUnavailable serviceName="Food Delivery" message={foodSetting.message} icon="restaurant" />;
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <NetworkError onRetry={() => fetchData()} />
      </div>
    );
  }

  const handleRefresh = async () => {
    await fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    setNoLocalVendors(false);
    setFetchError(null);
    try {
      const heroRes = await supabase.from("page_assets").select("*").eq("section", "food_hero").eq("is_active", true).maybeSingle();

      if (!userPincode && !userCity) {
        setRestaurants([]);
        setMenuItems([]);
        if (heroRes?.data) setHeroAsset(heroRes.data);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("vendors")
        .select("*")
        .in("type", ["food", "restaurant"])
        .eq("status", "active");

      if (userPincode) {
        query = query.eq("pincode", userPincode);
      } else if (userCity) {
        query = query.eq("city", userCity.toLowerCase());
      }

      query = query.order("created_at", { ascending: false });
      let vendorsRes = await query;

      let filteredVendors = vendorsRes.data || [];

      if (filteredVendors.length === 0) {
        setNoLocalVendors(true);
      }

      setRestaurants(filteredVendors);
      const vendorIds = filteredVendors.map(v => v.id);
      if (vendorIds.length > 0) {
        const itemsRes = await supabase.from("menu_items").select("*").in("vendor_id", vendorIds).order("name");
        setMenuItems(itemsRes.data || []);
      } else {
        setMenuItems([]);
      }
      
      if (heroRes?.data) setHeroAsset(heroRes.data);
    } catch (err) {
      console.error("Failed to load food page:", err);
      setFetchError("Couldn't load restaurants. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Load from Supabase if auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("favorites").select("vendor_id").eq("user_id", user.id).then(({ data }) => {
          if (data) setFavorites(data.map(f => f.vendor_id));
        });
      }
    });
  }, [userPincode, userCity]);

  const toggleFavorite = async (id: string) => {
    toggle(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (favorites.has(id)) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("vendor_id", id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, vendor_id: id });
      }
    }
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
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-surface">
      {/* Pincode Verification Banner */}
      {userPincode && (
        <div className={`px-4 py-2 ${noLocalVendors ? "bg-red-50 border-b border-red-200" : "bg-surface-container-low border-b border-green-200"} flex items-center gap-2`}>
          <span className={`material-symbols-outlined text-sm ${noLocalVendors ? "text-red-500" : "text-green-600"}`}>location_on</span>
          <p className={`text-[11px] font-bold flex-1 ${noLocalVendors ? "text-red-700" : "text-green-700"}`}>
            {noLocalVendors
              ? `No restaurants available near ${locationStore.displayAddress}`
              : `Showing restaurants near ${locationStore.displayAddress}`
            }
          </p>
          {noLocalVendors && (
            <button onClick={() => { window.location.href = "/app/home?selectLocation=true"; }} className="text-[10px] font-black text-primary underline whitespace-nowrap">
              Change
            </button>
          )}
        </div>
      )}
      <header className="bg-surface-container-lowest px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link href="/app/explore" aria-label="Back to explore" className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-surface">{t.food.title}</h1>
          <Link href="/app/cart" aria-label="View cart" className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center relative">
            <span className="material-symbols-outlined" aria-hidden="true">shopping_cart</span>
          </Link>
        </div>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Food' }]} />

      <div className="px-6 mt-4">
        <div className="rounded-2xl overflow-hidden relative h-44 shadow-sm">
          <BlurImage src={heroAsset?.image_url || "/images/food_hero.png"} alt="Food Hero Banner" fill className="w-full h-full" sizes="100vw" fallbackSrc="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
            <h2 className="text-white text-2xl font-black">{heroAsset?.title || "Gourmet Selection"}</h2>
            <p className="text-white/90 text-sm mt-1">{heroAsset?.subtitle || "Order food from top restaurants near you"}</p>
          </div>
        </div>
      </div>

      <PromoBannerCarousel />

      <div className="bg-surface-container-lowest px-6 py-4 mt-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => { setSelectedCategory("all"); if (navigator.vibrate) navigator.vibrate(10); }} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap ${selectedCategory === "all" ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"} active:scale-95 transition-all`}>
            🍽 {t.food.all}
          </button>
          {foodCategories.map((cat) => (
            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); if (navigator.vibrate) navigator.vibrate(10); }} className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"} active:scale-95 transition-all`}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => setVegFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-bold ${vegFilter === "all" ? "bg-inverse-surface text-white" : "bg-surface-container text-on-surface-variant"}`}>
            {t.food.all}
          </button>
          <button onClick={() => setVegFilter("veg")} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "veg" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>
            <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span> {t.food.veg}
          </button>
          <button onClick={() => setVegFilter("non_veg")} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "non_veg" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
            <span className="w-3 h-3 border-2 border-red-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span> {t.food.nonVeg}
          </button>
          <SortDropdown sort={sortBy} setSort={setSortBy} />
          <PriceRangeFilter onApply={(min, max) => { setPriceMin(min); setPriceMax(max); }} />
        </div>
      </div>

      <main className="p-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm flex">
                <div className="w-32 h-32 bg-surface-container-high animate-pulse flex-shrink-0" />
                <div className="p-4 flex-1 space-y-2">
                  <div className="h-5 w-36 bg-surface-container-high animate-pulse rounded" />
                  <div className="h-4 w-24 bg-surface-container-high animate-pulse rounded" />
                  <div className="h-4 w-40 bg-surface-container-high animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasLocation ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
              <span className="material-symbols-outlined text-4xl text-primary">location_on</span>
            </div>
            <h3 className="text-lg font-black text-on-surface mb-1">{t.food.locationRequired}</h3>
            <p className="text-sm text-on-surface-variant mb-5">{t.food.locationRequiredDesc}</p>
            <button
              onClick={() => { window.location.href = "/app/home?selectLocation=true"; }}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-[#a00018] active:scale-95 transition-all shadow-md"
            >
              {t.food.setLocation}
            </button>
          </div>
        ) : noLocalVendors ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-red-400">location_off</span>
            </div>
            <h3 className="text-lg font-black text-on-surface mb-1">{t.home.notAvailable}</h3>
            <p className="text-sm text-on-surface-variant mb-1">{t.home.notAvailableDesc}</p>
            <p className="text-sm font-bold text-primary mb-4">{locationStore.displayAddress}</p>
            <p className="text-xs text-outline mb-5">We're expanding every day! Try a nearby pincode or check back soon.</p>
            <button
              onClick={() => { window.location.href = "/app/home?selectLocation=true"; }}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm"
            >
              {t.home.changeLocation}
            </button>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <EmptyState icon="🍽️" title={t.food.noRestaurants} description={t.food.noRestaurantsDesc} actionLabel={t.food.showAll} onAction={() => setVegFilter("all")} />
        ) : (
          <StaggerContainer className="space-y-4">
          {filteredRestaurants.map((restaurant, index) => (
            <StaggerItem key={restaurant.id}>
            <Link
              href={`/app/food/${restaurant.id}`}
              className="block bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-lift active:scale-[0.98] transition-transform"
            >
              <div className="flex">
                <div className="w-32 h-32 flex-shrink-0 overflow-hidden bg-surface-container relative">
                  <BlurImage src={restaurant.cover_image_url || restaurant.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} alt={restaurant.shop_name} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 128px" fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" />
                  <button
                    onClick={(e) => { e.preventDefault(); toggleFavorite(restaurant.id); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                  >
                    <span className={`material-symbols-outlined text-lg ${favorites.has(restaurant.id) ? "text-red-500" : "text-outline"}`}>favorite</span>
                  </button>
                  {restaurant.is_new && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">NEW</span>
                  )}
                  {(() => { const open = parseIsOpen(restaurant.opening_hours); return (
                    <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-black text-center py-0.5 ${
                      open ? "bg-green-600/90 text-white" : "bg-black/60 text-white"
                    }`}>{open ? "OPEN" : "CLOSED"}</span>
                  );})()}
                </div>
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden">
                        {restaurant.cover_image_url || restaurant.image_url ? <BlurImage src={restaurant.cover_image_url || restaurant.image_url} alt={`${restaurant.shop_name} cover`} fill className="w-full h-full" sizes="32px" /> : restaurant.shop_name?.charAt(0)}
                      </div>
                      <h3 className="font-bold text-on-surface text-base leading-tight">{restaurant.shop_name}</h3>
                    </div>
                    {restaurant.is_featured && <span className="text-amber-400 text-base flex-shrink-0">⭐</span>}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 ml-10">{restaurant.cuisine}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">★ {restaurant.rating || "4.0"}</span>
                    <span className="text-xs text-outline">•</span>
                    <span className="text-xs text-on-surface-variant">{restaurant.delivery_time_min ? `${restaurant.delivery_time_min}–${restaurant.delivery_time_max || restaurant.delivery_time_min + 15} min` : restaurant.delivery_time_minutes ? `${restaurant.delivery_time_minutes - 5}–${restaurant.delivery_time_minutes + 5} min` : restaurant.delivery_time || "30-40 min"}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{t.food.deliveryCharge} {restaurant.delivery_charge ? `₹${restaurant.delivery_charge}` : "₹49"}</p>
                  <div className="mt-2 flex items-center gap-1 text-primary font-bold text-xs">
                    <span>{t.food.viewMenu}</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </div>
                </div>
              </div>
            </Link>
            </StaggerItem>
          ))}
          </StaggerContainer>
        )}
      </main>
      <CartFloater />
      <QuickActionsFAB />
      </PullToRefresh>
    );
  }

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import PullToRefresh from "@/components/PullToRefresh";
import QuickActionsFAB from "@/components/QuickActionsFAB";
import { createClient } from "@/lib/supabase/client";
import { VendorCardSkeleton } from "@/components/Skeleton";

import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { useLocationStore } from "@/lib/store/locationStore";
import EmptyState from "@/components/EmptyState";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { PressScale, CartBounce } from "@/components/ui/AnimationWrappers";
import { NetworkError } from "@/components/ui/EmptyStates";

interface FoodVendor {
  id: string;
  shop_name: string;
  name?: string;
  cuisine?: string;
  image_url?: string;
  cover_image_url?: string;
  logo_url?: string;
  rating?: string | number;
  review_count?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_time_minutes?: number;
  delivery_time?: string;
  delivery_charge?: number | string;
  min_order_amount?: string;
  opening_hours?: string | null;
  is_new?: boolean;
  is_featured?: boolean;
  status?: string;
  type?: string;
  pincode?: string;
  city?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface FoodMenuItem {
  id: string;
  vendor_id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string;
  is_veg?: boolean;
  available?: boolean;
  description?: string;
  [key: string]: unknown;
}

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

function PromoBannerCarousel() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const defaultBanners = [
    { id: "1", label: t.food.promoteTitle, title: "50% OFF your first order", sub: "Use code FIRST50", color: "from-primary to-primary-container", image_url: "" },
    { id: "2", label: "⚡ Flash Sale", title: "Free delivery all day", sub: "On orders above ₹299", color: "from-violet-600 to-purple-400", image_url: "" },
    { id: "3", label: "🌟 New Arrival", title: "Try something new", sub: "Freshly added restaurants", color: "from-amber-500 to-yellow-300", image_url: "" },
  ];
  const [banners, setBanners] = useState<{ id: string; label: string; title: string; sub: string; color: string; image_url: string }[]>(defaultBanners);
  const [active, setActive] = useState(0);

  useEffect(() => {
    async function fetchBanners() {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("position");
      
      if (!error && data && data.length > 0) {
        setBanners(data.map((b: { id: string; title: string; link_url?: string; image_url: string }) => ({
          id: b.id,
          label: "📣 Promotion",
          title: b.title,
          sub: b.link_url || t.food.promoteDesc,
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
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-surface-container-lowest" : "w-1.5 bg-[var(--color-surface-container-lowest)]/40"}`} 
              />
            ))}
          </div>
        </div>
        
        {!b.image_url && (
          <>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[var(--color-surface-container-lowest)]/10 rounded-full" />
            <div className="absolute -right-8 -top-4 w-28 h-28 bg-white/5 rounded-full" />
          </>
        )}
      </div>
    </div>
  );
}



type SortOption = "rating" | "delivery_time" | "price_low" | "price_high";

function SortDropdown({ sort, setSort }: { sort: SortOption; setSort: (s: SortOption) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const options: { value: SortOption; label: string }[] = [
    { value: "rating", label: t.food.rating },
    { value: "delivery_time", label: t.food.deliveryTime },
    { value: "price_low", label: t.food.priceLowToHigh },
    { value: "price_high", label: t.food.priceHighToLow },
  ];
  const listboxId = `sort-listbox-${Math.random().toString(36).slice(2, 9)}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex(prev => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          setSort(options[activeIndex].value);
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setActiveIndex(-1); if (navigator.vibrate) navigator.vibrate(10); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Sort restaurants"
        className="flex items-center gap-2 px-3 py-2 bg-surface-container rounded-full text-sm font-medium active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">swap_vert</span>
        {options.find(o => o.value === sort)?.label}
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sort options"
          className="absolute top-full right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant z-20 min-w-[180px] animate-pop-in"
        >
          {options.map((opt, i) => (
            <button
              key={opt.value}
              role="option"
              aria-selected={sort === opt.value}
              onClick={() => { setSort(opt.value); setOpen(false); setActiveIndex(-1); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-low ${sort === opt.value ? "text-primary font-bold" : "text-on-surface-variant"} ${activeIndex === i ? "bg-surface-container-low" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PriceRangeFilter({ onApply }: { onApply: (min: number, max: number) => void }) {
  const { t } = useTranslation();
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
          <p className="text-xs font-bold text-on-surface-variant mb-2">{t.food.priceRange}</p>
          <div className="flex gap-2 items-center">
            <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder={t.food.min} />
            <span className="text-outline">-</span>
            <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder={t.food.max} />
          </div>
          <button onClick={() => { onApply(min, max); setOpen(false); if (navigator.vibrate) navigator.vibrate(15); }} className="w-full mt-3 py-2 bg-primary text-white text-sm font-bold rounded-lg active:scale-95 transition-transform">{t.food.apply}</button>
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
  const { t } = useTranslation();
  const { addItem, items, updateQuantity } = useCartStore();
  const { confirm } = useConfirm();
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

  const handleAdd = async () => {
    if (isDifferentVendor && await confirm({ title: t.food.changeRestaurant, message: t.food.changeRestaurantDesc, variant: "danger" })) {
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
        {t.common.add}
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
        aria-label="Decrease quantity"
        className="text-white font-bold w-10 h-10 flex items-center justify-center"
      >
        −
      </motion.button>
      <span className="text-white font-bold text-xs min-w-[16px] text-center">{qty}</span>
      <motion.button
        onClick={handleAdd}
        whileTap={{ scale: 1.25 }}
        aria-label="Increase quantity"
        className="text-white font-bold w-10 h-10 flex items-center justify-center"
      >
        +
      </motion.button>
    </motion.div>
  );
}

function CartFloater() {
  const { t } = useTranslation();
  const { items, totalPrice, totalItems } = useCartStore();
  const [showAnimation, setShowAnimation] = useState(false);
  const itemCount = useMemo(() => totalItems(), [items]);
  const [prevCount, setPrevCount] = useState(itemCount);
  
  useEffect(() => {
    if (itemCount > prevCount) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 500);
      setPrevCount(itemCount);
      return () => clearTimeout(timer);
    }
    setPrevCount(itemCount);
  }, [itemCount, prevCount]);
  
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
              {itemCount}
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
          <span className="font-bold">{t.common.viewCart}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-lg">₹{totalPrice().toFixed(2)}</span>
          <span className="material-symbols-outlined text-white/80">arrow_forward</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FoodPageContent() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const foodCategories = [
    { id: "pizza", name: t.food.pizza, icon: "🍕", color: "bg-orange-100" },
    { id: "burgers", name: t.food.burgers, icon: "🍔", color: "bg-amber-100" },
    { id: "biryani", name: t.food.biryani, icon: "🍚", color: "bg-yellow-100" },
    { id: "chinese", name: t.food.chinese, icon: "🥡", color: "bg-red-100" },
    { id: "italian", name: t.food.italian, icon: "🍝", color: "bg-green-100" },
    { id: "desserts", name: "Desserts", icon: "🍰", color: "bg-pink-100" },
  ];
  const getSetting = useServiceSettingsStore((s) => s.getSetting);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000);
  const [restaurants, setRestaurants] = useState<FoodVendor[]>([]);
  const [menuItems, setMenuItems] = useState<FoodMenuItem[]>([]);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggle = useFavoritesStore((s) => s.toggle);
  const setFavorites = useFavoritesStore((s) => s.setFavorites);
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [heroAsset, setHeroAsset] = useState<{ image_url: string; title: string; subtitle: string } | null>(null);
  const userPincode = useLocationStore((s) => s.pincode);
  const userCity = useLocationStore((s) => s.city);
  const displayAddress = useLocationStore((s) => s.displayAddress);
  const hasLocation = !!(userPincode || userCity);
  const [noLocalVendors, setNoLocalVendors] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const foodSetting = getSetting("food");

  const fetchData = useCallback(async (pincode?: string | null, city?: string | null) => {
    setLoading(true);
    setNoLocalVendors(false);
    setFetchError(null);
    try {
      const heroRes = await supabase.from("page_assets").select("*").eq("section", "food_hero").eq("is_active", true).maybeSingle();

      let query = supabase
        .from("vendors")
        .select("id, shop_name, name, cuisine, image_url, cover_image_url, rating, delivery_time_min, delivery_time_max, delivery_charge, min_order_amount, is_featured, is_new, status, type, pincode, city, opening_hours, created_at")
        .in("type", ["food", "restaurant"])
        .eq("status", "active");

      if (pincode) {
        query = query.eq("pincode", pincode);
      } else if (city) {
        query = query.ilike("city", city);
      }

      query = query.order("created_at", { ascending: false });
      const { data: vendorsData, error: vendorsError } = await query;

      if (vendorsError) {
        console.error("Vendors query failed:", vendorsError.message);
        setFetchError("Couldn't load restaurants. Please try again.");
        setLoading(false);
        return;
      }

      const filteredVendors = vendorsData || [];

      if (filteredVendors.length === 0) {
        setNoLocalVendors(true);
      }

      setRestaurants(filteredVendors);
      const vendorIds = filteredVendors.map((v: { id: string }) => v.id);
      if (vendorIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase.from("menu_items").select("id, vendor_id, name, price, category, image_url, is_veg, is_available, description").in("vendor_id", vendorIds).order("name");
        if (itemsError) {
          console.error("Menu items query failed:", itemsError.message);
        }
        setMenuItems(itemsData || []);
      } else {
        setMenuItems([]);
      }
      
      if (heroRes?.data) setHeroAsset(heroRes.data);
    } catch (err) {
      console.error("Failed to load food page:", err);
      setFetchError("Couldn't load restaurants. Please try again.");
    }
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchData(userPincode, userCity);
  }, [fetchData, userPincode, userCity]);

  useEffect(() => {
    fetchData(userPincode, userCity);
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (user) {
        supabase.from("favorites").select("vendor_id").eq("user_id", user.id).then(({ data }: { data: { vendor_id: string }[] | null }) => {
          if (data) setFavorites(data.map((f: { vendor_id: string }) => f.vendor_id));
        });
      }
    });
  }, [userPincode, userCity, fetchData, setFavorites]);

  if (foodSetting && !foodSetting.isEnabled) {
    return <ServiceUnavailable serviceName="Food Delivery" message={foodSetting.message} icon="restaurant" />;
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <NetworkError onRetry={() => fetchData(userPincode, userCity)} />
      </div>
    );
  }

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
      case "rating": return parseFloat(String(b.rating || "0")) - parseFloat(String(a.rating || "0"));
      case "delivery_time": return (a.delivery_time_min || 999) - (b.delivery_time_min || 999);
      case "price_low": return parseFloat(String(a.min_order_amount || "0")) - parseFloat(String(b.min_order_amount || "0"));
      case "price_high": return parseFloat(String(b.min_order_amount || "0")) - parseFloat(String(a.min_order_amount || "0"));
      default: return 0;
    }
  });

  const filteredRestaurants =
    selectedCategory === "all"
      ? sortedRestaurants
      : sortedRestaurants.filter((r) => r.cuisine?.toLowerCase().includes(selectedCategory));

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-surface">
      {/* Pincode Verification Banner */}
      {userPincode && (
        <div className={`px-4 py-2 ${noLocalVendors ? "bg-red-50 border-b border-red-200" : "bg-surface-container-low border-b border-green-200"} flex items-center gap-2`}>
          <span className={`material-symbols-outlined text-sm ${noLocalVendors ? "text-red-500" : "text-green-600"}`}>location_on</span>
          <p className={`text-[11px] font-bold flex-1 ${noLocalVendors ? "text-red-700" : "text-green-700"}`}>
            {noLocalVendors
              ? `No restaurants available near ${displayAddress}`
              : `Showing restaurants near ${displayAddress}`
            }
          </p>
          {noLocalVendors && (
            <button onClick={() => { window.location.href = "/app/home?selectLocation=true"; }} className="text-[10px] font-black text-primary underline whitespace-nowrap">
              {t.common.change}
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
          <button onClick={() => setVegFilter("all")} className={`px-4 py-2.5 rounded-full text-xs font-bold ${vegFilter === "all" ? "bg-inverse-surface text-white" : "bg-surface-container text-on-surface-variant"}`}>
            {t.food.all}
          </button>
          <button onClick={() => setVegFilter("veg")} className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "veg" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>
            <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span> {t.food.veg}
          </button>
          <button onClick={() => setVegFilter("non_veg")} className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "non_veg" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
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
            <p className="text-sm font-bold text-primary mb-4">{displayAddress}</p>
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
          <div className="space-y-4">
          {filteredRestaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/app/food/${restaurant.id}`}
              className="block bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-lift active:scale-[0.98] transition-transform"
            >
              <div className="flex">
                <div className="w-32 h-32 flex-shrink-0 overflow-hidden bg-surface-container relative">
                  <BlurImage src={restaurant.cover_image_url || restaurant.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} alt={restaurant.shop_name} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 128px" fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" />
                  <button
                    onClick={(e) => { e.preventDefault(); toggleFavorite(restaurant.id); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }}
                    aria-label="Toggle favorite"
                    aria-pressed={favorites.has(restaurant.id)}
                    className="absolute top-2 right-2 w-11 h-11 bg-[var(--color-surface-container-lowest)]/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                  >
                    <span className={`material-symbols-outlined text-lg ${favorites.has(restaurant.id) ? "text-red-500" : "text-outline"}`}>favorite</span>
                  </button>
                  {restaurant.is_new && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{t.food.new}</span>
                  )}
                  {(() => { const open = parseIsOpen(restaurant.opening_hours); return (
                    <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-black text-center py-0.5 ${
                      open ? "bg-green-600/90 text-white" : "bg-black/60 text-white"
                    }`}>{open ? t.food.open : t.food.closed}</span>
                  );})()}
                </div>
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden">
                        {restaurant.cover_image_url || restaurant.image_url ? <BlurImage src={(restaurant.cover_image_url || restaurant.image_url) as string} alt={`${restaurant.shop_name} cover`} fill className="w-full h-full" sizes="32px" /> : restaurant.shop_name?.charAt(0)}
                      </div>
                      <h3 className="font-bold text-on-surface text-base leading-tight">{restaurant.shop_name}</h3>
                    </div>
                    {restaurant.is_featured && <span className="text-amber-400 text-base flex-shrink-0">⭐</span>}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 ml-10">{restaurant.cuisine}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">★ {restaurant.rating || "4.0"}</span>
                    <span className="text-xs text-outline">•</span>
                    <span className="text-xs text-on-surface-variant">{restaurant.delivery_time_min ? `${restaurant.delivery_time_min}–${restaurant.delivery_time_max || restaurant.delivery_time_min + 15} ${t.food.mins}` : restaurant.delivery_time_minutes ? `${restaurant.delivery_time_minutes - 5}–${restaurant.delivery_time_minutes + 5} ${t.food.mins}` : restaurant.delivery_time || `30-40 ${t.food.mins}`}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{t.food.deliveryCharge} {restaurant.delivery_charge ? `₹${restaurant.delivery_charge}` : "₹49"}</p>
                  <div className="mt-2 flex items-center gap-1 text-primary font-bold text-xs">
                    <span>{t.food.viewMenu}</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          </div>
        )}
      </main>
      <CartFloater />
      <QuickActionsFAB />
      </PullToRefresh>
    );
  }

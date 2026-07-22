"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import PullToRefresh from "@/components/PullToRefresh";
import QuickActionsFAB from "@/components/QuickActionsFAB";
import { createClient } from "@/lib/supabase/client";

import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { EmptyState } from "@/components/ui/EmptyStates";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { NetworkError } from "@/components/ui/EmptyStates";
import { withRetry } from "@/lib/retry";
import logger from "@/lib/logger";

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.includes("fetch")) return true;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  const msg = (err as { message?: string })?.message?.toLowerCase() ?? "";
  return msg.includes("network") || msg.includes("failed to fetch") || msg.includes("load failed") || msg.includes("timeout");
}

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
  const [banners, setBanners] = useState<Array<{ id: string; badge: string; title: string; sub: string; gradient: string; image_url: string }>>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    async function fetchBanners() {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("position");
      
      if (!error && data && data.length > 0) {
        setBanners(data.map((b: { id: string; badge?: string; title: string; subtitle?: string; gradient?: string; link_url?: string; image_url: string }) => ({
          id: b.id,
          badge: b.badge || "",
          title: b.title,
          sub: b.subtitle || b.link_url || "",
          gradient: b.gradient || "from-primary to-primary-container",
          image_url: b.image_url,
        })));
      }
    }
    fetchBanners();
  }, [supabase]);

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
          !b.image_url ? `bg-gradient-to-r ${b.gradient}` : ""
        }`}
      >
        {b.image_url && <div className="absolute inset-0 bg-black/45 z-0" />}
        
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          <div>
            {b.badge && <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">{b.badge}</span>}
            <p className="text-white font-black text-base mt-0.5 leading-tight">{b.title}</p>
            {b.sub && <p className="text-white/80 text-xs mt-0.5">{b.sub}</p>}
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
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setActiveIndex(-1); }} />
          <div
            id={listboxId}
            role="listbox"
            aria-label="Sort options"
            className="absolute top-full left-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant z-20 min-w-[180px] animate-pop-in"
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
        </>
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
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant z-20 p-4 w-72 animate-pop-in">
            <p className="text-xs font-bold text-on-surface-variant mb-2">{t.food.priceRange}</p>
            <div className="flex gap-2 items-center">
              <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder={t.food.min} />
              <span className="text-outline">-</span>
              <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder={t.food.max} />
            </div>
            <button onClick={() => { onApply(min, max); setOpen(false); if (navigator.vibrate) navigator.vibrate(15); }} className="w-full mt-3 py-2 bg-primary text-white text-sm font-bold rounded-lg active:scale-95 transition-transform">{t.food.apply}</button>
          </div>
        </>
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
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("miiam-veg-filter") as "all" | "veg" | "non_veg") || "all";
    return "all";
  });
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000);

  const [restaurants, setRestaurants] = useState<FoodVendor[]>([]);
  const [menuItems, setMenuItems] = useState<FoodMenuItem[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
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
      await withRetry(async () => {
        const heroRes = await supabase.from("page_assets").select("*").eq("section", "food_hero").eq("is_active", true).maybeSingle();

        const { data: vendorsData, error: vendorsError } = await supabase
          .from("vendors")
          .select("id, shop_name, cuisine, image_url, cover_image_url, rating, delivery_time_min, delivery_time_max, delivery_charge, min_order_amount, is_featured, is_new, status, type, pincode, city, opening_hours, created_at")
          .order("created_at", { ascending: false })
          .limit(100);

        if (vendorsError) {
          logger.error({ err: vendorsError }, "Vendors query failed");
          throw new Error(vendorsError.message);
        }

        const allVendors = vendorsData || [];
        const filteredVendors = allVendors.filter(
          (v: { type?: string; status?: string }) =>
            (v.type === "food" || v.type === "restaurant") && v.status === "active"
        );

        const locationFiltered = pincode
          ? filteredVendors.filter((v: { pincode?: string }) => v.pincode === pincode)
          : city
            ? filteredVendors.filter((v: { city?: string }) => v.city?.toLowerCase() === city.toLowerCase())
            : filteredVendors;

        if (locationFiltered.length === 0) {
          setNoLocalVendors(true);
        }

        setRestaurants(locationFiltered);
        const vendorIds = locationFiltered.map((v: { id: string }) => v.id);
        if (vendorIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase.from("menu_items").select("id, vendor_id, name, price, category, image_url, is_veg, is_available, description").in("vendor_id", vendorIds).order("name");
          if (itemsError) {
            logger.error({ err: itemsError }, "Menu items query failed");
          }
          setMenuItems(itemsData || []);
        } else {
          setMenuItems([]);
        }

        const { data: storeData, error: storeError } = await supabase
          .from("store_items")
          .select("*")
          .eq("is_active", true)
          .order("category")
          .order("sort_order");
        if (storeError) {
          logger.error({ err: storeError }, "Store items query failed");
        }
        setStoreItems(storeData || []);
        
        if (heroRes?.data) setHeroAsset(heroRes.data);
      });
    } catch (err) {
      logger.error({ err }, "Failed to load food page");
      if (isNetworkError(err) || !navigator.onLine) {
        setFetchError("network");
      } else {
        setFetchError("server");
      }
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

  useEffect(() => {
    localStorage.setItem("miiam-veg-filter", vegFilter);
  }, [vegFilter]);

  // Real-time: listen for vendor status changes (online/offline toggle)
  useEffect(() => {
    const channel = supabase
      .channel("vendor-status-changes")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "vendors",
      }, (payload: { new: Record<string, unknown> }) => {
        const updated = payload.new as { type?: string; status?: string };
        if (updated.type !== "food" && updated.type !== "restaurant") return;
        // Refetch vendors list to reflect online/offline changes
        fetchData(userPincode, userCity);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userPincode, userCity, fetchData]);

  if (foodSetting && !foodSetting.isEnabled) {
    return <ServiceUnavailable serviceName="Food Delivery" message={foodSetting.message} icon="restaurant" />;
  }

  if (fetchError) {
    if (fetchError === "network") {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center px-6">
          <NetworkError onRetry={() => fetchData(userPincode, userCity)} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <EmptyState
          icon="error"
          emoji="⚠️"
          title="Something went wrong"
          description="We couldn't load restaurants right now. Please try again."
          actionLabel="Retry"
          onAction={() => fetchData(userPincode, userCity)}
          type="default"
        />
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

  const searchedRestaurants = searchQuery
    ? filteredRestaurants.filter((r) => r.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.cuisine?.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredRestaurants;

  const filteredReadyRestaurants = searchedRestaurants;

  const { visibleItems: visibleRestaurants, hasMore: hasMoreRestaurants, loadMore: loadMoreRestaurants, sentinelRef: restaurantSentinel } = useInfiniteScroll({ items: filteredReadyRestaurants, pageSize: 8 });

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
          <Link href="/app/home" aria-label="Back to explore" className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </Link>
          <h1 className="text-xl font-black text-on-surface">{t.food.title}</h1>
          <Link href="/app/cart" aria-label="View cart" className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center relative">
            <span className="material-symbols-outlined" aria-hidden="true">shopping_cart</span>
          </Link>
        </div>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/home' }, { label: 'Food' }]} />

      {heroAsset && (
        <div className="px-6 mt-4">
          <div className="rounded-2xl overflow-hidden relative h-44 shadow-sm">
            <BlurImage src={heroAsset.image_url} alt="Food Hero Banner" fill className="w-full h-full" sizes="100vw" fallbackSrc="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-5">
              <h2 className="text-white text-2xl font-black">{heroAsset.title}</h2>
              <p className="text-white/90 text-sm mt-1">{heroAsset.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      <PromoBannerCarousel />

      {/* Circular Category Icons - GKB Style */}
      <div className="px-4 py-4">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => { setSelectedCategory("all"); if (navigator.vibrate) navigator.vibrate(10); }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${selectedCategory === "all" ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-surface-container-high text-on-surface-variant"}`}>
              <span className="text-xl">🍽</span>
            </div>
            <span className={`text-[10px] font-bold ${selectedCategory === "all" ? "text-primary" : "text-on-surface-variant"}`}>{t.food.all}</span>
          </button>
          {foodCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); if (navigator.vibrate) navigator.vibrate(10); }}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${selectedCategory === cat.id ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-surface-container-high text-on-surface-variant"}`}>
                <span className="text-xl">{cat.icon}</span>
              </div>
              <span className={`text-[10px] font-bold ${selectedCategory === cat.id ? "text-primary" : "text-on-surface-variant"}`}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants or cuisines..."
            className="w-full pl-10 pr-4 py-3 bg-surface-container rounded-xl text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Veg/Non-veg Filter + Sort — Sticky */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-lg px-4 py-3 flex flex-wrap gap-2 border-b border-outline/5">
        <button onClick={() => setVegFilter("all")} className={`px-4 py-2 rounded-full text-xs font-bold ${vegFilter === "all" ? "bg-inverse-surface text-white" : "bg-surface-container text-on-surface-variant"}`}>
          {t.food.all}
        </button>
        <button onClick={() => setVegFilter("veg")} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "veg" ? "bg-green-600 text-white" : "bg-green-100 text-green-700"}`}>
          <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span> {t.food.veg}
        </button>
        <button onClick={() => setVegFilter("non_veg")} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 ${vegFilter === "non_veg" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
          <span className="w-3 h-3 border-2 border-red-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span> {t.food.nonVeg}
        </button>
        <SortDropdown sort={sortBy} setSort={setSortBy} />
        <PriceRangeFilter onApply={(min, max) => { setPriceMin(min); setPriceMax(max); }} />
      </div>

      <main className="p-6 space-y-4">
        {/* Price Bucket Sections - Under 99/149/199/249 */}
        {!loading && hasLocation && !noLocalVendors && (storeItems.length > 0 || menuItems.length > 0) && (
          <div className="space-y-5">
            {[
              { max: 99, label: "Under ₹99", emoji: "🔥", color: "from-orange-500 to-red-500", dbCategory: "under_99" },
              { max: 149, label: "Under ₹149", emoji: "💰", color: "from-emerald-500 to-teal-500", dbCategory: "under_149" },
              { max: 199, label: "Under ₹199", emoji: "⭐", color: "from-blue-500 to-indigo-500", dbCategory: "under_199" },
              { max: 249, label: "Under ₹249", emoji: "🎯", color: "from-purple-500 to-pink-500", dbCategory: "under_249" },
            ].map((bucket) => {
              // Prefer store_items from DB, fall back to filtering menu_items
              const dbItems = storeItems
                .filter((item) => item.category === bucket.dbCategory)
                .slice(0, 10);
              const fallbackItems = dbItems.length === 0
                ? menuItems
                    .filter((item) => item.price > 0 && item.price <= bucket.max)
                    .slice(0, 10)
                : [];
              const items = dbItems.length > 0 ? dbItems : fallbackItems;
              if (items.length === 0) return null;
              return (
                <div key={bucket.max}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{bucket.emoji}</span>
                      <h2 className="text-lg font-bold text-on-surface">{bucket.label}</h2>
                    </div>
                    <span className="text-xs font-bold text-primary">{items.length} items</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {items.map((item) => {
                      const isStoreItem = "original_price" in item;
                      const restaurant = isStoreItem
                        ? restaurants.find((r) => r.id === (item as StoreItem).vendor_id)
                        : restaurants.find((r) => r.id === (item as FoodMenuItem).vendor_id);
                      const itemName = item.name;
                      const itemImage = (item as StoreItem).image_url || (item as FoodMenuItem).image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                      const itemPrice = item.price;
                      const itemVeg = (item as StoreItem).is_veg ?? (item as FoodMenuItem).is_veg;
                      const vendorId = (item as StoreItem).vendor_id || (item as FoodMenuItem).vendor_id;
                      const vendorName = isStoreItem ? (item as StoreItem).vendor_name || restaurant?.shop_name : restaurant?.shop_name || "Restaurant";
                      const linkHref = isStoreItem ? `/app/store/${item.id}` : vendorId ? `/app/food/${vendorId}` : "#";
                      return (
                        <Link
                          key={item.id}
                          href={linkHref}
                          className="flex-shrink-0 w-36 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-lift active:scale-[0.98] transition-transform"
                        >
                          <div className="relative h-24 bg-surface-container overflow-hidden">
                            <BlurImage
                              src={itemImage}
                              alt={itemName}
                              fill
                              className="w-full h-full"
                              sizes="144px"
                              fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                            />
                            <div className="absolute top-1.5 left-1.5">
                              <span className={`w-3.5 h-3.5 border-[1.5px] ${itemVeg ? "border-green-600 bg-white" : "border-red-600 bg-white"} rounded-sm flex items-center justify-center`}>
                                <span className={`w-1.5 h-1.5 ${itemVeg ? "bg-green-600" : "bg-red-600"} rounded-full`} />
                              </span>
                            </div>
                            <span className="absolute bottom-1.5 right-1.5 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                              ₹{itemPrice}
                            </span>
                          </div>
                          <div className="p-2.5">
                            <h3 className="font-bold text-on-surface text-[11px] truncate leading-tight">{itemName}</h3>
                            <p className="text-[9px] text-on-surface-variant truncate mt-1">{vendorName}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
        ) : searchedRestaurants.length === 0 ? (
          <EmptyState icon="🍽️" title={t.food.noRestaurants} description={t.food.noRestaurantsDesc} actionLabel={t.food.showAll} onAction={() => { setVegFilter("all"); }} />
        ) : (
          <>
            {/* Popular Near You - Top Rated */}
            {searchedRestaurants.length > 3 && (
              <div className="px-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <h2 className="text-lg font-bold text-on-surface">Popular Near You</h2>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {[...searchedRestaurants]
                    .sort((a, b) => parseFloat(String(b.rating || "0")) - parseFloat(String(a.rating || "0")))
                    .slice(0, 6)
                    .map((restaurant) => (
                      <Link
                        key={`popular-${restaurant.id}`}
                        href={`/app/food/${restaurant.id}`}
                        className="flex-shrink-0 w-36 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-lift active:scale-[0.98] transition-transform"
                      >
                        <div className="relative h-24 bg-surface-container overflow-hidden">
                          <BlurImage
                            src={restaurant.cover_image_url || restaurant.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                            alt={restaurant.shop_name}
                            fill
                            className="w-full h-full"
                            sizes="144px"
                            fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">#{searchedRestaurants.indexOf(restaurant) + 1}</span>
                          <span className="absolute bottom-1.5 right-1.5 bg-white/90 text-on-surface text-[10px] font-black px-1.5 py-0.5 rounded-full">★ {restaurant.rating || "4.0"}</span>
                        </div>
                        <div className="p-2.5">
                          <h3 className="font-bold text-on-surface text-[11px] truncate">{restaurant.shop_name}</h3>
                          <p className="text-[9px] text-on-surface-variant truncate mt-0.5">{restaurant.cuisine}</p>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Horizontal Scroll Cards - GKB Style */}
            <div className="px-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-on-surface">{selectedCategory === "all" ? "All Restaurants" : foodCategories.find(c => c.id === selectedCategory)?.name || "Restaurants"}</h2>
                <span className="text-xs font-bold text-primary">{searchedRestaurants.length} places</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {searchedRestaurants.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/app/food/${restaurant.id}`}
                    className="flex-shrink-0 w-44 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-lift active:scale-[0.98] transition-transform"
                  >
                    {/* Image */}
                    <div className="relative h-28 bg-surface-container">
                      <BlurImage
                        src={restaurant.cover_image_url || restaurant.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                        alt={restaurant.shop_name}
                        fill
                        className="w-full h-full"
                        sizes="176px"
                        fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                      />
                      {/* Heart */}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleFavorite(restaurant.id); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }}
                        aria-label="Toggle favorite"
                        aria-pressed={favorites.has(restaurant.id)}
                        className="absolute top-2 right-2 w-8 h-8 bg-[var(--color-surface-container-lowest)]/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
                      >
                        <span className={`material-symbols-outlined text-base ${favorites.has(restaurant.id) ? "text-red-500" : "text-outline"}`}>favorite</span>
                      </button>
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {restaurant.is_new && (
                          <span className="bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{t.food.new}</span>
                        )}
                        {restaurant.is_featured && (
                          <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">⭐ Featured</span>
                        )}
                      </div>
                      {/* Open/Closed */}
                      {(() => { const open = parseIsOpen(restaurant.opening_hours); return (
                        <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-black text-center py-0.5 ${
                          open ? "bg-green-600/90 text-white" : "bg-black/60 text-white"
                        }`}>{open ? t.food.open : t.food.closed}</span>
                      );})()}
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      <h3 className="font-bold text-on-surface text-sm truncate">{restaurant.shop_name}</h3>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{restaurant.cuisine}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">★ {restaurant.rating || "4.0"}</span>
                        <span className="text-[10px] text-on-surface-variant">
                          {restaurant.delivery_time_min ? `${restaurant.delivery_time_min} min` : `30-40 min`}
                        </span>
                      </div>
                      <p className={`text-[10px] font-bold mt-1 ${!restaurant.delivery_charge ? "text-green-600" : "text-on-surface-variant"}`}>
                        {restaurant.delivery_charge ? `₹${restaurant.delivery_charge} delivery` : "免费配送 • Free delivery"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Vertical List - Full Details */}
            <div className="px-4 pb-4">
              <h3 className="text-base font-bold text-on-surface mb-3">More Options</h3>
              <div className="space-y-3">
                {visibleRestaurants.map((restaurant) => (
                  <Link
                    key={`list-${restaurant.id}`}
                    href={`/app/food/${restaurant.id}`}
                    className="block bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm card-lift active:scale-[0.98] transition-transform"
                  >
                    <div className="flex">
                      <div className="w-28 h-28 flex-shrink-0 overflow-hidden bg-surface-container relative">
                        <BlurImage src={restaurant.cover_image_url || restaurant.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"} alt={restaurant.shop_name} fill className="w-full h-full" sizes="112px" fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" />
                        {restaurant.is_new && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{t.food.new}</span>
                        )}
                        {(() => { const open = parseIsOpen(restaurant.opening_hours); return (
                          <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-black text-center py-0.5 ${
                            open ? "bg-green-600/90 text-white" : "bg-black/60 text-white"
                          }`}>{open ? t.food.open : t.food.closed}</span>
                        );})()}
                      </div>
                      <div className="p-3 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <div className="relative w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 overflow-hidden">
                              {restaurant.cover_image_url || restaurant.image_url ? <BlurImage src={(restaurant.cover_image_url || restaurant.image_url) as string} alt={`${restaurant.shop_name} cover`} fill className="w-full h-full" sizes="28px" /> : restaurant.shop_name?.charAt(0)}
                            </div>
                            <h3 className="font-bold text-on-surface text-sm leading-tight">{restaurant.shop_name}</h3>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); toggleFavorite(restaurant.id); if (navigator.vibrate) navigator.vibrate([20, 10, 20]); }}
                            aria-label="Toggle favorite"
                            className="flex-shrink-0"
                          >
                            <span className={`material-symbols-outlined text-lg ${favorites.has(restaurant.id) ? "text-red-500" : "text-outline"}`}>favorite</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 ml-9">{restaurant.cuisine}</p>
                        <div className="flex items-center gap-2 mt-1.5 ml-9">
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">★ {restaurant.rating || "4.0"}</span>
                          <span className="text-[10px] text-outline">•</span>
                          <span className="text-[10px] text-on-surface-variant">{restaurant.delivery_time_min ? `${restaurant.delivery_time_min}–${restaurant.delivery_time_max || restaurant.delivery_time_min + 15} min` : `30-40 min`}</span>
                          {!restaurant.delivery_charge && <span className="text-[10px] text-green-600 font-bold">Free delivery</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      <CartFloater />
      <QuickActionsFAB />
      </PullToRefresh>
    );
  }

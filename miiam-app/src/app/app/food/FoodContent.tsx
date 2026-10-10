"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { FoodSkeleton } from "@/components/Skeleton";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { useTranslation } from "@/lib/i18n/useTranslation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store/cartStore";
import { useServiceSettingsStore } from "@/lib/store/serviceSettingsStore";
import { parseIsOpen } from "@/lib/vendor-hours";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import PullToRefresh from "@/components/PullToRefresh";
import QuickActionsFAB from "@/components/QuickActionsFAB";
import { createClient } from "@/lib/supabase/client";
import CombosSection from "@/components/home/CombosSection";

import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { useLocationStore } from "@/lib/store/locationStore";
import { EmptyState } from "@/components/ui/EmptyStates";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import VegFilterPill from "@/components/VegFilterPill";
import { QuickCommerceToggle } from "@/components/QuickCommerceToggle";
import { NetworkError } from "@/components/ui/EmptyStates";
import { withRetry } from "@/lib/retry";
import logger from "@/lib/logger";

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.includes("fetch")) return true;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  const msg = (err as { message?: string })?.message?.toLowerCase() ?? "";
  return (
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("timeout")
  );
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
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
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
        onClick={() => {
          setOpen(!open);
          setActiveIndex(-1);
          if (navigator.vibrate) navigator.vibrate(10);
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Sort restaurants"
        className="bg-surface-container flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          swap_vert
        </span>
        {options.find((o) => o.value === sort)?.label}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setOpen(false);
              setActiveIndex(-1);
            }}
          />
          <div
            id={listboxId}
            role="listbox"
            aria-label="Sort options"
            className="bg-surface-container-lowest border-outline-variant animate-pop-in absolute top-full left-0 z-20 mt-2 min-w-[180px] rounded-xl border shadow-lg"
          >
            {options.map((opt, i) => (
              <button
                key={opt.value}
                role="option"
                aria-selected={sort === opt.value}
                onClick={() => {
                  setSort(opt.value);
                  setOpen(false);
                  setActiveIndex(-1);
                }}
                className={`hover:bg-surface-container-low w-full px-4 py-2.5 text-left text-sm ${sort === opt.value ? "text-accent font-bold" : "text-on-surface-variant"} ${activeIndex === i ? "bg-surface-container-low" : ""}`}
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
  const MIN = 0;
  const MAX = 1000;
  const STEP = 50;

  const handleMinChange = (val: number) => {
    const clamped = Math.min(val, max - STEP);
    setMin(clamped);
  };

  const handleMaxChange = (val: number) => {
    const clamped = Math.max(val, min + STEP);
    setMax(clamped);
  };

  const minPercent = ((min - MIN) / (MAX - MIN)) * 100;
  const maxPercent = ((max - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (navigator.vibrate) navigator.vibrate(10);
        }}
        className="bg-surface-container flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined text-sm">attach_money</span>₹{min}–{max}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="bg-surface-container-lowest border-outline-variant animate-pop-in absolute top-full left-0 z-20 mt-2 w-72 rounded-xl border p-4 shadow-lg">
            <p className="text-on-surface-variant mb-4 text-xs font-bold">{t.food.priceRange}</p>

            {/* Dual range slider */}
            <div className="relative flex h-6 items-center">
              {/* Track background */}
              <div className="bg-surface-container absolute h-1.5 w-full rounded-full" />
              {/* Active range */}
              <div
                className="bg-primary absolute h-1.5 rounded-full"
                style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
              />
              {/* Min thumb */}
              <input
                type="range"
                min={MIN}
                max={MAX}
                step={STEP}
                value={min}
                onChange={(e) => handleMinChange(Number(e.target.value))}
                className="[&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:bg-primary pointer-events-none absolute z-20 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
              />
              {/* Max thumb */}
              <input
                type="range"
                min={MIN}
                max={MAX}
                step={STEP}
                value={max}
                onChange={(e) => handleMaxChange(Number(e.target.value))}
                className="[&::-webkit-slider-thumb]:bg-primary [&::-moz-range-thumb]:bg-primary pointer-events-none absolute z-30 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            {/* Price labels */}
            <div className="text-on-surface-variant mt-2 flex justify-between text-xs">
              <span className="text-on-surface font-bold">₹{min}</span>
              <span className="text-on-surface font-bold">₹{max}</span>
            </div>

            {/* Quick presets */}
            <div className="mt-3 flex gap-1.5">
              {[
                { label: "Under ₹100", min: 0, max: 100 },
                { label: "₹100–₹300", min: 100, max: 300 },
                { label: "₹300–₹500", min: 300, max: 500 },
                { label: "₹500+", min: 500, max: 1000 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setMin(preset.min);
                    setMax(preset.max);
                  }}
                  className={`rounded-full px-2 py-1 text-[10px] font-bold transition-all ${
                    min === preset.min && max === preset.max
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                onApply(min, max);
                setOpen(false);
                if (navigator.vibrate) navigator.vibrate(15);
              }}
              className="bg-primary text-on-primary mt-3 w-full rounded-lg py-2 text-sm font-bold transition-transform active:scale-95"
            >
              {t.food.apply}
            </button>
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
    if (
      isDifferentVendor &&
      (await confirm({
        title: t.food.changeRestaurant,
        message: t.food.changeRestaurantDesc,
        variant: "danger",
      }))
    ) {
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
        className="bg-primary text-on-primary border-primary h-8 min-w-[52px] rounded-lg border px-3 text-xs font-extrabold transition-all hover:brightness-95"
      >
        {t.common.add}
      </motion.button>
    );
  }

  return (
    <motion.div
      animate={bouncing ? { scale: [1, 1.2, 0.95, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-surface-container-lowest border-primary flex items-center overflow-hidden rounded-lg border shadow-sm"
    >
      <motion.button
        onClick={() => updateQuantity(item.id, qty - 1)}
        whileTap={{ scale: 0.75 }}
        aria-label="Decrease quantity"
        className="bg-primary text-on-primary flex h-9 w-9 items-center justify-center font-bold transition-colors hover:brightness-95"
      >
        −
      </motion.button>
      <span className="text-on-surface min-w-[20px] text-center text-xs font-extrabold">{qty}</span>
      <motion.button
        onClick={handleAdd}
        whileTap={{ scale: 1.25 }}
        aria-label="Increase quantity"
        className="bg-primary text-on-primary flex h-9 w-9 items-center justify-center font-bold transition-colors hover:brightness-95"
      >
        +
      </motion.button>
    </motion.div>
  );
}

export default function FoodPageContent() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const defaultFoodCategories = [
    {
      id: "pizza",
      name: t.food.pizza,
      icon: "🍕",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80",
      color: "bg-orange-100",
    },
    {
      id: "burgers",
      name: t.food.burgers,
      icon: "🍔",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80",
      color: "bg-amber-100",
    },
    {
      id: "biryani",
      name: t.food.biryani,
      icon: "🍚",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80",
      color: "bg-yellow-100",
    },
    {
      id: "chinese",
      name: t.food.chinese,
      icon: "🥡",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80",
      color: "bg-red-100",
    },
    {
      id: "italian",
      name: t.food.italian,
      icon: "🍝",
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=200&q=80",
      color: "bg-green-100",
    },
    {
      id: "desserts",
      name: "Desserts",
      icon: "🍰",
      image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&q=80",
      color: "bg-pink-100",
    },
  ];
  const [foodCategories, setFoodCategories] = useState(defaultFoodCategories);
  const getSetting = useServiceSettingsStore((s) => s.getSetting);
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">(() => {
    if (typeof window !== "undefined")
      return (localStorage.getItem("miiam-veg-filter") as "all" | "veg" | "non_veg") || "all";
    return "all";
  });
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [quickOnly, setQuickOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(1000);

  const [restaurants, setRestaurants] = useState<FoodVendor[]>([]);
  const [menuItems, setMenuItems] = useState<FoodMenuItem[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [combos, setCombos] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      image_url: string;
      original_price: number;
      combo_price: number;
      items: string[];
    }>
  >([]);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggle = useFavoritesStore((s) => s.toggle);
  const setFavorites = useFavoritesStore((s) => s.setFavorites);
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const { addItem } = useCartStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [heroAsset, setHeroAsset] = useState<{
    image_url: string;
    title: string;
    subtitle: string;
  } | null>(null);
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
        const heroRes = await supabase
          .from("page_assets")
          .select("*")
          .eq("section", "food_hero")
          .eq("is_active", true)
          .maybeSingle();

        const { data: vendorsData, error: vendorsError } = await supabase
          .from("vendors")
          .select(
            "id, shop_name, cuisine, image_url, cover_image_url, rating, delivery_time_min, delivery_time_max, delivery_charge, min_order_amount, is_featured, is_new, status, type, pincode, city, opening_hours, created_at"
          )
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
            ? filteredVendors.filter(
                (v: { city?: string }) => v.city?.toLowerCase() === city.toLowerCase()
              )
            : filteredVendors;

        if (locationFiltered.length === 0) {
          setNoLocalVendors(true);
        }

        setRestaurants(locationFiltered);
        const vendorIds = locationFiltered.map((v: { id: string }) => v.id);
        if (vendorIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("menu_items")
            .select(
              "id, vendor_id, name, price, category, image_url, is_veg, is_available, description"
            )
            .in("vendor_id", vendorIds)
            .order("name");
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

        const { data: comboData } = await supabase
          .from("combos")
          .select("id, name, description, image_url, original_price, combo_price, items")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
        if (comboData) setCombos(comboData);

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
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
        if (user) {
          supabase
            .from("favorites")
            .select("vendor_id")
            .eq("user_id", user.id)
            .then(({ data }: { data: { vendor_id: string }[] | null }) => {
              if (data) setFavorites(data.map((f: { vendor_id: string }) => f.vendor_id));
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [userPincode, userCity, fetchData, setFavorites]);

  useEffect(() => {
    localStorage.setItem("miiam-veg-filter", vegFilter);
  }, [vegFilter]);

  useEffect(() => {
    async function loadCuisines() {
      try {
        const { data } = await supabase
          .from("cuisines")
          .select("id, name, image_url")
          .eq("active", true)
          .order("name");
        if (data && data.length > 0) {
          const icons = ["🍕", "🍔", "🍚", "🥡", "🍝", "🍰", "🌮", "🍜", "🥘", "🥗", "🍱", "🧁"];
          const colors = [
            "bg-orange-100",
            "bg-amber-100",
            "bg-yellow-100",
            "bg-red-100",
            "bg-green-100",
            "bg-pink-100",
            "bg-accent/10",
            "bg-accent/10",
            "bg-teal-100",
            "bg-rose-100",
            "bg-accent/10",
            "bg-lime-100",
          ];
          setFoodCategories(
            data.map((c: { name: string; image_url?: string }, i: number) => ({
              id: c.name.toLowerCase(),
              name: c.name,
              icon: icons[i % icons.length],
              image: c.image_url || "",
              color: colors[i % colors.length],
            }))
          );
        }
      } catch (e) {
        logger.error({ err: e }, "Failed to load cuisines");
      }
    }
    loadCuisines();
  }, [supabase]);

  // Real-time: listen for vendor status changes (online/offline toggle)
  useEffect(() => {
    const channel = supabase
      .channel("vendor-status-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vendors",
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as { type?: string; status?: string };
          if (updated.type !== "food" && updated.type !== "restaurant") return;
          // Refetch vendors list to reflect online/offline changes
          fetchData(userPincode, userCity);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userPincode, userCity, fetchData]);

  const toggleFavorite = async (id: string) => {
    const wasFavorited = favoriteIds.includes(id);
    toggle(id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (wasFavorited) {
          await supabase.from("favorites").delete().eq("user_id", user.id).eq("vendor_id", id);
        } else {
          await supabase.from("favorites").insert({ user_id: user.id, vendor_id: id });
        }
      }
    } catch (e) {
      logger.error({ err: e }, "Failed to toggle favorite");
      toggle(id);
    }
  };

  const sortedRestaurants = useMemo(
    () =>
      [...restaurants].sort((a, b) => {
        switch (sortBy) {
          case "rating":
            return parseFloat(String(b.rating || "0")) - parseFloat(String(a.rating || "0"));
          case "delivery_time":
            return (a.delivery_time_min || 999) - (b.delivery_time_min || 999);
          case "price_low":
            return (
              parseFloat(String(a.min_order_amount || "0")) -
              parseFloat(String(b.min_order_amount || "0"))
            );
          case "price_high":
            return (
              parseFloat(String(b.min_order_amount || "0")) -
              parseFloat(String(a.min_order_amount || "0"))
            );
          default:
            return 0;
        }
      }),
    [restaurants, sortBy]
  );

  const filteredRestaurants = useMemo(
    () =>
      sortedRestaurants
        .filter(
          (r) => selectedCategory === "all" || r.cuisine?.toLowerCase().includes(selectedCategory)
        )
        .filter((r) => {
          const price = parseFloat(String(r.price_for_two || r.avg_price || 0));
          return price >= priceMin && price <= priceMax;
        })
        .filter((r) => {
          if (!quickOnly) return true;
          // Express: vendor must promise ≤ 20 min max delivery
          return (r.delivery_time_max ?? r.delivery_time_min ?? 999) <= 20;
        })
        .filter((r) => {
          if (vegFilter === "all") return true;
          const vendorItems = menuItems.filter((item) => item.vendor_id === r.id);
          if (vendorItems.length === 0) return true;
          return vendorItems.some((item) => item.is_veg === (vegFilter === "veg"));
        }),
    [sortedRestaurants, selectedCategory, priceMin, priceMax, quickOnly, vegFilter, menuItems]
  );

  const searchedRestaurants = searchQuery
    ? filteredRestaurants.filter(
        (r) =>
          r.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredRestaurants;

  const filteredReadyRestaurants = searchedRestaurants;

  const {
    visibleItems: visibleRestaurants,
    hasMore: hasMoreRestaurants,
    loadMore: loadMoreRestaurants,
    sentinelRef: restaurantSentinel,
  } = useInfiniteScroll({ items: filteredReadyRestaurants, pageSize: 8 });

  if (foodSetting && !foodSetting.isEnabled) {
    return (
      <ServiceUnavailable
        serviceName="Food Delivery"
        message={foodSetting.message}
        icon="restaurant"
      />
    );
  }

  if (fetchError) {
    if (fetchError === "network") {
      return (
        <div className="bg-surface flex min-h-screen items-center justify-center px-6">
          <NetworkError onRetry={() => fetchData(userPincode, userCity)} />
        </div>
      );
    }
    return (
      <div className="bg-surface flex min-h-screen items-center justify-center px-6">
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

  if (loading) {
    return <FoodSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="bg-surface min-h-screen">
      {/* Pincode Verification Banner */}
      {userPincode && (
        <div
          className={`px-4 py-2 ${noLocalVendors ? "border-b border-red-200 bg-red-50" : "bg-surface-container-low border-b border-green-200"} flex items-center gap-2`}
        >
          <span
            className={`material-symbols-outlined text-sm ${noLocalVendors ? "text-red-500" : "text-green-600"}`}
          >
            location_on
          </span>
          <p
            className={`flex-1 text-[11px] font-bold ${noLocalVendors ? "text-red-700" : "text-green-700"}`}
          >
            {noLocalVendors
              ? `No restaurants available near ${displayAddress}`
              : `Showing restaurants near ${displayAddress}`}
          </p>
          {noLocalVendors && (
            <button
              onClick={() => {
                window.location.href = "/app/home?selectLocation=true";
              }}
              className="text-accent text-[10px] font-black whitespace-nowrap underline"
            >
              {t.common.change}
            </button>
          )}
        </div>
      )}
      <header className="bg-surface-container-lowest sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/app/home"
            aria-label="Back to explore"
            className="bg-surface-container flex h-10 w-10 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>
          </Link>
          <h1 className="text-on-surface text-xl font-black">{t.food.title}</h1>
          <Link
            href="/app/cart"
            aria-label="View cart"
            className="bg-surface-container relative flex h-10 w-10 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              shopping_cart
            </span>
          </Link>
        </div>
      </header>

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Food" }]} />

      {/* Active Filter Badge */}
      {activeFilter !== "all" && (
        <div className="mt-3 px-6">
          <div className="bg-primary/10 text-accent inline-flex items-center gap-2 rounded-full px-4 py-2">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            <span className="text-sm font-bold">
              {activeFilter === "under_99" && "Under ₹99"}
              {activeFilter === "under_149" && "Under ₹149"}
              {activeFilter === "under_199" && "Under ₹199"}
              {activeFilter === "under_249" && "Under ₹249"}
              {activeFilter === "combos" && "Combos"}
              {activeFilter === "bakery" && "Bakery"}
            </span>
            <button
              onClick={() => setActiveFilter("all")}
              className="hover:bg-primary hover:text-on-primary/20 ml-1 rounded-full p-0.5"
              aria-label="Clear filter"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      {heroAsset && (
        <div className="mt-4 px-6">
          <div className="relative h-44 overflow-hidden rounded-2xl shadow-sm">
            <BlurImage
              src={heroAsset.image_url}
              alt="Food Hero Banner"
              fill
              className="h-full w-full"
              sizes="100vw"
              fallbackSrc="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-5">
              <h2 className="text-2xl font-black text-white">{heroAsset.title}</h2>
              <p className="mt-1 text-sm text-white/90">{heroAsset.subtitle}</p>
            </div>
          </div>
        </div>
      )}

      {/* Circular Category Icons - Photo Style */}
      <div className="px-4 py-4">
        <div
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Food categories"
        >
          <button
            onClick={() => {
              setSelectedCategory("all");
              if (navigator.vibrate) navigator.vibrate(10);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedCategory("all");
              }
            }}
            role="tab"
            aria-selected={selectedCategory === "all"}
            tabIndex={selectedCategory === "all" ? 0 : -1}
            className="flex flex-shrink-0 flex-col items-center gap-1.5"
          >
            <div
              className={`h-16 w-16 overflow-hidden rounded-full border-2 transition-all ${selectedCategory === "all" ? "border-primary shadow-primary/30 shadow-lg" : "border-surface-container-high"}`}
            >
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
                <span className="text-2xl">🍽</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold ${selectedCategory === "all" ? "text-accent" : "text-on-surface-variant"}`}
            >
              {t.food.all}
            </span>
          </button>
          {foodCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                if (navigator.vibrate) navigator.vibrate(10);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedCategory(cat.id);
                }
              }}
              role="tab"
              aria-selected={selectedCategory === cat.id}
              tabIndex={selectedCategory === cat.id ? 0 : -1}
              className="flex flex-shrink-0 flex-col items-center gap-1.5"
            >
              <div
                className={`h-16 w-16 overflow-hidden rounded-full border-2 transition-all ${selectedCategory === cat.id ? "border-primary shadow-primary/30 shadow-lg" : "border-surface-container-high"}`}
              >
                <div className="relative h-full w-full">
                  <BlurImage
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                    fallbackSrc={cat.image}
                  />
                </div>
              </div>
              <span
                className={`text-[10px] font-bold ${selectedCategory === cat.id ? "text-accent" : "text-on-surface-variant"}`}
              >
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <SearchAutocomplete
          onSelect={(term) => setSearchQuery(term)}
          preventNavigation
          className="w-full"
        />
      </div>

      {/* Veg/Non-veg Filter + Express + Sort — Sticky */}
      <div className="bg-surface/95 border-outline/5 sticky top-0 z-20 flex flex-wrap gap-2 border-b px-4 py-3 backdrop-blur-lg">
        <VegFilterPill value={vegFilter} onChange={setVegFilter} />
        <QuickCommerceToggle
          onToggle={(on) => {
            setQuickOnly(on);
          }}
        />
        <SortDropdown sort={sortBy} setSort={setSortBy} />
        <PriceRangeFilter
          onApply={(min, max) => {
            setPriceMin(min);
            setPriceMax(max);
          }}
        />
      </div>

      <main className="space-y-4 p-6">
        {/* Combos Section - show when filter is combos */}
        {activeFilter === "combos" && !loading && <CombosSection combos={combos} />}

        {/* Price Bucket Sections - Under 99/149/199/249 */}
        {!loading &&
          hasLocation &&
          !noLocalVendors &&
          (storeItems.length > 0 || menuItems.length > 0) && (
            <div className="space-y-5">
              {[
                {
                  max: 99,
                  label: "Under ₹99",
                  emoji: "🔥",
                  color: "from-orange-500 to-red-500",
                  dbCategory: "under_99",
                  filter: "under_99",
                },
                {
                  max: 149,
                  label: "Under ₹149",
                  emoji: "💰",
                  color: "from-emerald-500 to-teal-500",
                  dbCategory: "under_149",
                  filter: "under_149",
                },
                {
                  max: 199,
                  label: "Under ₹199",
                  emoji: "⭐",
                  color: "from-accent to-accent/70",
                  dbCategory: "under_199",
                  filter: "under_199",
                },
                {
                  max: 249,
                  label: "Under ₹249",
                  emoji: "🎯",
                  color: "from-deal to-deal/70",
                  dbCategory: "under_249",
                  filter: "under_249",
                },
              ]
                .filter((bucket) => activeFilter === "all" || activeFilter === bucket.filter)
                .map((bucket) => {
                  // Prefer store_items from DB, fall back to filtering menu_items
                  const isViewingBucket = activeFilter === bucket.filter;
                  const vegMatch = (item: StoreItem | FoodMenuItem) =>
                    vegFilter === "all" || item.is_veg === (vegFilter === "veg");
                  const dbItems = storeItems
                    .filter((item) => item.category === bucket.dbCategory && vegMatch(item))
                    .slice(0, isViewingBucket ? undefined : 10);
                  const fallbackItems =
                    dbItems.length === 0
                      ? menuItems
                          .filter(
                            (item) => item.price > 0 && item.price <= bucket.max && vegMatch(item)
                          )
                          .slice(0, isViewingBucket ? undefined : 10)
                      : [];
                  const items = dbItems.length > 0 ? dbItems : fallbackItems;
                  if (items.length === 0) return null;
                  return (
                    <div key={bucket.max}>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{bucket.emoji}</span>
                          <h2 className="text-on-surface text-lg font-bold">{bucket.label}</h2>
                        </div>
                        <button
                          onClick={() => {
                            setActiveFilter(bucket.filter);
                            if (navigator.vibrate) navigator.vibrate(10);
                          }}
                          className="text-accent text-xs font-bold transition-transform hover:underline active:scale-95"
                        >
                          View More
                        </button>
                      </div>
                      <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                        {items.map((item) => {
                          const isStoreItem = "original_price" in item;
                          const restaurant = isStoreItem
                            ? restaurants.find((r) => r.id === (item as StoreItem).vendor_id)
                            : restaurants.find((r) => r.id === (item as FoodMenuItem).vendor_id);
                          const itemName = item.name;
                          const itemImage =
                            (item as StoreItem).image_url ||
                            (item as FoodMenuItem).image_url ||
                            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                          const itemPrice = item.price;
                          const itemVeg =
                            (item as StoreItem).is_veg ?? (item as FoodMenuItem).is_veg;
                          const vendorId =
                            (item as StoreItem).vendor_id || (item as FoodMenuItem).vendor_id;
                          const vendorName = isStoreItem
                            ? (item as StoreItem).vendor_name || restaurant?.shop_name
                            : restaurant?.shop_name || "Restaurant";
                          const linkHref = isStoreItem
                            ? `/app/store/${item.id}`
                            : vendorId
                              ? `/app/food/${vendorId}`
                              : "#";
                          return (
                            <Link
                              key={item.id}
                              href={linkHref}
                              className="bg-surface-container-lowest card-lift w-36 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
                            >
                              <div className="bg-surface-container relative h-24 overflow-hidden">
                                <BlurImage
                                  src={itemImage}
                                  alt={itemName}
                                  fill
                                  className="h-full w-full"
                                  sizes="144px"
                                  fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                                />
                                <div className="absolute top-1.5 left-1.5">
                                  <span
                                    className={`h-3.5 w-3.5 border-[1.5px] ${itemVeg ? "border-green-600 bg-white" : "border-red-600 bg-white"} flex items-center justify-center rounded-sm`}
                                  >
                                    <span
                                      className={`h-1.5 w-1.5 ${itemVeg ? "bg-green-600" : "bg-red-600"} rounded-full`}
                                    />
                                  </span>
                                </div>
                                <span className="bg-deal absolute right-1.5 bottom-1.5 rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                                  ₹{itemPrice}
                                </span>
                              </div>
                              <div className="p-2.5">
                                <h3 className="text-on-surface line-clamp-2 text-[11px] leading-tight font-bold">
                                  {itemName}
                                </h3>
                                <p className="text-on-surface-variant mt-1 truncate text-[9px]">
                                  {vendorName}
                                </p>
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

        {/* Bakery Section - show when filter is bakery */}
        {activeFilter === "bakery" && !loading && (
          <div className="mb-6 px-4">
            {menuItems.filter((i) => i.category === "Bakery").length > 0 ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧁</span>
                    <h2 className="text-on-surface text-lg font-bold">Bakery Items</h2>
                  </div>
                  <span className="text-accent text-xs font-bold">
                    {menuItems.filter((i) => i.category === "Bakery").length} items
                  </span>
                </div>
                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                  {menuItems
                    .filter((i) => i.category === "Bakery")
                    .slice(0, 10)
                    .map((item) => {
                      const restaurant = restaurants.find((r) => r.id === item.vendor_id);
                      return (
                        <Link
                          key={item.id}
                          href={`/app/food/${item.vendor_id}`}
                          className="bg-surface-container-lowest card-lift w-36 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
                        >
                          <div className="bg-surface-container relative h-24 overflow-hidden">
                            <BlurImage
                              src={
                                item.image_url ||
                                "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"
                              }
                              alt={item.name}
                              fill
                              className="h-full w-full"
                              sizes="144px"
                              fallbackSrc="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"
                            />
                            <span className="bg-deal absolute right-1.5 bottom-1.5 rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                              ₹{item.price}
                            </span>
                          </div>
                          <div className="p-2.5">
                            <h3 className="text-on-surface line-clamp-2 text-[11px] leading-tight font-bold">
                              {item.name}
                            </h3>
                            <p className="text-on-surface-variant mt-1 truncate text-[9px]">
                              {restaurant?.shop_name || "Restaurant"}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <span className="text-4xl">🧁</span>
                <p className="text-on-surface-variant mt-2 text-sm">No bakery items yet</p>
                <p className="text-on-surface-variant/60 mt-1 text-xs">
                  Bakery items from local vendors will appear here
                </p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-surface-container-lowest flex overflow-hidden rounded-2xl shadow-sm"
              >
                <div className="bg-surface-container-high h-32 w-32 flex-shrink-0 animate-pulse" />
                <div className="flex-1 space-y-2 p-4">
                  <div className="bg-surface-container-high h-5 w-36 animate-pulse rounded" />
                  <div className="bg-surface-container-high h-4 w-24 animate-pulse rounded" />
                  <div className="bg-surface-container-high h-4 w-40 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasLocation ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <div className="bg-primary/10 animate-glow-pulse mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <span className="material-symbols-outlined text-accent text-4xl">location_on</span>
            </div>
            <h3 className="text-on-surface mb-1 text-lg font-black">{t.food.locationRequired}</h3>
            <p className="text-on-surface-variant mb-5 text-sm">{t.food.locationRequiredDesc}</p>
            <button
              onClick={() => {
                window.location.href = "/app/home?selectLocation=true";
              }}
              className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold shadow-md transition-all hover:bg-[#e5b62e] active:scale-95"
            >
              {t.food.setLocation}
            </button>
          </div>
        ) : noLocalVendors ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <span className="material-symbols-outlined text-4xl text-red-400">location_off</span>
            </div>
            <h3 className="text-on-surface mb-1 text-lg font-black">{t.home.notAvailable}</h3>
            <p className="text-on-surface-variant mb-1 text-sm">{t.home.notAvailableDesc}</p>
            <p className="text-accent mb-4 text-sm font-bold">{displayAddress}</p>
            <p className="text-outline mb-5 text-xs">
              We're expanding every day! Try a nearby pincode or check back soon.
            </p>
            <button
              onClick={() => {
                window.location.href = "/app/home?selectLocation=true";
              }}
              className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-bold"
            >
              {t.home.changeLocation}
            </button>
          </div>
        ) : searchedRestaurants.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title={t.food.noRestaurants}
            description={t.food.noRestaurantsDesc}
            actionLabel={t.food.showAll}
            onAction={() => {
              setVegFilter("all");
            }}
          />
        ) : (
          <>
            {/* Popular Near You - Top Rated */}
            {searchedRestaurants.length > 3 && (
              <div className="mb-6 px-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <h2 className="text-on-surface text-lg font-bold">Popular Near You</h2>
                  </div>
                </div>
                <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                  {[...searchedRestaurants]
                    .sort(
                      (a, b) =>
                        parseFloat(String(b.rating || "0")) - parseFloat(String(a.rating || "0"))
                    )
                    .slice(0, 6)
                    .map((restaurant) => (
                      <Link
                        key={`popular-${restaurant.id}`}
                        href={`/app/food/${restaurant.id}`}
                        className="bg-surface-container-lowest card-lift w-36 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
                      >
                        <div className="bg-surface-container relative h-24 overflow-hidden">
                          <BlurImage
                            src={
                              restaurant.cover_image_url ||
                              restaurant.image_url ||
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                            }
                            alt={restaurant.shop_name}
                            fill
                            className="h-full w-full"
                            sizes="144px"
                            fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                          />
                          <span className="absolute top-1.5 left-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
                            #{searchedRestaurants.indexOf(restaurant) + 1}
                          </span>
                          <span className="text-on-surface absolute right-1.5 bottom-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-black">
                            ★ {restaurant.rating || "4.0"}
                          </span>
                        </div>
                        <div className="p-2.5">
                          <h3 className="text-on-surface line-clamp-2 text-[11px] font-bold">
                            {restaurant.shop_name}
                          </h3>
                          <p className="text-on-surface-variant mt-0.5 truncate text-[9px]">
                            {restaurant.cuisine}
                          </p>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            )}

            {/* Cuisine Collections */}
            {searchedRestaurants.length > 0 && (
              <div className="mb-6 px-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">🍽️</span>
                  <h2 className="text-on-surface text-lg font-bold">Cuisine Collections</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      name: "Biryani Lovers",
                      emoji: "🍛",
                      gradient: "from-amber-500 to-orange-600",
                      filter: "biryani",
                    },
                    {
                      name: "Pizza & Pasta",
                      emoji: "🍕",
                      gradient: "from-red-500 to-rose-600",
                      filter: "pizza",
                    },
                    {
                      name: "Chinese Cravings",
                      emoji: "🥡",
                      gradient: "from-yellow-500 to-amber-600",
                      filter: "chinese",
                    },
                    {
                      name: "South Indian",
                      emoji: "🥘",
                      gradient: "from-green-500 to-emerald-600",
                      filter: "south indian",
                    },
                    {
                      name: "Dessert Heaven",
                      emoji: "🍰",
                      gradient: "from-pink-500 to-rose-500",
                      filter: "dessert",
                    },
                    {
                      name: "Street Food",
                      emoji: "🌮",
                      gradient: "from-deal to-deal/70",
                      filter: "street",
                    },
                  ].map((collection) => {
                    const count = searchedRestaurants.filter((r) =>
                      r.cuisine?.toLowerCase().includes(collection.filter)
                    ).length;
                    return (
                      <button
                        key={collection.name}
                        onClick={() => {
                          setSelectedCategory(collection.filter);
                          if (navigator.vibrate) navigator.vibrate(10);
                        }}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left ${collection.gradient} text-white shadow-sm transition-transform active:scale-[0.97]`}
                      >
                        <span className="mb-1 block text-2xl">{collection.emoji}</span>
                        <p className="text-sm leading-tight font-bold">{collection.name}</p>
                        {count > 0 && (
                          <p className="mt-0.5 text-[10px] font-medium text-white/80">
                            {count} restaurant{count !== 1 ? "s" : ""}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Horizontal Scroll Cards - GKB Style */}
            <div className="mb-6 px-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-on-surface text-lg font-bold">
                  {selectedCategory === "all"
                    ? "All Restaurants"
                    : foodCategories.find((c) => c.id === selectedCategory)?.name || "Restaurants"}
                </h2>
                <span className="text-accent text-xs font-bold">
                  {searchedRestaurants.length} places
                </span>
              </div>
              <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                {searchedRestaurants.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/app/food/${restaurant.id}`}
                    className="bg-surface-container-lowest card-lift w-44 flex-shrink-0 overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
                  >
                    {/* Image */}
                    <div className="bg-surface-container relative h-28">
                      <BlurImage
                        src={
                          restaurant.cover_image_url ||
                          restaurant.image_url ||
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                        }
                        alt={restaurant.shop_name}
                        fill
                        className="h-full w-full"
                        sizes="176px"
                        fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                      />
                      {/* Heart */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(restaurant.id);
                          if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                        }}
                        aria-label="Toggle favorite"
                        aria-pressed={favorites.has(restaurant.id)}
                        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-container-lowest)]/90 shadow transition-transform hover:scale-110"
                      >
                        <span
                          className={`material-symbols-outlined text-base ${favorites.has(restaurant.id) ? "text-red-500" : "text-outline"}`}
                        >
                          favorite
                        </span>
                      </button>
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {restaurant.is_new && (
                          <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                            {t.food.new}
                          </span>
                        )}
                        {restaurant.is_featured && (
                          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      {/* Open/Closed */}
                      {(() => {
                        const open = parseIsOpen(restaurant.opening_hours);
                        return (
                          <span
                            className={`absolute right-0 bottom-0 left-0 py-0.5 text-center text-[9px] font-black ${
                              open ? "bg-green-600/90 text-white" : "bg-black/60 text-white"
                            }`}
                          >
                            {open ? t.food.open : t.food.closed}
                          </span>
                        );
                      })()}
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      <h3 className="text-on-surface line-clamp-2 text-sm font-bold">
                        {restaurant.shop_name}
                      </h3>
                      <p className="text-on-surface-variant mt-0.5 truncate text-[10px]">
                        {restaurant.cuisine}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                          ★ {restaurant.rating || "4.0"}
                        </span>
                        <span className="text-on-surface-variant text-[10px]">
                          {restaurant.delivery_time_min
                            ? `${restaurant.delivery_time_min} min`
                            : `30-40 min`}
                        </span>
                      </div>
                      <p
                        className={`mt-1 text-[10px] font-bold ${!restaurant.delivery_charge ? "text-green-600" : "text-on-surface-variant"}`}
                      >
                        {restaurant.delivery_charge
                          ? `₹${restaurant.delivery_charge} delivery`
                          : "Free delivery"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Vertical List - Full Details */}
            <div className="px-4 pb-4">
              <h3 className="text-on-surface mb-3 text-base font-bold">More Options</h3>
              <div className="space-y-3">
                {visibleRestaurants.map((restaurant) => {
                  const popularItem = menuItems.find(
                    (m) => m.vendor_id === restaurant.id && m.is_available !== false
                  );
                  return (
                    <div key={`list-${restaurant.id}`} className="relative">
                      <Link
                        href={`/app/food/${restaurant.id}`}
                        className="bg-surface-container-lowest card-lift block overflow-hidden rounded-2xl shadow-sm transition-transform active:scale-[0.98]"
                      >
                        <div className="flex">
                          <div className="bg-surface-container relative h-28 w-28 flex-shrink-0 overflow-hidden">
                            <BlurImage
                              src={
                                restaurant.cover_image_url ||
                                restaurant.image_url ||
                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                              }
                              alt={restaurant.shop_name}
                              fill
                              className="h-full w-full"
                              sizes="112px"
                              fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                            />
                            {restaurant.is_new && (
                              <span className="absolute top-2 left-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                                {t.food.new}
                              </span>
                            )}
                            {(() => {
                              const open = parseIsOpen(restaurant.opening_hours);
                              return (
                                <span
                                  className={`absolute right-0 bottom-0 left-0 py-0.5 text-center text-[9px] font-black ${
                                    open ? "bg-green-600/90 text-white" : "bg-black/60 text-white"
                                  }`}
                                >
                                  {open ? t.food.open : t.food.closed}
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex-1 p-3">
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center gap-2">
                                <div className="bg-primary text-on-primary relative flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-black">
                                  {restaurant.cover_image_url || restaurant.image_url ? (
                                    <BlurImage
                                      src={
                                        (restaurant.cover_image_url ||
                                          restaurant.image_url) as string
                                      }
                                      alt={`${restaurant.shop_name} cover`}
                                      fill
                                      className="h-full w-full"
                                      sizes="28px"
                                    />
                                  ) : (
                                    restaurant.shop_name?.charAt(0)
                                  )}
                                </div>
                                <h3 className="text-on-surface text-sm leading-tight font-bold">
                                  {restaurant.shop_name}
                                </h3>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite(restaurant.id);
                                  if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                                }}
                                aria-label="Toggle favorite"
                                className="flex-shrink-0"
                              >
                                <span
                                  className={`material-symbols-outlined text-lg ${favorites.has(restaurant.id) ? "text-red-500" : "text-outline"}`}
                                >
                                  favorite
                                </span>
                              </button>
                            </div>
                            <p className="text-on-surface-variant mt-0.5 ml-9 text-[10px]">
                              {restaurant.cuisine}
                            </p>
                            <div className="mt-1.5 ml-9 flex items-center gap-2">
                              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                                ★ {restaurant.rating || "4.0"}
                              </span>
                              <span className="text-outline text-[10px]">•</span>
                              <span className="text-on-surface-variant text-[10px]">
                                {restaurant.delivery_time_min
                                  ? `${restaurant.delivery_time_min}–${restaurant.delivery_time_max || restaurant.delivery_time_min + 15} min`
                                  : `30-40 min`}
                              </span>
                              {!restaurant.delivery_charge && (
                                <span className="text-[10px] font-bold text-green-600">
                                  Free delivery
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                      {popularItem && parseIsOpen(restaurant.opening_hours) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItem({
                              id: popularItem.id,
                              menu_item_id: popularItem.id,
                              name: popularItem.name,
                              price: popularItem.price,
                              image_url: popularItem.image_url,
                              is_veg: popularItem.is_veg,
                              vendor_id: restaurant.id,
                              vendor_name: restaurant.shop_name || "Restaurant",
                            });
                            if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                          }}
                          className="bg-primary text-on-primary shadow-primary/30 absolute right-3 bottom-3 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90"
                          aria-label={`Quick add ${popularItem.name}`}
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
      <QuickActionsFAB />
    </PullToRefresh>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useRecentlyViewed } from "@/lib/hooks/useRecentlyViewed";
import CustomizationModal from "@/components/food/CustomizationModal";
import BlurImage from "@/components/BlurImage";
import VegFilterPill from "@/components/VegFilterPill";
import { getCurrentMenuSlot } from "@/lib/menuSlots";
import { Skeleton, ProfileSkeleton, MenuItemSkeleton } from "@/components/Skeleton";
import logger from "@/lib/logger";
import { motion, AnimatePresence } from "framer-motion";

interface Vendor {
  id: string;
  shop_name: string;
  type: string;
  cuisine?: string;
  address?: string;
  phone?: string;
  rating?: number;
  review_count?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_charge?: number;
  min_order_amount?: number;
  is_veg?: boolean;
  banner_url?: string;
  cover_image_url?: string;
  image_url?: string;
  opening_hours?: string;
  description?: string;
  is_featured?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  image_url?: string;
  images?: string[];
  is_veg?: boolean;
  is_featured?: boolean;
  featured?: boolean;
  discount_percent?: number;
  original_price?: number;
  menu_slot?: string;
  quantity?: number;
  description?: string;
}

interface ReviewProfile {
  full_name?: string;
  avatar_url?: string;
}

interface Review {
  id: string;
  rating: number;
  review_text?: string;
  tags?: string[];
  created_at: string;
  profile?: ReviewProfile;
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
    const parts = hours.replace("\u2013", "-").split("-");
    if (parts.length < 2) return true;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= to24(parts[0]) && cur < to24(parts[1]);
  } catch {
    return true;
  }
}

export default function VendorPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const supabase = useMemo(() => createClient(), []);
  const { trackView } = useRecentlyViewed();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non_veg">("all");
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [imageIndex, setImageIndex] = useState<Record<string, number>>({});
  const { addItem, items, updateQuantity, totalPrice, totalItems } = useCartStore();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: vendorData } = await supabase
          .from("vendors")
          .select(
            "id, shop_name, cuisine, address, phone, image_url, cover_image_url, rating, review_count, delivery_time_min, delivery_time_max, delivery_charge, min_order_amount, opening_hours, description, is_featured, status, type, pincode, city, latitude, longitude"
          )
          .eq("id", vendorId)
          .single();

        if (vendorData) {
          setVendor(vendorData);
          trackView({
            id: vendorData.id,
            name: vendorData.shop_name,
            image_url: vendorData.image_url,
            cuisine: vendorData.cuisine,
            rating: vendorData.rating,
          });
        }

        let itemsTable = "menu_items";
        if (vendorData?.type === "grocery") itemsTable = "grocery_products";
        else if (vendorData?.type === "flower" || vendorData?.type === "flowers")
          itemsTable = "flower_items";

        const { data: menuData } = await supabase
          .from(itemsTable)
          .select("*")
          .eq("vendor_id", vendorId);

        if (menuData) setMenuItems(menuData);

        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("*, profile:profiles(full_name, avatar_url)")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false })
          .limit(10);

        if (reviewsData) setReviews(reviewsData);
      } catch (err) {
        logger.error({ err: err }, "Failed to load vendor data");
      }
      setLoading(false);
    }
    loadData();
  }, [vendorId]);

  const getQty = (id: string) => items.find((i) => i.menu_item_id === id)?.quantity || 0;

  const categories = [
    "All",
    ...new Set(menuItems.map((m) => m.category).filter((c): c is string => Boolean(c))),
  ];

  const currentSlot = getCurrentMenuSlot();

  const filteredItems = menuItems.filter((m) => {
    const categoryMatch = activeCategory === "All" || m.category === activeCategory;
    const vegMatch =
      vendor?.type === "food" ? vegFilter === "all" || m.is_veg === (vegFilter === "veg") : true;
    const slotMatch = !m.menu_slot || m.menu_slot === "all_day" || m.menu_slot === currentSlot;
    return categoryMatch && vegMatch && slotMatch;
  });
  const sortedItems = [...filteredItems].sort(
    (a, b) => (b.is_featured || b.featured ? 1 : 0) - (a.is_featured || a.featured ? 1 : 0)
  );

  const handleCustomizeItem = (item: MenuItem) => {
    const isFoodVendor =
      vendor && (vendor.type === "food" || vendor.type === "restaurant" || vendor.cuisine);
    const isGroceryOrOther =
      vendor &&
      (vendor.type === "grocery" || vendor.type === "flower" || vendor.type === "flowers");
    if (isFoodVendor && !isGroceryOrOther) {
      setCustomizingItem(item);
    } else {
      handleAddToCart(item);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem(
      {
        id: item.id,
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        vendor_id: vendorId,
        vendor_name: vendor?.shop_name ?? "",
      },
      item.quantity || 1
    );
  };

  const handleUpdateQty = (id: string, delta: number) => {
    const current = items.find((i) => i.menu_item_id === id)?.quantity || 0;
    if (current + delta <= 0) {
      updateQuantity(id, 0);
    } else {
      updateQuantity(id, current + delta);
    }
  };

  const isOpen = vendor ? parseIsOpen(vendor.opening_hours) : true;

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (vendor?.rating || 0).toFixed(1);

  if (loading) {
    return (
      <div className="bg-surface min-h-screen space-y-4 p-4" aria-label="Loading...">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <ProfileSkeleton />
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          {[1, 2, 3, 4].map((i) => (
            <MenuItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-surface flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-on-surface-variant)]">Vendor not found</p>
          <Link href="/app/food" className="text-accent mt-4 block font-bold">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  const cartItemCount = totalItems();
  const cartTotal = totalPrice();

  return (
    <div className="bg-surface min-h-screen pb-28">
      {/* Sticky header — back / shop + cuisine / search + cart */}
      <header className="bg-surface-container-lowest/95 border-outline-variant/60 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="flex h-14 items-center gap-1 px-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0 flex-1 px-1">
            <p className="text-on-surface truncate text-[13px] font-bold">{vendor.shop_name}</p>
            <p className="text-on-surface-variant truncate text-[11px]">
              {vendor.cuisine}
              {vendor.address ? ` • ${vendor.address}` : ""}
            </p>
          </div>
          <Link
            href="/app/search"
            aria-label="Search"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">search</span>
          </Link>
          <Link
            href="/app/cart"
            aria-label="Go to cart"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
        </div>
      </header>

      {/* Cover image — flat, no overlay */}
      <div className="bg-surface-container relative h-44 overflow-hidden sm:h-52">
        <BlurImage
          src={
            vendor.banner_url ||
            vendor.cover_image_url ||
            vendor.image_url ||
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
          }
          alt={vendor.shop_name}
          fill
          className="h-full w-full"
          sizes="100vw"
          fallbackSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
        />
      </div>

      {/* Title + rating */}
      <section className="border-outline-variant/60 border-b px-4 py-4">
        {vendor.is_featured && (
          <span className="mb-2 inline-block rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black tracking-wider text-amber-900 uppercase">
            Featured
          </span>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-on-surface truncate text-xl leading-tight font-black">
              {vendor.shop_name}
            </h1>
            <p className="text-on-surface-variant mt-1 truncate text-sm">
              {vendor.cuisine}
              {vendor.address ? ` • ${vendor.address}` : ""}
            </p>
          </div>
          <span className="border-outline-variant/60 text-accent inline-flex flex-shrink-0 items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-black shadow-sm">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            {avgRating}
            <span className="text-on-surface-variant font-medium">
              ({reviews.length || vendor.review_count || 0})
            </span>
          </span>
        </div>
      </section>

      {/* Info Chips */}
      <div className="bg-surface-container-lowest border-outline-variant/20 border-b px-4 py-3">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <span
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${isOpen ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "border border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"} ${isOpen ? "animate-pulse" : ""}`}
            />
            {isOpen ? "Open Now" : "Closed"}
          </span>
          <div className="bg-outline-variant/30 h-4 w-px flex-shrink-0" />
          <span className="bg-surface-container-low text-on-surface border-outline-variant/20 flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {vendor.delivery_time_min || 30}–{vendor.delivery_time_max || 45} min
          </span>
          <div className="bg-outline-variant/30 h-4 w-px flex-shrink-0" />
          <span className="bg-surface-container-low text-on-surface border-outline-variant/20 flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold">
            <span className="material-symbols-outlined text-[14px]">delivery_dining</span>
            {vendor.delivery_charge ? `\u20B9${vendor.delivery_charge}` : "Free delivery"}
          </span>
          {vendor.min_order_amount ? (
            <>
              <div className="bg-outline-variant/30 h-4 w-px flex-shrink-0" />
              <span className="bg-surface-container-low text-on-surface border-outline-variant/20 flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[14px]">receipt</span>
                min order: ₹{vendor.min_order_amount}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Closed Banner */}
      {!isOpen && (
        <div className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-3">
          <span className="material-symbols-outlined text-red-500">schedule</span>
          <div>
            <p className="text-sm font-bold text-red-700">Restaurant is currently closed</p>
            <p className="mt-0.5 text-xs text-red-500">
              You can browse the menu but cannot order right now.
            </p>
          </div>
        </div>
      )}

      {/* Address & Hours */}
      <section className="border-outline-variant/60 space-y-3 border-b px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl">
            <span className="material-symbols-outlined text-accent text-lg">location_on</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-on-surface text-sm font-semibold">
              {vendor.address || "Address not available"}
            </p>
            <p className="text-on-surface-variant mt-0.5 text-xs">Live tracking not available</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
            <span className="material-symbols-outlined text-lg text-amber-600 dark:text-amber-400">
              access_time
            </span>
          </div>
          <div>
            <p className="text-on-surface text-sm font-semibold">
              {vendor.opening_hours || "9:00 AM - 10:00 PM"}
            </p>
            <p className="text-on-surface-variant mt-0.5 text-xs">Today</p>
          </div>
        </div>
      </section>

      {/* Reviews Summary */}
      {reviews.length > 0 && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-on-surface text-base font-bold">Reviews</h2>
            <Link
              href={`/app/vendor/${vendorId}/reviews`}
              className="text-accent text-xs font-bold"
            >
              See All →
            </Link>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto">
            {reviews.slice(0, 4).map((review: Review) => (
              <div
                key={review.id}
                className="bg-surface-container-low border-outline-variant/20 w-56 flex-shrink-0 rounded-xl border p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="from-primary to-primary-container text-on-primary flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold">
                    {review.profile?.full_name?.[0] || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-on-surface truncate text-xs font-bold">
                      {review.profile?.full_name || "User"}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-[10px] ${star <= review.rating ? "text-amber-400" : "text-outline"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-on-surface-variant line-clamp-2 text-[11px] leading-relaxed">
                    {review.review_text}
                  </p>
                )}
                {review.tags && review.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {review.tags.slice(0, 2).map((tag: string) => (
                      <span
                        key={tag}
                        className="bg-primary/10 text-accent rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Menu Filter */}
      <div className="bg-surface-container-lowest border-outline-variant/20 sticky top-14 z-20 border-b">
        <div className="px-4 pt-3 pb-2">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-on-surface text-lg font-black">Menu</h2>
            <span className="text-on-surface-variant text-xs font-bold">
              {sortedItems.length} items
            </span>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  activeCategory === cat
                    ? "bg-primary text-on-primary shadow-primary/20 shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        {vendor.type === "food" || vendor.type === "restaurant" || vendor.cuisine ? (
          <div className="px-4 pb-3">
            <VegFilterPill value={vegFilter} onChange={setVegFilter} size="sm" />
          </div>
        ) : null}
      </div>

      {/* Menu Items */}
      <div className="px-4 py-1">
        {filteredItems.length === 0 ? (
          <div className="bg-surface-container-lowest border-outline-variant/20 rounded-2xl border p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-outline mb-2 text-4xl">
              restaurant_menu
            </span>
            <p className="text-on-surface-variant text-sm font-medium">No items found</p>
            <p className="text-outline mt-1 text-xs">Try a different category or filter</p>
          </div>
        ) : (
          sortedItems.map((item, index) => {
            const qty = getQty(item.id);
            const isFeatured = item.is_featured || item.featured;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3) }}
                className="border-outline-variant/40 border-b py-3 last:border-0"
              >
                <div className="flex gap-3">
                  {/* Image */}
                  <div
                    className="bg-surface-container relative h-28 w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => {
                      const imgs =
                        item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                      if (imgs.length > 1) {
                        setImageIndex((prev) => ({
                          ...prev,
                          [item.id]: ((prev[item.id] || 0) + 1) % imgs.length,
                        }));
                      }
                    }}
                  >
                    {(() => {
                      const imgs =
                        item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                      const idx = imageIndex[item.id] || 0;
                      const src =
                        imgs[idx] ||
                        item.image_url ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                      return (
                        <BlurImage
                          key={idx}
                          src={src}
                          alt={item.name}
                          fill
                          className="h-full w-full"
                          sizes="112px"
                          fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                        />
                      );
                    })()}
                    {(() => {
                      const imgs =
                        item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                      return (
                        imgs.length > 1 && (
                          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
                            {imgs.map((_: string, i: number) => (
                              <span
                                key={i}
                                className={`h-1 w-1 rounded-full transition-all ${i === (imageIndex[item.id] || 0) ? "w-2 bg-white" : "bg-white/50"}`}
                              />
                            ))}
                          </div>
                        )
                      );
                    })()}
                    {/* Discount badge */}
                    {item.discount_percent != null && item.discount_percent > 0 && (
                      <div className="absolute top-1.5 left-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                        -{item.discount_percent}%
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start gap-1.5">
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        {item.is_veg !== undefined && (
                          <span
                            className={`h-3 w-3 border-[1.5px] ${item.is_veg ? "border-emerald-600" : "border-red-600"} flex flex-shrink-0 items-center justify-center rounded-sm`}
                          >
                            <span
                              className={`h-1 w-1 ${item.is_veg ? "bg-emerald-600" : "bg-red-600"} rounded-full`}
                            />
                          </span>
                        )}
                        <h3 className="truncate text-sm font-bold text-gray-900">{item.name}</h3>
                      </div>
                      {isFeatured && (
                        <span className="flex-shrink-0 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                          Featured
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-400">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-base font-black text-gray-900">₹{item.price}</span>
                        {item.original_price && (
                          <span className="text-xs text-gray-400 line-through">
                            ₹{item.original_price}
                          </span>
                        )}
                      </div>
                      {qty === 0 ? (
                        <button
                          onClick={() => handleCustomizeItem(item)}
                          className="bg-primary text-on-primary border-primary h-8 min-w-[52px] rounded-lg border px-3 text-xs font-extrabold transition-all hover:brightness-95"
                        >
                          ADD +
                        </button>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="bg-surface-container-lowest border-primary flex items-center overflow-hidden rounded-lg border shadow-sm"
                        >
                          <button
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center font-bold transition-transform active:scale-90"
                          >
                            −
                          </button>
                          <span className="text-on-surface min-w-[22px] text-center text-sm font-extrabold">
                            {qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="bg-primary text-on-primary flex h-8 w-8 items-center justify-center font-bold transition-transform active:scale-110"
                          >
                            +
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Cart Floater */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed right-0 bottom-0 left-0 z-50 p-4 pt-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
          >
            <Link
              href="/app/cart"
              className="flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-4 text-white shadow-2xl shadow-emerald-600/30 transition-transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/20 px-2.5 py-1 text-sm font-black text-white">
                  {cartItemCount}
                </div>
                <div>
                  <p className="text-sm font-bold">View Cart</p>
                  <p className="text-[10px] text-white/70">
                    {cartItemCount} item{cartItemCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black">₹{cartTotal.toFixed(0)}</span>
                <span className="material-symbols-outlined text-white/80">arrow_forward</span>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customization Modal */}
      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          vendor_id={vendorId}
          vendor_name={vendor?.shop_name}
          vendor_type={vendor?.type}
          onClose={() => setCustomizingItem(null)}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}

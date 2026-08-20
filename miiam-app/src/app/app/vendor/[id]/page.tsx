"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useRecentlyViewed } from "@/lib/hooks/useRecentlyViewed";
import CustomizationModal from "@/components/food/CustomizationModal";
import Breadcrumbs from "@/components/Breadcrumbs";
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
  } catch { return true; }
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
          .select("id, shop_name, cuisine, address, phone, image_url, cover_image_url, rating, review_count, delivery_time_min, delivery_time_max, delivery_charge, min_order_amount, opening_hours, description, is_featured, status, type, pincode, city, latitude, longitude")
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
        else if (vendorData?.type === "flower" || vendorData?.type === "flowers") itemsTable = "flower_items";

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

  const categories = ["All", ...new Set(menuItems.map((m) => m.category).filter((c): c is string => Boolean(c)))];

  const currentSlot = getCurrentMenuSlot();

  const filteredItems = menuItems.filter((m) => {
    const categoryMatch = activeCategory === "All" || m.category === activeCategory;
    const vegMatch = vendor?.type === "food" ? (vegFilter === "all" || m.is_veg === (vegFilter === "veg")) : true;
    const slotMatch = !m.menu_slot || m.menu_slot === "all_day" || m.menu_slot === currentSlot;
    return categoryMatch && vegMatch && slotMatch;
  });
  const sortedItems = [...filteredItems].sort((a, b) => ((b.is_featured || b.featured) ? 1 : 0) - ((a.is_featured || a.featured) ? 1 : 0));

  const handleCustomizeItem = (item: MenuItem) => {
    const isFoodVendor = vendor && (vendor.type === "food" || vendor.type === "restaurant" || vendor.cuisine);
    const isGroceryOrOther = vendor && (vendor.type === "grocery" || vendor.type === "flower" || vendor.type === "flowers");
    if (isFoodVendor && !isGroceryOrOther) {
      setCustomizingItem(item);
    } else {
      handleAddToCart(item);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      vendor_id: vendorId,
      vendor_name: vendor?.shop_name ?? "",
    }, item.quantity || 1);
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
      <div className="min-h-screen bg-[#f8f8f8] p-4 space-y-4" aria-label="Loading...">
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
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-on-surface-variant)]">Vendor not found</p>
          <Link href="/app/food" className="text-primary font-bold mt-4 block">Go Back</Link>
        </div>
      </div>
    );
  }

  const cartItemCount = totalItems();
  const cartTotal = totalPrice();

  return (
    <div className="min-h-screen bg-[#f8f8f8] pb-28">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <BlurImage
          src={vendor.banner_url || vendor.cover_image_url || vendor.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"}
          alt={vendor.shop_name}
          fill
          className="w-full h-full"
          sizes="100vw"
          fallbackSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Top Nav */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-12 pb-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <Link
              href="/app/search"
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </Link>
            <Link
              href="/app/cart"
              className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
            >
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
            </Link>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div className="flex-1 min-w-0">
              {vendor.is_featured && (
                <span className="inline-block bg-amber-400 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
                  Featured
                </span>
              )}
              <h1 className="text-white font-black text-2xl leading-tight truncate">{vendor.shop_name}</h1>
              <p className="text-white/70 text-sm mt-1 truncate">{vendor.cuisine} {vendor.address ? `\u2022 ${vendor.address}` : ""}</p>
            </div>
            <div className="flex-shrink-0 ml-3 bg-white/15 backdrop-blur-md rounded-2xl px-4 py-2.5 text-center border border-white/10">
              <p className="text-white font-black text-xl">{avgRating}</p>
              <div className="flex justify-center gap-0.5 mt-0.5">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className={`text-[10px] ${s <= Math.round(parseFloat(avgRating)) ? "text-amber-400" : "text-white/30"}`}>★</span>
                ))}
              </div>
              <p className="text-white/50 text-[9px] mt-0.5">{reviews.length || vendor.review_count || 0} reviews</p>
            </div>
          </div>
        </div>
      </div>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/home' }, { label: vendor.shop_name }]} />

      {/* Info Chips */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isOpen ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-red-500"} ${isOpen ? "animate-pulse" : ""}`} />
            {isOpen ? "Open Now" : "Closed"}
          </span>
          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
          <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {vendor.delivery_time_min || 30}\u2013{vendor.delivery_time_max || 45} min
          </span>
          <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
          <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
            <span className="material-symbols-outlined text-[14px]">delivery_dining</span>
            {vendor.delivery_charge ? `\u20B9${vendor.delivery_charge}` : "Free delivery"}
          </span>
          {vendor.min_order_amount ? (
            <>
              <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
              <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
                <span className="material-symbols-outlined text-[14px]">receipt</span>
                min order: ₹{vendor.min_order_amount}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Closed Banner */}
      {!isOpen && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500">schedule</span>
          <div>
            <p className="font-bold text-red-700 text-sm">Restaurant is currently closed</p>
            <p className="text-red-500 text-xs mt-0.5">You can browse the menu but cannot order right now.</p>
          </div>
        </div>
      )}

      {/* Address & Hours */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">location_on</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{vendor.address || "Address not available"}</p>
            <p className="text-xs text-gray-400 mt-0.5">Live tracking not available</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-amber-600 text-lg">access_time</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{vendor.opening_hours || "9:00 AM - 10:00 PM"}</p>
            <p className="text-xs text-gray-400 mt-0.5">Today</p>
          </div>
        </div>
      </div>

      {/* Reviews Summary */}
      {reviews.length > 0 && (
        <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Reviews</h2>
            <Link href={`/app/vendor/${vendorId}/reviews`} className="text-xs font-bold text-primary">
              See All →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {reviews.slice(0, 4).map((review: Review) => (
              <div key={review.id} className="flex-shrink-0 w-56 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary-container text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {review.profile?.full_name?.[0] || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{review.profile?.full_name || "User"}</p>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((star) => (
                        <span key={star} className={`text-[10px] ${star <= review.rating ? "text-amber-400" : "text-gray-300"}`}>★</span>
                      ))}
                    </div>
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">{review.review_text}</p>
                )}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {review.tags.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Menu Filter */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-lg font-black text-gray-900">Menu</h2>
            <span className="text-xs font-bold text-gray-400">{sortedItems.length} items</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); if (navigator.vibrate) navigator.vibrate(10); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
      <div className="p-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">restaurant_menu</span>
            <p className="text-gray-400 font-medium text-sm">No items found</p>
            <p className="text-gray-300 text-xs mt-1">Try a different category or filter</p>
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
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
              >
                <div className="flex p-3 gap-3">
                  {/* Image */}
                  <div
                    className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 relative cursor-pointer"
                    onClick={() => {
                      const imgs = item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                      if (imgs.length > 1) {
                        setImageIndex((prev) => ({
                          ...prev,
                          [item.id]: ((prev[item.id] || 0) + 1) % imgs.length,
                        }));
                      }
                    }}
                  >
                    {(() => {
                      const imgs = item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                      const idx = imageIndex[item.id] || 0;
                      const src = imgs[idx] || item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                      return (
                        <BlurImage key={idx} src={src} alt={item.name} fill className="w-full h-full" sizes="112px" fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" />
                      );
                    })()}
                    {(() => {
                      const imgs = item.images?.filter(Boolean) || (item.image_url ? [item.image_url] : []);
                      return imgs.length > 1 && (
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                          {imgs.map((_: string, i: number) => (
                            <span key={i} className={`w-1 h-1 rounded-full transition-all ${i === (imageIndex[item.id] || 0) ? "bg-white w-2" : "bg-white/50"}`} />
                          ))}
                        </div>
                      );
                    })()}
                    {/* Discount badge */}
                    {item.discount_percent != null && item.discount_percent > 0 && (
                      <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        -{item.discount_percent}%
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start gap-1.5">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        {item.is_veg !== undefined && (
                          <span className={`w-3 h-3 border-[1.5px] ${item.is_veg ? "border-emerald-600" : "border-red-600"} rounded-sm flex items-center justify-center flex-shrink-0`}>
                            <span className={`w-1 h-1 ${item.is_veg ? "bg-emerald-600" : "bg-red-600"} rounded-full`} />
                          </span>
                        )}
                        <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                      </div>
                      {isFeatured && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">Featured</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-black text-gray-900 text-base">₹{item.price}</span>
                        {item.original_price && (
                          <span className="text-xs text-gray-400 line-through">₹{item.original_price}</span>
                        )}
                      </div>
                      {qty === 0 ? (
                        <button
                          onClick={() => handleCustomizeItem(item)}
                          className="px-5 py-1.5 bg-white text-primary text-xs font-bold rounded-full border-2 border-primary hover:bg-primary hover:text-white active:scale-95 transition-all"
                        >
                          ADD +
                        </button>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="flex items-center bg-primary rounded-full overflow-hidden shadow-md shadow-primary/30"
                        >
                          <button
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="text-white font-bold w-9 h-9 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            −
                          </button>
                          <span className="text-white font-bold text-sm min-w-[20px] text-center">{qty}</span>
                          <button
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="text-white font-bold w-9 h-9 flex items-center justify-center active:scale-110 transition-transform"
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
            className="fixed bottom-0 left-0 right-0 z-50 p-4 pt-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
          >
            <Link
              href="/app/cart"
              className="flex items-center justify-between bg-emerald-600 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-emerald-600/30 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 text-white font-black text-sm px-2.5 py-1 rounded-lg">
                  {cartItemCount}
                </div>
                <div>
                  <p className="font-bold text-sm">View Cart</p>
                  <p className="text-white/70 text-[10px]">{cartItemCount} item{cartItemCount > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">₹{cartTotal.toFixed(0)}</span>
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

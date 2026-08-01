"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { parseIsOpen } from "@/lib/vendor-hours";
import { ProfileSkeleton, MenuItemSkeleton } from "@/components/Skeleton";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";

const MENU_CATEGORIES = ["All", "Starters", "Main Course", "Desserts", "Beverages"];

interface Vendor {
  id: string;
  shop_name: string;
  cuisine: string;
  address: string;
  rating: number;
  review_count: number;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_charge: number;
  description: string;
  opening_hours: string;
  is_featured: boolean;
  cover_image_url: string | null;
  image_url: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string;
  is_veg: boolean;
  is_featured: boolean;
  description: string;
  vendor_id: string;
  is_available: boolean;
  order_count: number;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
}

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const textSize = size === "lg" ? "text-2xl" : "text-base";
  return (
    <div className={`flex items-center gap-0.5 ${textSize}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-amber-400" : "text-[var(--color-outline-variant)]/40"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function AddToCartButton({ item, vendor, compact, isOpen = true }: { item: MenuItem; vendor: Vendor; compact?: boolean; isOpen?: boolean }) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.menu_item_id === item.id);
  const qty = cartItem?.quantity ?? 0;
  const isAvailable = item.is_available !== false;

  const handleAdd = () => {
    if (!isOpen || !isAvailable) return;
    addItem({
      id: item.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      is_veg: item.is_veg,
      vendor_id: vendor.id,
      vendor_name: vendor.shop_name,
    });
    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
  };

  if (!isOpen || !isAvailable) {
    return (
      <span className={compact
        ? "px-2 py-0.5 bg-gray-200 text-gray-500 text-[9px] font-bold rounded-full cursor-not-allowed"
        : "px-4 py-1.5 bg-gray-200 text-gray-500 text-xs font-bold rounded-full cursor-not-allowed"
      }>
        {!isAvailable ? "Sold Out" : "Closed"}
      </span>
    );
  }

  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        className={compact
          ? "px-2 py-0.5 bg-primary text-white text-[9px] font-bold rounded-full hover:bg-primary-dim active:scale-90 transition-all"
          : "px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-dim active:scale-90 transition-all"
        }
      >
        Add +
      </button>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-0.5 bg-primary rounded-full px-0.5 py-0.5">
        <button
          onClick={() => { updateQuantity(item.id, qty - 1); if (navigator.vibrate) navigator.vibrate(10); }}
          className="text-white font-bold w-5 h-5 flex items-center justify-center active:scale-75 transition-transform text-[10px]"
        >
          −
        </button>
        <span className="text-white font-bold text-[9px] min-w-[10px] text-center">{qty}</span>
        <button
          onClick={handleAdd}
          className="text-white font-bold w-5 h-5 flex items-center justify-center active:scale-125 transition-transform text-[10px]"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-primary rounded-full px-1 py-0.5">
      <button
        onClick={() => { updateQuantity(item.id, qty - 1); if (navigator.vibrate) navigator.vibrate(10); }}
        className="text-white font-bold w-7 h-7 flex items-center justify-center active:scale-75 transition-transform text-sm"
      >
        −
      </button>
      <span className="text-white font-bold text-xs min-w-[14px] text-center">{qty}</span>
      <button
        onClick={handleAdd}
        className="text-white font-bold w-7 h-7 flex items-center justify-center active:scale-125 transition-transform text-sm"
      >
        +
      </button>
    </div>
  );
}

function ReviewModal({ vendorId, onClose, onSubmitted }: { vendorId: string; onClose: () => void; onSubmitted: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!rating || !comment.trim() || !name.trim()) {
      setError(t.food.fillAllFields);
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("reviews").insert({
      vendor_id: vendorId,
      user_id: user?.id || null,
      user_name: name,
      rating,
      comment,
    });

    if (insertError) {
      setError(t.food.reviewFailed);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    
    // Show success toast
    import('@/lib/store/toastStore').then(({ useToastStore }) => {
      useToastStore.getState().addToast("Review submitted successfully!", "success");
    });
    
    onSubmitted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-surface-container-lowest w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up" role="dialog" aria-modal="true" aria-labelledby="review-modal-title" onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
        <div className="flex justify-between items-center mb-5">
          <h3 id="review-modal-title" className="text-xl font-black text-on-surface">{t.food.writeReview}</h3>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 bg-surface-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Star selector */}
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{t.food.yourRating}</p>
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="w-11 h-11 flex items-center justify-center text-3xl transition-transform hover:scale-125 active:scale-90"
            >
              <span className={star <= (hoverRating || rating) ? "text-amber-400" : "text-[var(--color-outline-variant)]/40"}>★</span>
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label htmlFor="reviewer-name" className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">{t.food.yourName}</label>
            <input
              id="reviewer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={t.food.namePlaceholder}
            />
          </div>
          <div>
            <label htmlFor="review-comment" className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-1">{t.food.yourReview}</label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder={t.food.reviewPlaceholder}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-xl font-extrabold disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {submitting ? t.food.submitting : t.food.submitReview}
        </button>
      </div>
    </div>
  );
}

function CartFloater() {
  const { items, totalPrice, totalItems } = useCartStore();
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Link
        href="/app/cart"
        className="flex items-center justify-between bg-primary text-white px-5 py-4 rounded-2xl shadow-2xl shadow-primary/40 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <span className="bg-surface-container-lowest text-primary font-black text-xs px-2 py-0.5 rounded-full">
            {totalItems()}
          </span>
          <span className="font-bold">View Cart</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-black text-lg">₹{totalPrice().toFixed(2)}</span>
          <span className="material-symbols-outlined text-white/80">arrow_forward</span>
        </div>
      </Link>
    </div>
  );
}

export default function RestaurantProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const { addItem } = useCartStore();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [menuSort, setMenuSort] = useState<"default" | "price_low" | "price_high" | "rating">("default");
  const [menuSearch, setMenuSearch] = useState("");
  const [scheduleDelivery, setScheduleDelivery] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const { favoriteIds, toggle } = useFavoritesStore();
  const isFavorite = favoriteIds.includes(vendorId);

  const handleToggleFavorite = async () => {
    toggle(vendorId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = isFavorite
          ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("vendor_id", vendorId)
          : await supabase.from("favorites").insert({ user_id: user.id, vendor_id: vendorId });
        if (error) {
          toggle(vendorId);
        }
      }
    } catch {
      toggle(vendorId);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorRes, menuRes, reviewsRes] = await Promise.all([
        supabase.from("vendors").select("id, shop_name, cuisine, address, rating, review_count, delivery_time_min, delivery_time_max, delivery_charge, description, opening_hours, is_featured, cover_image_url, image_url").eq("id", vendorId).single(),
        supabase.from("menu_items").select("id, name, price, category, image_url, description, is_veg, is_featured, vendor_id, is_available, order_count, is_vegan, is_gluten_free").eq("vendor_id", vendorId).order("name"),
        supabase.from("reviews").select("id, user_name, rating, comment, created_at").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      ]);
      if (vendorRes.error) {
        console.error("Vendor query error:", vendorRes.error);
        setError("Failed to load restaurant details.");
      }
      if (menuRes.error) console.error("Menu query error:", menuRes.error);
      if (vendorRes.data) setVendor(vendorRes.data);
      if (menuRes.data) setMenuItems(menuRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
    } catch {
      setError("Failed to load. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [supabase, vendorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 space-y-6">
        <div className="h-48 w-full bg-surface-container-high animate-pulse rounded-2xl" />
        <ProfileSkeleton />
        <div className="space-y-4">
          <MenuItemSkeleton />
          <MenuItemSkeleton />
          <MenuItemSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl text-primary">wifi_off</span>
        </div>
        <p className="text-xl font-black text-on-surface mb-2">{t.common.error}</p>
        <p className="text-on-surface-variant text-sm mb-6 text-center">{error}</p>
        <div className="flex gap-3">
          <button onClick={fetchData} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
            {t.common.retry}
          </button>
          <Link href="/app/food" className="px-6 py-3 bg-surface-container text-primary rounded-xl font-bold hover:opacity-90 transition-opacity">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-2xl font-black text-on-surface mb-2">{t.food.restaurantNotFound}</p>
          <Link href="/app/food" className="text-primary font-bold">{t.food.backToFood}</Link>
        </div>
      </div>
    );
  }

  const coverImage = vendor.cover_image_url || vendor.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
  const isOpen = parseIsOpen(vendor.opening_hours);
  const specials = menuItems.filter((item) => item.is_featured);
  const filteredMenu = menuItems
    .filter((item) => activeCategory === "All" || item.category === activeCategory)
    .filter((item) => !vegOnly || item.is_veg)
    .filter((item) => !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase()) || item.description?.toLowerCase().includes(menuSearch.toLowerCase()))
    .sort((a, b) => {
      switch (menuSort) {
        case "price_low": return a.price - b.price;
        case "price_high": return b.price - a.price;
        case "rating": return (b.order_count || 0) - (a.order_count || 0);
        default: return (b.is_available !== false ? 1 : 0) - (a.is_available !== false ? 1 : 0) || a.name.localeCompare(b.name);
      }
    });
  const availableCategories = MENU_CATEGORIES.filter(
    (cat) => cat === "All" || menuItems.some((item) => item.category === cat)
  );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (vendor.rating || 0).toFixed(1);

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Hero Cover */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        <BlurImage
          src={coverImage}
          alt={vendor.shop_name}
          className="w-full h-full object-cover"
          fill
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Floating top nav */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-12 sm:pt-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-90"
            >
              <span className={`material-symbols-outlined ${isFavorite ? "text-red-500" : "text-white"}`} style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            </button>
            <Link
              href="/app/cart"
              className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined">shopping_cart</span>
            </Link>
          </div>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              {vendor.is_featured && (
                <span className="bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 inline-block">
                  ⭐ Featured
                </span>
              )}
              <h1 className="text-white font-black text-2xl sm:text-3xl leading-tight">{vendor.shop_name}</h1>
              <p className="text-white/80 text-sm mt-1 font-medium">{vendor.cuisine}</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)]/20 backdrop-blur-sm rounded-2xl px-4 py-2 text-center flex-shrink-0">
              <p className="text-white font-black text-xl">{avgRating}</p>
              <div className="flex text-amber-400 text-xs">{'★'.repeat(5)}</div>
              <p className="text-white/70 text-[10px] mt-0.5">{reviews.length || vendor.review_count || 0} reviews</p>
            </div>
          </div>
        </div>
      </div>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/home' }, { label: 'Food', href: '/app/food' }, { label: vendor.shop_name }]} />

      {/* Info Strip */}
      <div className="bg-surface-container-lowest px-5 py-4 flex items-center gap-4 overflow-x-auto no-scrollbar shadow-sm border-b border-outline-variant">
        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
          isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}>
          {isOpen ? "🟢 Open" : "🔴 Closed"}
        </span>
        <div className="w-px h-4 bg-surface-container-high" />
        <div className="flex items-center gap-1.5 text-on-surface-variant flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-base">schedule</span>
          <span className="text-sm font-semibold">{vendor.delivery_time_min && vendor.delivery_time_max ? `${vendor.delivery_time_min}-${vendor.delivery_time_max} min` : "30-40 min"}</span>
        </div>
        <div className="w-px h-4 bg-surface-container-high" />
        <div className="flex items-center gap-1.5 text-on-surface-variant flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-base">delivery_dining</span>
          <span className="text-sm font-semibold">{vendor.delivery_charge ? `₹${vendor.delivery_charge}` : "₹49 delivery"}</span>
        </div>
        <div className="w-px h-4 bg-surface-container-high" />
        <div className="flex items-center gap-1.5 text-on-surface-variant flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-base">storefront</span>
          <span className="text-sm font-semibold">{vendor.opening_hours || "10 AM – 11 PM"}</span>
        </div>
        {vendor.address && (
          <>
            <div className="w-px h-4 bg-surface-container-high" />
            <div className="flex items-center gap-1.5 text-on-surface-variant flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-base">location_on</span>
              <span className="text-sm font-semibold truncate max-w-[160px]">{vendor.address}</span>
            </div>
          </>
        )}
      </div>

      {/* Closed Banner */}
      {!isOpen && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500 text-2xl">schedule</span>
          <div>
            <p className="font-bold text-red-700 text-sm">Restaurant is currently closed</p>
            <p className="text-red-500 text-xs">You can browse the menu but cannot place orders right now.</p>
          </div>
        </div>
      )}

      {/* Schedule Delivery */}
      {isOpen && (
        <div className="mx-4 mt-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">event</span>
              <div>
                <p className="font-bold text-sm text-on-surface">Schedule for Later</p>
                <p className="text-[10px] text-on-surface-variant">Choose a date & time</p>
              </div>
            </div>
            <button
              onClick={() => setScheduleDelivery(!scheduleDelivery)}
              className={`relative w-12 h-7 rounded-full transition-colors ${scheduleDelivery ? "bg-primary" : "bg-surface-container-high"}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${scheduleDelivery ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {scheduleDelivery && (
            <div className="flex gap-2 mt-3">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="flex-1 px-3 py-2 bg-surface-container-low rounded-xl text-sm border border-outline focus:outline-none focus:border-primary"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-28 px-3 py-2 bg-surface-container-low rounded-xl text-sm border border-outline focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {vendor.description && (
        <div className="bg-surface-container-lowest mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-outline-variant">
          <p className="text-sm text-on-surface-variant leading-relaxed">{vendor.description}</p>
        </div>
      )}

      {/* Chef's Specials */}
      {specials.length > 0 && (
        <section className="mt-5 px-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⭐</span>
            <h2 className="text-lg font-black text-on-surface">{t.food.chefSpecials}</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {specials.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-32 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-amber-100">
                <div className="h-20 overflow-hidden bg-surface-container">
                  <BlurImage
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    fill
                    fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                  />
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`w-2.5 h-2.5 border-[1.5px] ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center flex-shrink-0`}>
                      <span className={`w-1 h-1 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`} />
                    </span>
                    <p className="font-bold text-on-surface text-[10px] line-clamp-2">{item.name}</p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-black text-primary text-xs">₹{item.price}</span>
                    <AddToCartButton item={item} vendor={vendor} compact isOpen={isOpen} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Tabs */}
      <section className="mt-5">
        <div className="px-4 mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-on-surface">{t.food.fullMenu}</h2>
          <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer text-xs font-bold transition-all ${
            vegOnly ? "bg-green-600 text-white" : "bg-surface-container-low text-green-700 border border-green-200"
          }`}>
            <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} className="hidden" />
            <span className="w-3 h-3 border-2 border-current rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-current rounded-full" />
            </span>
            {t.food.vegOnly}
          </label>
        </div>

        {/* Search bar */}
        <div className="px-4 mb-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder={t.food.searchMenu}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-lowest border border-outline rounded-xl text-sm focus:outline-none focus:border-primary shadow-sm"
            />
            {menuSearch && (
              <button onClick={() => setMenuSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-2">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); if (navigator.vibrate) navigator.vibrate(10); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-surface-container-lowest text-on-surface-variant border border-outline"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-3">
          {[
            { key: "default" as const, label: "Default", icon: "sort" },
            { key: "price_low" as const, label: "Price: Low", icon: "arrow_upward" },
            { key: "price_high" as const, label: "Price: High", icon: "arrow_downward" },
            { key: "rating" as const, label: "Popular", icon: "trending_up" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMenuSort(opt.key)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all active:scale-95 ${
                menuSort === opt.key
                  ? "bg-surface-container text-on-surface"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-xs">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="px-4 mt-3 space-y-3">
          {filteredMenu.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center text-outline shadow-sm">
              {menuSearch ? `${t.food.noResults} "${menuSearch}"` : t.food.noItemsInCategory}
            </div>
          ) : (
            filteredMenu.map((item) => (
              <div key={item.id} className={`bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex items-center gap-3 transition-opacity ${item.is_available === false ? "opacity-60" : ""}`}>
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 relative">
                  <BlurImage
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    fill
                    fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                  />
                  {item.is_available === false && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-[10px] font-black bg-red-500 px-2 py-0.5 rounded-full">SOLD OUT</span>
                    </div>
                  )}
                  {item.is_featured && (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white text-[9px] font-black text-center py-0.5 tracking-wider">
                      ⭐ {t.food.chefsSpecial}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-3.5 h-3.5 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center flex-shrink-0`}>
                      <span className={`w-1.5 h-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`} />
                    </span>
                    <p className="font-bold text-on-surface text-sm line-clamp-2">{item.name}</p>
                    {item.is_featured && (
                      <span className="text-amber-500 text-xs flex-shrink-0">⭐</span>
                    )}
                    {item.order_count > 0 && (
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        🔥 {item.order_count}+ orders
                      </span>
                    )}
                  </div>
                  {/* Dietary badges */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.is_vegan && (
                      <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">🌱 Vegan</span>
                    )}
                    {item.is_gluten_free && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">🌾 Gluten-Free</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-primary text-base">₹{item.price}</span>
                    <AddToCartButton item={item} vendor={vendor} isOpen={isOpen} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Frequently Ordered Together */}
      {menuItems.filter(i => i.is_available !== false).length > 2 && (
        <section className="mt-6 px-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤝</span>
            <h2 className="text-lg font-black text-on-surface">Frequently Ordered Together</h2>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
            {(() => {
              const popular = [...menuItems]
                .filter(i => i.is_available !== false)
                .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
                .slice(0, 3);
              const totalComboPrice = popular.reduce((sum, i) => sum + i.price, 0);
              return (
                <>
                  <div className="space-y-2">
                    {popular.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                        <span className={`w-3 h-3 border-[1.5px] ${item.is_veg ? "border-green-600" : "border-red-600"} rounded-sm flex items-center justify-center flex-shrink-0`}>
                          <span className={`w-1.5 h-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`} />
                        </span>
                        <p className="font-bold text-sm text-on-surface flex-1 line-clamp-1">{item.name}</p>
                        <span className="text-xs font-bold text-on-surface-variant">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-outline-variant flex items-center justify-between">
                    <div>
                      <p className="text-xs text-on-surface-variant">Order all together</p>
                      <p className="font-black text-primary">₹{totalComboPrice}</p>
                    </div>
                    <button
                      onClick={() => {
                        popular.forEach((item) => {
                          addItem({
                            id: item.id,
                            menu_item_id: item.id,
                            name: item.name,
                            price: item.price,
                            image_url: item.image_url,
                            is_veg: item.is_veg,
                            vendor_id: vendor.id,
                            vendor_name: vendor.shop_name,
                          });
                        });
                        if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
                      }}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full active:scale-95 transition-transform"
                    >
                      Add All
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-on-surface">{t.food.reviews}</h2>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-sm font-bold text-primary bg-surface px-3 py-1.5 rounded-lg hover:bg-[#ffe4e7] transition-colors active:scale-95"
          >
            + {t.food.writeReview}
          </button>
        </div>

        {reviews.length > 0 ? (
          <>
            {/* Rating Summary Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm mb-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-black text-on-surface">{avgRating}</p>
                  <StarRating rating={parseFloat(avgRating)} size="sm" />
                  <p className="text-xs text-on-surface-variant mt-1">{reviews.length} {t.food.reviewsCount}</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingBreakdown.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-on-surface-variant w-3">{star}</span>
                      <span className="text-amber-400 text-xs">★</span>
                      <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-outline w-5 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Review cards */}
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {review.user_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-on-surface text-sm truncate">{review.user_name || "Anonymous"}</p>
                        <p className="text-[10px] text-outline flex-shrink-0">
                          {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      {review.comment && (
                        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm text-center">
            <p className="text-3xl mb-2">💬</p>
            <p className="font-bold text-on-surface mb-1">{t.food.noReviews}</p>
            <p className="text-sm text-outline mb-4">{t.food.beFirst}</p>
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t.food.writeReview}
            </button>
          </div>
        )}
      </section>

      <CartFloater />

      {showReviewModal && (
        <ReviewModal
          vendorId={vendorId}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={fetchData}
        />
      )}
    </div>
  );
}

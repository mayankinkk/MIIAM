"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useFavoritesStore } from "@/lib/store/favoritesStore";
import { useToastStore } from "@/lib/store/toastStore";
import logger from "@/lib/logger";
import { parseIsOpen } from "@/lib/vendor-hours";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { ProfileSkeleton, MenuItemSkeleton } from "@/components/Skeleton";
import BlurImage from "@/components/BlurImage";
import ClosingCountdown from "@/components/ClosingCountdown";

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
          className={
            star <= Math.round(rating) ? "text-amber-400" : "text-[var(--color-outline-variant)]/40"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function AddToCartButton({
  item,
  vendor,
  compact,
  isOpen = true,
}: {
  item: MenuItem;
  vendor: Vendor;
  compact?: boolean;
  isOpen?: boolean;
}) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.menu_item_id === item.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    if (!isOpen) return;
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

  if (!isOpen) {
    return (
      <span
        className={
          compact
            ? "cursor-not-allowed rounded-full bg-gray-200 px-2 py-0.5 text-[9px] font-bold text-gray-500"
            : "cursor-not-allowed rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-500"
        }
      >
        Closed
      </span>
    );
  }

  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        className={
          compact
            ? "bg-primary text-on-primary border-primary h-6 min-w-[44px] rounded-md border px-2 text-[9px] font-extrabold transition-all active:scale-95"
            : "bg-primary text-on-primary border-primary h-8 min-w-[52px] rounded-lg border px-3 text-xs font-extrabold transition-all active:scale-95"
        }
      >
        ADD +
      </button>
    );
  }

  if (compact) {
    return (
      <div className="bg-surface-container-lowest border-primary flex items-center overflow-hidden rounded-md border">
        <button
          onClick={() => {
            updateQuantity(item.id, qty - 1);
            if (navigator.vibrate) navigator.vibrate(10);
          }}
          className="bg-primary text-on-primary flex h-5 w-5 items-center justify-center text-[10px] font-bold transition-transform active:scale-75"
          aria-label={`Decrease quantity of ${item.name}`}
        >
          −
        </button>
        <span className="text-on-surface min-w-[12px] text-center text-[9px] font-extrabold">
          {qty}
        </span>
        <button
          onClick={handleAdd}
          className="bg-primary text-on-primary flex h-5 w-5 items-center justify-center text-[10px] font-bold transition-transform active:scale-125"
          aria-label={`Increase quantity of ${item.name}`}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border-primary flex items-center overflow-hidden rounded-lg border">
      <button
        onClick={() => {
          updateQuantity(item.id, qty - 1);
          if (navigator.vibrate) navigator.vibrate(10);
        }}
        className="bg-primary text-on-primary flex h-7 w-7 items-center justify-center text-sm font-bold transition-transform hover:brightness-95 active:scale-75"
        aria-label={`Decrease quantity of ${item.name}`}
      >
        −
      </button>
      <span className="text-on-surface min-w-[16px] text-center text-xs font-extrabold">{qty}</span>
      <button
        onClick={handleAdd}
        className="bg-primary text-on-primary flex h-7 w-7 items-center justify-center text-sm font-bold transition-transform hover:brightness-95 active:scale-125"
        aria-label={`Increase quantity of ${item.name}`}
      >
        +
      </button>
    </div>
  );
}

function ReviewModal({
  vendorId,
  onClose,
  onSubmitted,
}: {
  vendorId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please log in to submit a review");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("reviews").insert({
      vendor_id: vendorId,
      user_id: user.id,
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

    useToastStore.getState().addToast("Review submitted successfully!", "success");

    onSubmitted();
    onClose();
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div
        className="bg-surface-container-lowest animate-slide-up w-full rounded-t-3xl p-6 sm:max-w-md sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 id="review-modal-title" className="text-on-surface text-xl font-black">
            {t.food.writeReview}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="bg-surface-container flex h-11 w-11 items-center justify-center rounded-full"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Star selector */}
        <p className="text-on-surface-variant mb-2 text-xs font-bold tracking-widest uppercase">
          {t.food.yourRating}
        </p>
        <div className="mb-5 flex gap-2" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="flex h-11 w-11 items-center justify-center text-3xl transition-transform hover:scale-125 active:scale-90"
            >
              <span
                className={
                  star <= (hoverRating || rating)
                    ? "text-amber-400"
                    : "text-[var(--color-outline-variant)]/40"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>

        <div className="mb-5 space-y-3">
          <div>
            <label
              htmlFor="reviewer-name"
              className="text-on-surface-variant mb-1 block text-xs font-bold tracking-widest uppercase"
            >
              {t.food.yourName}
            </label>
            <input
              id="reviewer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-surface-container-low focus:ring-primary/20 w-full rounded-xl px-4 py-3 text-sm focus:ring-2 focus:outline-none"
              placeholder={t.food.namePlaceholder}
            />
          </div>
          <div>
            <label
              htmlFor="review-comment"
              className="text-on-surface-variant mb-1 block text-xs font-bold tracking-widest uppercase"
            >
              {t.food.yourReview}
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="bg-surface-container-low focus:ring-primary/20 w-full resize-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:outline-none"
              placeholder={t.food.reviewPlaceholder}
            />
          </div>
        </div>

        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary text-on-primary w-full rounded-xl py-4 font-extrabold transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
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
    <div
      className="fixed right-4 bottom-[80px] left-4 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link
        href="/app/cart"
        className="bg-primary text-on-primary shadow-primary/40 flex items-center justify-between rounded-2xl px-5 py-4 shadow-2xl transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <span className="bg-surface-container-lowest text-accent rounded-full px-2 py-0.5 text-xs font-black">
            {totalItems()}
          </span>
          <span className="font-bold">View Cart</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black">₹{totalPrice().toFixed(2)}</span>
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
  const [menuSort, setMenuSort] = useState<"default" | "price_low" | "price_high" | "rating">(
    "default"
  );
  const [menuSearch, setMenuSearch] = useState("");
  const [scheduleDelivery, setScheduleDelivery] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const { favoriteIds, toggle } = useFavoritesStore();
  const isFavorite = favoriteIds.includes(vendorId);

  const coverImage =
    vendor?.cover_image_url ||
    vendor?.image_url ||
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
  const isOpen = vendor ? parseIsOpen(vendor.opening_hours) : false;
  const specials = menuItems.filter((item) => item.is_featured);
  const filteredMenu = menuItems
    .filter((item) => activeCategory === "All" || item.category === activeCategory)
    .filter((item) => !vegOnly || item.is_veg)
    .filter(
      (item) =>
        !menuSearch ||
        item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(menuSearch.toLowerCase())
    )
    .sort((a, b) => {
      switch (menuSort) {
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "rating":
          return (b.order_count || 0) - (a.order_count || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });
  const availableCategories = MENU_CATEGORIES.filter(
    (cat) => cat === "All" || menuItems.some((item) => item.category === cat)
  );

  const {
    visibleItems: visibleMenuItems,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll({ items: filteredMenu, pageSize: 10 });

  const handleToggleFavorite = async () => {
    toggle(vendorId);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = isFavorite
          ? await supabase
              .from("favorites")
              .delete()
              .eq("user_id", user.id)
              .eq("vendor_id", vendorId)
          : await supabase.from("favorites").insert({ user_id: user.id, vendor_id: vendorId });
        if (error) {
          toggle(vendorId);
          useToastStore.getState().addToast(t.common.error, "error");
        }
      }
    } catch {
      toggle(vendorId);
      useToastStore.getState().addToast(t.common.error, "error");
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorRes, menuRes, reviewsRes] = await Promise.all([
        supabase
          .from("vendors")
          .select(
            "id, shop_name, cuisine, address, rating, review_count, delivery_time_min, delivery_time_max, delivery_charge, description, opening_hours, is_featured, cover_image_url, image_url"
          )
          .eq("id", vendorId)
          .single(),
        supabase
          .from("menu_items")
          .select(
            "id, name, price, category, image_url, description, is_veg, is_featured, vendor_id, is_available"
          )
          .eq("vendor_id", vendorId)
          .order("name"),
        supabase
          .from("reviews")
          .select("id, user_name, rating, comment, created_at")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false }),
      ]);
      if (vendorRes.error) {
        logger.error({ err: vendorRes.error }, "Vendor query error");
        setError("Failed to load restaurant details.");
      }
      if (menuRes.error) {
        logger.error({ err: menuRes.error }, "Menu query error");
        setError("Failed to load menu. Please try again.");
      }
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
      <div className="bg-surface min-h-screen space-y-6 p-6">
        <div className="bg-surface-container-high h-48 w-full animate-pulse rounded-2xl" />
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
      <div className="bg-surface flex min-h-screen flex-col items-center justify-center p-6">
        <div className="bg-surface-container mb-4 flex h-20 w-20 items-center justify-center rounded-full">
          <span className="material-symbols-outlined text-accent text-4xl">wifi_off</span>
        </div>
        <p className="text-on-surface mb-2 text-xl font-black">{t.common.error}</p>
        <p className="text-on-surface-variant mb-6 text-center text-sm">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="bg-primary text-on-primary rounded-xl px-6 py-3 font-bold transition-opacity hover:opacity-90"
          >
            {t.common.retry}
          </button>
          <Link
            href="/app/food"
            className="bg-surface-container text-accent rounded-xl px-6 py-3 font-bold transition-opacity hover:opacity-90"
          >
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-surface flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-on-surface mb-2 text-2xl font-black">{t.food.restaurantNotFound}</p>
          <Link href="/app/food" className="text-accent font-bold">
            {t.food.backToFood}
          </Link>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (vendor.rating || 0).toFixed(1);

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length
      ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100)
      : 0,
  }));

  return (
    <div className="bg-surface min-h-screen pb-44 md:pb-32">
      {/* Sticky header — back / shop + cuisine / favorite + cart */}
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
            <p className="text-on-surface-variant truncate text-[11px]">{vendor.cuisine}</p>
          </div>
          <button
            onClick={handleToggleFavorite}
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <span
              className={`material-symbols-outlined ${isFavorite ? "text-red-500" : "text-on-surface"}`}
              style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
          <Link
            href="/app/cart"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
            aria-label="Go to cart"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
        </div>
      </header>

      {/* Cover image — flat, no overlay */}
      <div className="bg-surface-container relative h-44 overflow-hidden sm:h-56">
        <BlurImage
          src={coverImage}
          alt={vendor.shop_name}
          className="h-full w-full scale-105 object-cover"
          fill
        />
      </div>

      {/* Title + rating */}
      <section className="border-outline-variant/60 border-b px-4 py-4">
        {vendor.is_featured && (
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black tracking-wider text-amber-900 uppercase">
            <span className="text-xs">⭐</span> Featured
          </span>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-on-surface text-xl leading-tight font-black">{vendor.shop_name}</h1>
            <p className="text-on-surface-variant mt-1 text-sm font-medium">{vendor.cuisine}</p>
          </div>
          <span className="border-outline-variant/60 inline-flex flex-shrink-0 flex-col items-center rounded-lg border bg-white px-2.5 py-1.5 shadow-sm">
            <span className="text-accent text-xs font-black">{avgRating} ★</span>
            <span className="text-on-surface-variant mt-0.5 text-[10px]">
              {reviews.length || vendor.review_count || 0} reviews
            </span>
          </span>
        </div>
      </section>

      {/* Info Strip */}
      <div className="bg-surface-container-lowest no-scrollbar border-outline-variant/60 flex items-center gap-4 overflow-x-auto border-b px-4 py-4">
        <span
          className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-black tracking-wider uppercase ${
            isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {isOpen ? "🟢 Open" : "🔴 Closed"}
        </span>
        <div className="bg-surface-container-high h-4 w-px" />
        <div className="text-on-surface-variant flex flex-shrink-0 items-center gap-1.5">
          <span className="material-symbols-outlined text-accent text-base">schedule</span>
          <span className="text-sm font-semibold">
            {vendor.delivery_time_min && vendor.delivery_time_max
              ? `${vendor.delivery_time_min}-${vendor.delivery_time_max} min`
              : "30-40 min"}
          </span>
        </div>
        <div className="bg-surface-container-high h-4 w-px" />
        <div className="text-on-surface-variant flex flex-shrink-0 items-center gap-1.5">
          <span className="material-symbols-outlined text-accent text-base">delivery_dining</span>
          <span className="text-sm font-semibold">
            {vendor.delivery_charge ? `₹${vendor.delivery_charge}` : "₹49 delivery"}
          </span>
        </div>
        <div className="bg-surface-container-high h-4 w-px" />
        <div className="text-on-surface-variant flex flex-shrink-0 items-center gap-1.5">
          <span className="material-symbols-outlined text-accent text-base">storefront</span>
          <span className="text-sm font-semibold">{vendor.opening_hours || "10 AM – 11 PM"}</span>
          <ClosingCountdown openingHours={vendor.opening_hours} />
        </div>
        {vendor.address && (
          <>
            <div className="bg-surface-container-high h-4 w-px" />
            <div className="text-on-surface-variant flex flex-shrink-0 items-center gap-1.5">
              <span className="material-symbols-outlined text-accent text-base">location_on</span>
              <span className="max-w-[160px] truncate text-sm font-semibold">{vendor.address}</span>
            </div>
          </>
        )}
      </div>

      {/* Closed Banner */}
      {!isOpen && (
        <div className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-3">
          <span className="material-symbols-outlined text-2xl text-red-500">schedule</span>
          <div>
            <p className="text-sm font-bold text-red-700">Restaurant is currently closed</p>
            <p className="text-xs text-red-500">
              You can browse the menu but cannot place orders right now.
            </p>
          </div>
        </div>
      )}

      {/* Schedule Delivery */}
      {isOpen && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent text-xl">event</span>
              <div>
                <p className="text-on-surface text-sm font-bold">Schedule for Later</p>
                <p className="text-on-surface-variant text-[10px]">Choose a date & time</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={scheduleDelivery}
              aria-label="Schedule delivery for later"
              onClick={() => setScheduleDelivery(!scheduleDelivery)}
              className={`relative h-7 w-12 rounded-full transition-colors ${scheduleDelivery ? "bg-primary" : "bg-surface-container-high"}`}
            >
              <div
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${scheduleDelivery ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
          {scheduleDelivery && (
            <div className="mt-3 flex gap-2">
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-surface-container-low border-outline focus:border-primary flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none"
              />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="bg-surface-container-low border-outline focus:border-primary w-28 rounded-xl border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          )}
        </section>
      )}

      {/* Description */}
      {vendor.description && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <p className="text-on-surface-variant text-sm leading-relaxed">{vendor.description}</p>
        </section>
      )}

      {/* Chef's Specials */}
      {specials.length > 0 && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <h2 className="text-on-surface text-[15px] font-bold">{t.food.chefSpecials}</h2>
          </div>
          <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {specials.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest w-32 flex-shrink-0 overflow-hidden rounded-2xl border border-amber-100 shadow-sm"
              >
                <div className="bg-surface-container h-20 overflow-hidden">
                  <BlurImage
                    src={
                      item.image_url ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                    }
                    alt={item.name}
                    className="h-full w-full object-cover"
                    fill
                    fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                  />
                </div>
                <div className="p-2">
                  <div className="mb-0.5 flex items-center gap-1">
                    <span
                      className={`h-2.5 w-2.5 border-[1.5px] ${item.is_veg ? "border-green-600" : "border-red-600"} flex flex-shrink-0 items-center justify-center rounded-sm`}
                    >
                      <span
                        className={`h-1 w-1 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`}
                      />
                    </span>
                    <p className="text-on-surface line-clamp-2 text-[10px] font-bold">
                      {item.name}
                    </p>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between">
                    <span className="text-on-surface text-xs font-black">₹{item.price}</span>
                    <AddToCartButton item={item} vendor={vendor} compact isOpen={isOpen} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Menu Tabs */}
      <section className="border-outline-variant/60 border-b">
        <div className="mb-3 flex items-center justify-between gap-3 px-4 pt-4">
          <h2 className="text-on-surface text-[15px] font-bold">{t.food.fullMenu}</h2>
          <label
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              vegOnly
                ? "bg-green-600 text-white"
                : "bg-surface-container-low border border-green-200 text-green-700"
            }`}
          >
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="sr-only"
              aria-label={t.food.vegOnly}
            />
            <span className="flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-sm border-2 border-current">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            {t.food.vegOnly}
          </label>
        </div>

        {/* Search bar */}
        <div className="mb-3 px-4">
          <div className="relative">
            <span className="material-symbols-outlined text-outline absolute top-1/2 left-3 -translate-y-1/2 text-base">
              search
            </span>
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder={t.food.searchMenu}
              className="bg-surface-container-lowest border-outline focus:border-primary w-full rounded-xl border py-2.5 pr-4 pl-9 text-sm shadow-sm focus:outline-none"
            />
            {menuSearch && (
              <button
                onClick={() => setMenuSearch("")}
                className="text-outline hover:text-on-surface-variant absolute top-1/2 right-3 -translate-y-1/2"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="bg-surface sticky top-14 z-20 -mx-4 px-4 pt-2 pb-1">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
                  activeCategory === cat
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-lowest text-on-surface-variant border-outline border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort tabs */}
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 pb-3">
          {[
            { key: "default" as const, label: "Default", icon: "sort" },
            { key: "price_low" as const, label: "Price: Low", icon: "arrow_upward" },
            { key: "price_high" as const, label: "Price: High", icon: "arrow_downward" },
            { key: "rating" as const, label: "Popular", icon: "trending_up" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMenuSort(opt.key)}
              className={`flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${
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
        <div className="px-4">
          {filteredMenu.length === 0 ? (
            <div className="bg-surface-container-lowest text-outline my-4 rounded-2xl p-8 text-center shadow-sm">
              {menuSearch ? `${t.food.noResults} "${menuSearch}"` : t.food.noItemsInCategory}
            </div>
          ) : (
            <>
              {visibleMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="border-outline-variant/40 flex items-center gap-3 border-b py-3 last:border-0"
                >
                  <div className="bg-surface-container relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                    <BlurImage
                      src={
                        item.image_url ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                      }
                      alt={item.name}
                      className="h-full w-full object-cover"
                      fill
                      fallbackSrc="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"
                    />
                    {item.is_featured && (
                      <span className="absolute right-0 bottom-0 left-0 bg-black/50 py-0.5 text-center text-[9px] font-black tracking-wider text-white backdrop-blur-sm">
                        ⭐ {t.food.chefsSpecial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span
                        className={`h-3.5 w-3.5 border-2 ${item.is_veg ? "border-green-600" : "border-red-600"} flex flex-shrink-0 items-center justify-center rounded-sm`}
                      >
                        <span
                          className={`h-1.5 w-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`}
                        />
                      </span>
                      <p className="text-on-surface line-clamp-2 text-sm font-bold">{item.name}</p>
                      {item.is_featured && (
                        <span className="flex-shrink-0 text-xs text-amber-500">⭐</span>
                      )}
                      {item.order_count > 0 && (
                        <span className="flex-shrink-0 rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600">
                          🔥 {item.order_count}+ orders
                        </span>
                      )}
                    </div>
                    {/* Dietary badges */}
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {item.is_vegan && (
                        <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                          🌱 Vegan
                        </span>
                      )}
                      {item.is_gluten_free && (
                        <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                          🌾 Gluten-Free
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-on-surface-variant mt-0.5 line-clamp-1 text-xs">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-on-surface text-base font-black">₹{item.price}</span>
                      <AddToCartButton item={item} vendor={vendor} isOpen={isOpen} />
                    </div>
                  </div>
                </div>
              ))}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-4">
                  <div className="border-primary/30 border-t-primary h-6 w-6 animate-spin rounded-full border-2" />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Frequently Ordered Together */}
      {menuItems.length > 2 && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">🤝</span>
            <h2 className="text-on-surface text-[15px] font-bold">Frequently Ordered Together</h2>
          </div>
          <div className="border-outline-variant/40 rounded-xl border p-4">
            {(() => {
              const popular = [...menuItems]
                .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
                .slice(0, 3);
              const totalComboPrice = popular.reduce((sum, i) => sum + i.price, 0);
              return (
                <>
                  <div className="space-y-2">
                    {popular.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <span className="bg-primary/10 text-accent flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black">
                          {idx + 1}
                        </span>
                        <span
                          className={`h-3 w-3 border-[1.5px] ${item.is_veg ? "border-green-600" : "border-red-600"} flex flex-shrink-0 items-center justify-center rounded-sm`}
                        >
                          <span
                            className={`h-1.5 w-1.5 ${item.is_veg ? "bg-green-600" : "bg-red-600"} rounded-full`}
                          />
                        </span>
                        <p className="text-on-surface line-clamp-1 flex-1 text-sm font-bold">
                          {item.name}
                        </p>
                        <span className="text-on-surface-variant text-xs font-bold">
                          ₹{item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-outline-variant mt-3 flex items-center justify-between border-t pt-3">
                    <div>
                      <p className="text-on-surface-variant text-xs">Order all together</p>
                      <p className="text-on-surface font-black">₹{totalComboPrice}</p>
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
                      className="bg-primary text-on-primary rounded-full px-4 py-2 text-xs font-bold transition-transform active:scale-95"
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
      <section className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-on-surface text-[15px] font-bold">{t.food.reviews}</h2>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-accent bg-surface rounded-lg px-3 py-1.5 text-sm font-bold transition-colors hover:bg-[#fff7e0] active:scale-95"
          >
            + {t.food.writeReview}
          </button>
        </div>

        {reviews.length > 0 ? (
          <>
            {/* Rating Summary */}
            <div className="mb-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-on-surface text-5xl font-black">{avgRating}</p>
                  <StarRating rating={parseFloat(avgRating)} size="sm" />
                  <p className="text-on-surface-variant mt-1 text-xs">
                    {reviews.length} {t.food.reviewsCount}
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingBreakdown.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-on-surface-variant w-3 text-xs">{star}</span>
                      <span className="text-xs text-amber-400">★</span>
                      <div className="bg-surface-container h-1.5 flex-1 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-outline w-5 text-right text-xs">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Review list */}
            <div>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-outline-variant/40 border-b py-3 last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="from-primary to-primary-container text-on-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-black">
                      {review.user_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-on-surface truncate text-sm font-bold">
                          {review.user_name || "Anonymous"}
                        </p>
                        <p className="text-outline flex-shrink-0 text-[10px]">
                          {new Date(review.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      {review.comment && (
                        <p className="text-on-surface-variant mt-2 text-sm leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <p className="mb-2 text-3xl">💬</p>
            <p className="text-on-surface mb-1 font-bold">{t.food.noReviews}</p>
            <p className="text-outline mb-4 text-sm">{t.food.beFirst}</p>
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-primary text-on-primary rounded-lg px-6 py-2.5 text-sm font-bold transition-all hover:brightness-95 active:scale-[0.98]"
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

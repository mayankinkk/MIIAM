"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-urls";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import logger from "@/lib/logger";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  category: string;
}

interface Combo {
  id: string;
  name: string;
  description: string;
  image_url: string;
  original_price: number;
  combo_price: number;
  items: string[];
  vendor_id: string;
  category: string;
}

interface Vendor {
  id: string;
  shop_name: string;
  cuisine: string;
  address: string;
  image_url: string | null;
  rating: number | null;
  rating_count: number | null;
}

export default function ComboDetailPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const comboId = params.id as string;
  const { addItem, items, updateQuantity } = useCartStore();
  const { addToast } = useToastStore();
  const { confirm } = useConfirm();

  const heroRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [flyingItems, setFlyingItems] = useState<
    Array<{ id: number; x: number; y: number; img: string }>
  >([]);
  const [confetti, setConfetti] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      color: string;
      rotation: number;
      delay: number;
      size: number;
    }>
  >([]);
  const flyIdRef = useRef(0);
  const confettiIdRef = useRef(0);

  const cartItemId = `combo-${comboId}`;
  const cartItem = items.find((i) => i.id === cartItemId || i.menu_item_id === cartItemId);
  const qty = cartItem?.quantity ?? 0;
  const cartVendorId = items.length > 0 ? items[0].vendor_id : null;

  const [combo, setCombo] = useState<Combo | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [similarCombos, setSimilarCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCombo() {
      setLoading(true);

      const { data: comboData, error: comboError } = await supabase
        .from("combos")
        .select("*")
        .eq("id", comboId)
        .single();

      if (comboError || !comboData) {
        logger.error({ err: comboError }, "Combo fetch failed");
        setError(comboError?.message || "Combo not found.");
        setLoading(false);
        return;
      }

      setCombo(comboData);

      if (comboData.vendor_id) {
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("id, shop_name, cuisine, address, image_url, rating, rating_count")
          .eq("id", comboData.vendor_id)
          .single();

        if (vendorData) setVendor(vendorData);

        const [reviewsRes, menuRes, similarRes] = await Promise.all([
          supabase
            .from("reviews")
            .select("id, user_id, rating, comment, created_at")
            .eq("vendor_id", comboData.vendor_id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("menu_items")
            .select("id, name, price, image_url, is_veg, category")
            .eq("vendor_id", comboData.vendor_id)
            .eq("is_available", true)
            .order("name")
            .limit(10),
          comboData.category
            ? supabase
                .from("combos")
                .select(
                  "id, name, description, image_url, original_price, combo_price, items, vendor_id, category"
                )
                .eq("is_active", true)
                .eq("category", comboData.category)
                .neq("id", comboId)
                .limit(6)
            : { data: [] },
        ]);

        if (reviewsRes.data) setReviews(reviewsRes.data);
        if (menuRes.data) setMenuItems(menuRes.data);
        if (similarRes.data) setSimilarCombos(similarRes.data);
      }

      setLoading(false);
    }
    fetchCombo();
  }, [supabase, comboId]);

  const triggerFlyAnimation = useCallback(() => {
    if (!heroRef.current || !addBtnRef.current) return;
    const heroRect = heroRef.current.getBoundingClientRect();
    const btnRect = addBtnRef.current.getBoundingClientRect();
    const id = ++flyIdRef.current;
    const startX = heroRect.left + heroRect.width / 2 - 24;
    const startY = heroRect.top + heroRect.height / 2 - 24;
    setFlyingItems((prev) => [...prev, { id, x: startX, y: startY, img: combo?.image_url || "" }]);
    requestAnimationFrame(() => {
      const endX = btnRect.left + btnRect.width / 2 - 24;
      const endY = btnRect.top + btnRect.height / 2 - 24;
      setFlyingItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, x: endX, y: endY } : item))
      );
    });
    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== id));
    }, 700);
  }, [combo?.image_url]);

  const triggerConfetti = useCallback(() => {
    if (!addBtnRef.current) return;
    const btnRect = addBtnRef.current.getBoundingClientRect();
    const cx = btnRect.left + btnRect.width / 2;
    const cy = btnRect.top;
    const colors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#3b82f6",
      "#a855f7",
      "#ec4899",
      "#f43f5e",
    ];
    const particles = Array.from({ length: 30 }, () => ({
      id: ++confettiIdRef.current,
      x: cx + (Math.random() - 0.5) * 120,
      y: cy,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      size: 6 + Math.random() * 6,
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 1200);
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!combo) return;
    const vendorId = vendor?.id || combo.vendor_id;
    const vendorName = vendor?.shop_name || "Combo";
    const isDifferentVendor = vendorId && cartVendorId && cartVendorId !== vendorId;

    if (isDifferentVendor) {
      const confirmed = await confirm({
        title: "Change Restaurant?",
        message: "Your cart has items from another restaurant. Add this combo and clear the cart?",
        variant: "danger",
      });
      if (!confirmed) return;
      items.forEach((item) => useCartStore.getState().removeItem(item.id));
    }

    triggerFlyAnimation();
    triggerConfetti();

    setTimeout(() => {
      addItem(
        {
          id: `combo-${combo.id}`,
          menu_item_id: `combo-${combo.id}`,
          vendor_id: vendorId || "",
          vendor_name: vendorName,
          name: combo.name,
          price: combo.combo_price,
          image_url: combo.image_url,
          is_veg: true,
        },
        1
      );
    }, 400);
  }, [combo, vendor, cartVendorId, items, addItem, confirm, triggerFlyAnimation, triggerConfetti]);

  const handleIncrement = useCallback(() => {
    if (!combo) return;
    addItem(
      {
        id: `combo-${combo.id}`,
        menu_item_id: `combo-${combo.id}`,
        vendor_id: vendor?.id || combo.vendor_id,
        vendor_name: vendor?.shop_name || "Combo",
        name: combo.name,
        price: combo.combo_price,
        image_url: combo.image_url,
        is_veg: true,
      },
      1
    );
  }, [combo, vendor, addItem]);

  if (loading) {
    return (
      <div className="bg-surface min-h-screen">
        <div className="border-outline-variant/60 flex h-14 items-center gap-3 border-b px-3">
          <div className="bg-surface-container-high h-10 w-10 animate-pulse rounded-full" />
          <div className="space-y-1.5">
            <div className="bg-surface-container-high h-3 w-28 animate-pulse rounded" />
            <div className="bg-surface-container-high h-2.5 w-40 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-surface-container-high aspect-square max-h-[70vh] w-full animate-pulse" />
        <div className="border-outline-variant/60 space-y-3 border-b px-4 py-4">
          <div className="bg-surface-container-high h-5 w-3/4 animate-pulse rounded" />
          <div className="bg-surface-container-high h-3 w-1/2 animate-pulse rounded" />
        </div>
        <div className="space-y-2.5 px-4 py-4">
          <div className="bg-surface-container-high h-4 w-1/3 animate-pulse rounded" />
          <div className="bg-surface-container-high h-3 w-2/3 animate-pulse rounded" />
          <div className="bg-surface-container-high h-3 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="bg-surface flex min-h-screen flex-col items-center justify-center p-6">
        <p className="text-on-surface mb-2 text-xl font-black">Combo not found</p>
        <Link href="/app/home" className="text-accent font-bold">
          Go back
        </Link>
      </div>
    );
  }

  const savings = combo.original_price - combo.combo_price;
  const discountPct = Math.round((savings / combo.original_price) * 100);

  return (
    <div className="bg-surface min-h-screen pb-44 md:pb-32">
      {/* Flying item animations */}
      {flyingItems.map((item) => (
        <div
          key={item.id}
          className="pointer-events-none fixed z-[9999] transition-all duration-700 ease-in-out"
          style={{
            left: item.x,
            top: item.y,
            width: 48,
            height: 48,
            opacity: flyingItems.find(
              (f) => f.id === item.id && item.y !== flyingItems.find((f2) => f2.id === item.id)?.y
            )
              ? 0.3
              : 1,
            transform:
              item.y !== (heroRef.current?.getBoundingClientRect().top ?? 0)
                ? "scale(0.2)"
                : "scale(1)",
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          <Image
            src={item.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80"}
            alt=""
            width={48}
            height={48}
            className="h-full w-full object-cover shadow-lg"
            unoptimized={!canOptimizeImage(item.img || "")}
          />
        </div>
      ))}

      {/* Confetti */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall 1s ${p.delay}s ease-out forwards`,
          }}
        />
      ))}

      {/* Sticky header — back / vendor + address / share */}
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
            <p className="text-on-surface truncate text-[13px] font-bold">
              {vendor?.shop_name || combo.name}
            </p>
            <p className="text-on-surface-variant truncate text-[11px]">
              {vendor?.address || vendor?.cuisine || combo.category}
            </p>
          </div>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: combo.name,
                  text: `Check out ${combo.name} - ₹${combo.combo_price} (${discountPct}% OFF)`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                addToast("Link copied to clipboard", "success");
              }
            }}
            aria-label="Share combo"
            className="text-on-surface hover:bg-surface-container-high flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      {/* Full-bleed product image with overlay chips */}
      <div
        ref={heroRef}
        className="bg-surface-container relative aspect-square max-h-[70vh] w-full overflow-hidden"
      >
        {combo.image_url ? (
          <Image
            src={combo.image_url}
            alt={combo.name}
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized={!canOptimizeImage(combo.image_url)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-6xl">
            🎉
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          {discountPct > 0 && (
            <span className="bg-status-error rounded-full px-2.5 py-1 text-xs font-black text-white shadow-md">
              {discountPct}% OFF
            </span>
          )}
          {vendor?.rating != null && (
            <span className="text-accent flex items-center gap-0.5 rounded-full bg-white px-2 py-1 text-xs font-bold shadow-md">
              <span className="material-symbols-outlined text-sm">star</span>
              {vendor.rating}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <section className="border-outline-variant/60 border-b px-4 py-4">
        <div className="flex items-start gap-2">
          <span
            aria-label="Veg"
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 border-green-600"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
          </span>
          <h1 className="text-on-surface text-[17px] leading-snug font-bold">{combo.name}</h1>
        </div>
        {vendor && (
          <Link
            href={`/app/food/${vendor.id}`}
            className="text-accent mt-1.5 inline-block text-sm font-medium hover:underline"
          >
            {vendor.shop_name} · {vendor.cuisine}
          </Link>
        )}
      </section>

      {/* Description */}
      {combo.description && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <p className="text-on-surface-variant text-sm leading-relaxed">{combo.description}</p>
        </section>
      )}

      {/* Items included */}
      {combo.items && combo.items.length > 0 && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <h2 className="text-on-surface mb-3 text-[15px] font-bold">What&apos;s Included</h2>
          <ul className="space-y-2.5">
            {combo.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="bg-primary/10 text-accent mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full">
                  <span className="material-symbols-outlined text-xs">check</span>
                </span>
                <span className="text-on-surface text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Vendor row — Blinkit brand row style */}
      {vendor && (
        <Link
          href={`/app/food/${vendor.id}`}
          className="border-outline-variant/60 active:bg-surface-container flex items-center gap-3 border-b px-4 py-4 transition-colors"
        >
          <div className="bg-surface border-outline-variant/40 relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border">
            <Image
              src={
                vendor.image_url ||
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80"
              }
              alt={vendor.shop_name}
              fill
              className="object-cover"
              sizes="44px"
              unoptimized={!canOptimizeImage(vendor.image_url || "")}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-on-surface truncate text-sm font-bold">{vendor.shop_name}</p>
            <p className="text-on-surface-variant truncate text-xs">
              View full menu · {vendor.cuisine}
            </p>
          </div>
          <span className="material-symbols-outlined text-outline">chevron_right</span>
        </Link>
      )}

      {/* Restaurant Menu Preview */}
      {menuItems.length > 0 && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-on-surface text-[15px] font-bold">Menu from {vendor?.shop_name}</h2>
            {vendor && (
              <Link
                href={`/app/food/${vendor.id}`}
                className="text-accent text-xs font-bold hover:underline"
              >
                View All
              </Link>
            )}
          </div>
          <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={vendor ? `/app/food/${vendor.id}` : "#"}
                className="bg-surface-container-low border-outline-variant/30 w-32 flex-shrink-0 overflow-hidden rounded-xl border shadow-sm transition-transform active:scale-[0.98]"
              >
                <div className="bg-surface-container relative h-20 overflow-hidden">
                  <Image
                    src={
                      item.image_url ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"
                    }
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized={!canOptimizeImage(item.image_url || "")}
                  />
                  {item.is_veg && (
                    <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-sm bg-white">
                      <span className="h-2 w-2 rounded-full bg-green-600" />
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-on-surface truncate text-xs font-bold">{item.name}</p>
                  <p className="text-on-surface mt-0.5 text-xs font-bold">₹{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Similar Combos */}
      {similarCombos.length > 0 && (
        <section className="border-outline-variant/60 border-b px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-on-surface text-[15px] font-bold">You Might Also Like</h2>
            <Link
              href="/app/food?filter=combos"
              className="text-accent text-xs font-bold hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {similarCombos.map((sc) => {
              const scSavings = sc.original_price - sc.combo_price;
              const scDiscount = Math.round((scSavings / sc.original_price) * 100);
              return (
                <Link
                  key={sc.id}
                  href={`/app/food/combo/${sc.id}`}
                  className="bg-surface-container-low border-outline-variant/30 w-40 flex-shrink-0 overflow-hidden rounded-xl border shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="bg-surface-container relative h-24 overflow-hidden">
                    <Image
                      src={
                        sc.image_url ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"
                      }
                      alt={sc.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                      unoptimized={!canOptimizeImage(sc.image_url || "")}
                    />
                    {scDiscount > 0 && (
                      <span className="bg-status-error absolute top-1 right-1 rounded-full px-1.5 py-0.5 text-[10px] font-black text-white">
                        {scDiscount}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-on-surface truncate text-xs font-bold">{sc.name}</p>
                    <div className="mt-1 flex flex-col items-start leading-tight">
                      <span className="text-on-surface text-xs font-black">₹{sc.combo_price}</span>
                      <span className="text-on-surface-variant text-[10px] line-through">
                        ₹{sc.original_price}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-on-surface text-[15px] font-bold">Ratings & Reviews</h2>
          {vendor?.rating && (
            <div className="bg-primary/10 flex items-center gap-1.5 rounded-full px-2.5 py-1">
              <span className="material-symbols-outlined text-accent text-sm">star</span>
              <span className="text-accent text-sm font-bold">{vendor.rating}</span>
              {vendor.rating_count != null && (
                <span className="text-on-surface-variant text-xs">({vendor.rating_count})</span>
              )}
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-on-surface-variant py-4 text-center text-sm">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border-outline-variant/40 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`material-symbols-outlined text-sm ${i < review.rating ? "text-accent" : "text-outline-variant"}`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-on-surface-variant text-xs">
                    {new Date(review.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-on-surface text-sm leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sticky bottom bar — price + Add to cart (Blinkit style), sits above bottom nav */}
      <div className="bg-surface-container-lowest border-outline-variant/60 fixed right-0 bottom-[80px] left-0 z-40 border-t shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:right-6 md:left-auto md:max-w-md md:rounded-2xl md:border md:shadow-xl">
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}
        >
          {qty === 0 ? (
            <>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-on-surface text-lg font-black">₹{combo.combo_price}</span>
                  <span className="text-on-surface-variant text-sm line-through">
                    ₹{combo.original_price}
                  </span>
                </div>
                <p className="text-[11px] leading-tight font-bold text-green-600">
                  You save ₹{savings.toFixed(0)}
                </p>
              </div>
              <button
                ref={addBtnRef}
                onClick={handleAddToCart}
                className="bg-primary text-on-primary hover:bg-primary-dim hover:text-on-primary shadow-primary/20 shrink-0 rounded-xl px-6 py-3 text-sm font-black shadow-md transition-all active:scale-95"
              >
                Add to cart
              </button>
            </>
          ) : (
            <>
              <div className="bg-surface-container-lowest border-primary flex items-center gap-1 overflow-hidden rounded-lg border">
                <button
                  onClick={() => updateQuantity(cartItemId, qty - 1)}
                  aria-label="Decrease quantity"
                  className="bg-primary text-on-primary flex h-10 w-10 items-center justify-center font-bold transition-colors hover:brightness-95 active:scale-90"
                >
                  −
                </button>
                <span
                  key={qty}
                  className="text-on-surface min-w-[24px] text-center text-sm font-extrabold"
                >
                  {qty}
                </span>
                <button
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                  className="bg-primary text-on-primary flex h-10 w-10 items-center justify-center font-bold transition-colors hover:brightness-95 active:scale-90"
                >
                  +
                </button>
              </div>
              <Link
                href="/app/cart"
                className="bg-primary text-on-primary shadow-primary/20 flex-1 rounded-xl py-3 text-center text-sm font-black shadow-lg transition-all active:scale-95"
              >
                View Cart — ₹{(combo.combo_price * qty).toFixed(0)}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

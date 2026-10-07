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
  const [flyingItems, setFlyingItems] = useState<Array<{ id: number; x: number; y: number; img: string }>>([]);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number; delay: number; size: number }>>([]);
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
                .select("id, name, description, image_url, original_price, combo_price, items, vendor_id, category")
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
        prev.map((item) =>
          item.id === id ? { ...item, x: endX, y: endY } : item
        )
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
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#f43f5e"];
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
      addItem({
        id: `combo-${combo.id}`,
        menu_item_id: `combo-${combo.id}`,
        vendor_id: vendorId || "",
        vendor_name: vendorName,
        name: combo.name,
        price: combo.combo_price,
        image_url: combo.image_url,
        is_veg: true,
      }, 1);
    }, 400);
  }, [combo, vendor, cartVendorId, items, addItem, confirm, triggerFlyAnimation, triggerConfetti]);

  const handleIncrement = useCallback(() => {
    if (!combo) return;
    addItem({
      id: `combo-${combo.id}`,
      menu_item_id: `combo-${combo.id}`,
      vendor_id: vendor?.id || combo.vendor_id,
      vendor_name: vendor?.shop_name || "Combo",
      name: combo.name,
      price: combo.combo_price,
      image_url: combo.image_url,
      is_veg: true,
    }, 1);
  }, [combo, vendor, addItem]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="h-14 border-b border-outline-variant/60 flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-surface-container-high animate-pulse rounded" />
            <div className="h-2.5 w-40 bg-surface-container-high animate-pulse rounded" />
          </div>
        </div>
        <div className="w-full aspect-square max-h-[70vh] bg-surface-container-high animate-pulse" />
        <div className="px-4 py-4 space-y-3 border-b border-outline-variant/60">
          <div className="h-5 w-3/4 bg-surface-container-high animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-surface-container-high animate-pulse rounded" />
        </div>
        <div className="px-4 py-4 space-y-2.5">
          <div className="h-4 w-1/3 bg-surface-container-high animate-pulse rounded" />
          <div className="h-3 w-2/3 bg-surface-container-high animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-surface-container-high animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6">
        <p className="text-xl font-black text-on-surface mb-2">Combo not found</p>
        <Link href="/app/home" className="text-accent font-bold">Go back</Link>
      </div>
    );
  }

  const savings = combo.original_price - combo.combo_price;
  const discountPct = Math.round((savings / combo.original_price) * 100);

  return (
    <div className="min-h-screen bg-surface pb-44 md:pb-32">
      {/* Flying item animations */}
      {flyingItems.map((item) => (
        <div
          key={item.id}
          className="fixed z-[9999] pointer-events-none transition-all duration-700 ease-in-out"
          style={{
            left: item.x,
            top: item.y,
            width: 48,
            height: 48,
            opacity: flyingItems.find((f) => f.id === item.id && item.y !== flyingItems.find((f2) => f2.id === item.id)?.y) ? 0.3 : 1,
            transform: item.y !== (heroRef.current?.getBoundingClientRect().top ?? 0) ? "scale(0.2)" : "scale(1)",
            borderRadius: "50%",
            overflow: "hidden",
          }}
        >
          <Image
            src={item.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80"}
            alt=""
            width={48}
            height={48}
            className="w-full h-full object-cover shadow-lg"
            unoptimized={!canOptimizeImage(item.img || "")}
          />
        </div>
      ))}

      {/* Confetti */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="fixed z-[9999] pointer-events-none"
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
      <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60">
        <div className="h-14 flex items-center gap-1 px-2">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0 px-1">
            <p className="text-[13px] font-bold text-on-surface truncate">
              {vendor?.shop_name || combo.name}
            </p>
            <p className="text-[11px] text-on-surface-variant truncate">
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
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      {/* Full-bleed product image with overlay chips */}
      <div ref={heroRef} className="relative w-full aspect-square max-h-[70vh] overflow-hidden bg-surface-container">
        {combo.image_url ? (
          <Image src={combo.image_url} alt={combo.name} fill className="object-cover" sizes="100vw" unoptimized={!canOptimizeImage(combo.image_url)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-orange-100 to-amber-50">🎉</div>
        )}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          {discountPct > 0 && (
            <span className="bg-status-error text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
              {discountPct}% OFF
            </span>
          )}
          {vendor?.rating != null && (
            <span className="bg-white text-accent text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">star</span>
              {vendor.rating}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <section className="px-4 py-4 border-b border-outline-variant/60">
        <div className="flex items-start gap-2">
          <span aria-label="Veg" className="w-4 h-4 mt-0.5 shrink-0 border-2 border-green-600 rounded-[3px] flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
          </span>
          <h1 className="text-[17px] font-bold text-on-surface leading-snug">{combo.name}</h1>
        </div>
        {vendor && (
          <Link href={`/app/food/${vendor.id}`} className="text-sm font-medium text-accent mt-1.5 inline-block hover:underline">
            {vendor.shop_name} · {vendor.cuisine}
          </Link>
        )}
      </section>

      {/* Description */}
      {combo.description && (
        <section className="px-4 py-4 border-b border-outline-variant/60">
          <p className="text-sm text-on-surface-variant leading-relaxed">{combo.description}</p>
        </section>
      )}

      {/* Items included */}
      {combo.items && combo.items.length > 0 && (
        <section className="px-4 py-4 border-b border-outline-variant/60">
          <h2 className="text-[15px] font-bold text-on-surface mb-3">What&apos;s Included</h2>
          <ul className="space-y-2.5">
            {combo.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-primary/10 text-accent rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-xs">check</span>
                </span>
                <span className="text-sm text-on-surface">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Vendor row — Blinkit brand row style */}
      {vendor && (
        <Link href={`/app/food/${vendor.id}`} className="flex items-center gap-3 px-4 py-4 border-b border-outline-variant/60 active:bg-surface-container transition-colors">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-surface flex-shrink-0 relative border border-outline-variant/40">
            <Image src={vendor.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80"} alt={vendor.shop_name} fill className="object-cover" sizes="44px" unoptimized={!canOptimizeImage(vendor.image_url || "")} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-on-surface text-sm truncate">{vendor.shop_name}</p>
            <p className="text-xs text-on-surface-variant truncate">View full menu · {vendor.cuisine}</p>
          </div>
          <span className="material-symbols-outlined text-outline">chevron_right</span>
        </Link>
      )}

      {/* Restaurant Menu Preview */}
      {menuItems.length > 0 && (
        <section className="px-4 py-4 border-b border-outline-variant/60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-on-surface">Menu from {vendor?.shop_name}</h2>
            {vendor && (
              <Link href={`/app/food/${vendor.id}`} className="text-xs font-bold text-accent hover:underline">
                View All
              </Link>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={vendor ? `/app/food/${vendor.id}` : "#"}
                className="flex-shrink-0 w-32 bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/30 active:scale-[0.98] transition-transform"
              >
                <div className="relative h-20 bg-surface-container overflow-hidden">
                  <Image
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized={!canOptimizeImage(item.image_url || "")}
                  />
                  {item.is_veg && (
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full" />
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                  <p className="text-xs font-bold text-on-surface mt-0.5">₹{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Similar Combos */}
      {similarCombos.length > 0 && (
        <section className="px-4 py-4 border-b border-outline-variant/60">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-on-surface">You Might Also Like</h2>
            <Link href="/app/food?filter=combos" className="text-xs font-bold text-accent hover:underline">
              View All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {similarCombos.map((sc) => {
              const scSavings = sc.original_price - sc.combo_price;
              const scDiscount = Math.round((scSavings / sc.original_price) * 100);
              return (
                <Link
                  key={sc.id}
                  href={`/app/food/combo/${sc.id}`}
                  className="flex-shrink-0 w-40 bg-surface-container-low rounded-xl overflow-hidden shadow-sm border border-outline-variant/30 active:scale-[0.98] transition-transform"
                >
                  <div className="relative h-24 bg-surface-container overflow-hidden">
                    <Image
                      src={sc.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"}
                      alt={sc.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                      unoptimized={!canOptimizeImage(sc.image_url || "")}
                    />
                    {scDiscount > 0 && (
                      <span className="absolute top-1 right-1 bg-status-error text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {scDiscount}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-on-surface truncate">{sc.name}</p>
                    <div className="flex flex-col items-start mt-1 leading-tight">
                      <span className="text-xs font-black text-on-surface">₹{sc.combo_price}</span>
                      <span className="text-[10px] text-on-surface-variant line-through">₹{sc.original_price}</span>
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-on-surface">Ratings & Reviews</h2>
          {vendor?.rating && (
            <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-sm text-accent">star</span>
              <span className="text-sm font-bold text-accent">{vendor.rating}</span>
              {vendor.rating_count != null && (
                <span className="text-xs text-on-surface-variant">({vendor.rating_count})</span>
              )}
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-4">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-outline-variant/40 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
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
                  <span className="text-xs text-on-surface-variant">
                    {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-on-surface leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sticky bottom bar — price + Add to cart (Blinkit style), sits above bottom nav */}
      <div className="fixed bottom-[80px] left-0 right-0 md:left-auto md:right-6 md:max-w-md z-40 bg-surface-container-lowest border-t md:border md:rounded-2xl border-outline-variant/60 shadow-[0_-6px_20px_rgba(0,0,0,0.08)] md:shadow-xl">
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)" }}>
          {qty === 0 ? (
            <>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-on-surface">₹{combo.combo_price}</span>
                  <span className="text-sm text-on-surface-variant line-through">₹{combo.original_price}</span>
                </div>
                <p className="text-[11px] font-bold text-green-600 leading-tight">
                  You save ₹{savings.toFixed(0)}
                </p>
              </div>
              <button
                ref={addBtnRef}
                onClick={handleAddToCart}
                className="shrink-0 bg-primary text-on-primary px-6 py-3 rounded-xl font-black text-sm hover:bg-primary-dim hover:text-on-primary active:scale-95 transition-all shadow-md shadow-primary/20"
              >
                Add to cart
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 bg-surface-container-lowest border border-primary rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(cartItemId, qty - 1)}
                  aria-label="Decrease quantity"
                  className="bg-primary text-on-primary font-bold w-10 h-10 flex items-center justify-center hover:brightness-95 transition-colors active:scale-90"
                >
                  −
                </button>
                <span key={qty} className="text-on-surface font-extrabold text-sm min-w-[24px] text-center">
                  {qty}
                </span>
                <button
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                  className="bg-primary text-on-primary font-bold w-10 h-10 flex items-center justify-center hover:brightness-95 transition-colors active:scale-90"
                >
                  +
                </button>
              </div>
              <Link
                href="/app/cart"
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-black text-sm text-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
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

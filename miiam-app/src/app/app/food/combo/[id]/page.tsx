"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { useToastStore } from "@/lib/store/toastStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import Breadcrumbs from "@/components/Breadcrumbs";
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
  const { addItem, items } = useCartStore();
  const { addToast } = useToastStore();
  const { confirm } = useConfirm();

  const heroRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [flyingItems, setFlyingItems] = useState<Array<{ id: number; x: number; y: number; img: string }>>([]);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number; delay: number; size: number }>>([]);
  const flyIdRef = useRef(0);
  const confettiIdRef = useRef(0);

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
    const vendorId = vendor?.id || combo?.vendor_id;
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
        id: `combo-${combo!.id}`,
        menu_item_id: `combo-${combo!.id}`,
        vendor_id: vendorId || "",
        vendor_name: vendorName,
        name: combo!.name,
        price: combo!.combo_price,
        image_url: combo!.image_url,
        is_veg: true,
      }, 1);
    }, 400);
  }, [combo, vendor, cartVendorId, items, addItem, confirm, triggerFlyAnimation, triggerConfetti]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 space-y-4">
        <div className="h-64 w-full bg-surface-container-high animate-pulse rounded-2xl" />
        <div className="h-8 w-2/3 bg-surface-container-high animate-pulse rounded-xl" />
        <div className="h-4 w-1/2 bg-surface-container-high animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6">
        <p className="text-xl font-black text-on-surface mb-2">Combo not found</p>
        <Link href="/app/home" className="text-primary font-bold">Go back</Link>
      </div>
    );
  }

  const savings = combo.original_price - combo.combo_price;
  const discountPct = Math.round((savings / combo.original_price) * 100);

  return (
    <div className="min-h-screen bg-surface pb-8">
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

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "Food", href: "/app/food" }, { label: "Combo", href: "/app/food?filter=combos" }, { label: combo.name }]} />

      {/* Hero Image */}
      <div ref={heroRef} className="relative h-64 sm:h-80 overflow-hidden">
        {combo.image_url ? (
          <Image src={combo.image_url} alt={combo.name} fill className="object-cover" sizes="100vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-orange-100 to-amber-50">🎉</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 pt-12 sm:pt-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
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
            className="w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors active:scale-90"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>

        {/* Discount badge */}
        <div className="absolute top-4 right-4 bg-status-error text-white text-sm font-black px-3 py-1.5 rounded-full shadow-lg">
          {discountPct}% OFF
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-white font-black text-2xl sm:text-3xl leading-tight">{combo.name}</h1>
          {vendor && (
            <Link href={`/app/food/${vendor.id}`} className="text-white/80 text-sm mt-1 font-medium hover:underline">
              {vendor.shop_name} · {vendor.cuisine}
            </Link>
          )}
        </div>
      </div>

      {/* Price card */}
      <div className="mx-4 -mt-4 relative z-10 bg-surface-container-lowest rounded-2xl p-5 shadow-md border border-outline-variant/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-primary">₹{combo.combo_price}</span>
              <span className="text-lg text-on-surface-variant line-through">₹{combo.original_price}</span>
            </div>
            <p className="text-sm text-green-600 font-bold mt-1">You save ₹{savings.toFixed(0)}</p>
          </div>
          <div className="flex gap-2">
            {vendor && (
              <Link
                href={`/app/food/${vendor.id}`}
                className="bg-surface-container-high text-on-surface px-4 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
              >
                View Menu
              </Link>
            )}
            <button
              ref={addBtnRef}
              onClick={handleAddToCart}
              className="bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary-dim active:scale-95 transition-all"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {combo.description && (
        <div className="mx-4 mt-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
          <p className="text-sm text-on-surface-variant leading-relaxed">{combo.description}</p>
        </div>
      )}

      {/* Items included */}
      {combo.items && combo.items.length > 0 && (
        <div className="mx-4 mt-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
          <h2 className="text-base font-black text-on-surface mb-3">What&apos;s Included</h2>
          <ul className="space-y-2.5">
            {combo.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-xs">check</span>
                </span>
                <span className="text-sm text-on-surface">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Vendor info */}
      {vendor && (
        <Link href={`/app/food/${vendor.id}`} className="mx-4 mt-4 block bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10 active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 relative">
              <Image src={vendor.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80"} alt={vendor.shop_name} fill className="object-cover" sizes="48px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-on-surface text-sm truncate">{vendor.shop_name}</p>
              <p className="text-xs text-on-surface-variant truncate">{vendor.cuisine}</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </div>
        </Link>
      )}

      {/* Restaurant Menu Preview */}
      {menuItems.length > 0 && (
        <div className="mx-4 mt-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-on-surface">Menu from {vendor?.shop_name}</h2>
            {vendor && (
              <Link href={`/app/food/${vendor.id}`} className="text-xs font-bold text-primary hover:underline">
                View All
              </Link>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={vendor ? `/app/food/${vendor.id}` : "#"}
                className="flex-shrink-0 w-32 bg-surface-container-low rounded-xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="relative h-20 bg-surface-container overflow-hidden">
                  <Image
                    src={item.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                  {item.is_veg && (
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full" />
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                  <p className="text-xs font-bold text-primary mt-0.5">₹{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Similar Combos */}
      {similarCombos.length > 0 && (
        <div className="mx-4 mt-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-on-surface">You Might Also Like</h2>
            <Link href="/app/food?filter=combos" className="text-xs font-bold text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {similarCombos.map((sc) => {
              const scSavings = sc.original_price - sc.combo_price;
              const scDiscount = Math.round((scSavings / sc.original_price) * 100);
              return (
                <Link
                  key={sc.id}
                  href={`/app/food/combo/${sc.id}`}
                  className="flex-shrink-0 w-40 bg-surface-container-low rounded-xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="relative h-24 bg-surface-container overflow-hidden">
                    <Image
                      src={sc.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80"}
                      alt={sc.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                    {scDiscount > 0 && (
                      <span className="absolute top-1 right-1 bg-status-error text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {scDiscount}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-on-surface truncate">{sc.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-black text-primary">₹{sc.combo_price}</span>
                      <span className="text-[10px] text-on-surface-variant line-through">₹{sc.original_price}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mx-4 mt-4 bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-on-surface">Ratings & Reviews</h2>
          {vendor?.rating && (
            <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-sm text-primary">star</span>
              <span className="text-sm font-bold text-primary">{vendor.rating}</span>
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
              <div key={review.id} className="border-b border-outline-variant/10 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`material-symbols-outlined text-sm ${i < review.rating ? "text-primary" : "text-outline-variant"}`}
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
      </div>
    </div>
  );
}

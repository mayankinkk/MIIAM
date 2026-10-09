"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SwipeableCard from "@/components/SwipeableCard";
import PullToRefresh from "@/components/PullToRefresh";

import { useCartStore } from "@/lib/store/cartStore";
import { EmptyCart } from "@/components/ui/EmptyStates";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import BlurImage from "@/components/BlurImage";
import CartCrossSell from "@/components/CartCrossSell";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ListSkeleton } from "@/components/Skeleton";
import logger from "@/lib/logger";


interface PastOrder {
  id: string;
  total_amount: number | null;
  placed_at: string;
  vendors?: { shop_name: string } | null;
}

export default function CartPage() {
  const { t } = useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const subtotalByVendor = useCartStore((s) => s.subtotalByVendor);
  const addItem = useCartStore((s) => s.addItem);
  const saveForLater = useCartStore((s) => s.saveForLater);
  const savedItems = useCartStore((s) => s.savedItems);
  const moveToCart = useCartStore((s) => s.moveToCart);
  const removeSaved = useCartStore((s) => s.removeSaved);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { addToast } = useToastStore();

  const [hydrated, setHydrated] = useState(false);
  const [serviceCharge, setServiceCharge] = useState(15);

  useEffect(() => {
    if (!useCartStore.persist) {
      setHydrated(true);
      return;
    }
    if (useCartStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    async function loadServiceCharge() {
      try {
        const { data } = await supabase.from("site_settings").select("value").eq("key", "service_charge").maybeSingle();
        if (data?.value) setServiceCharge(Number(data.value));
      } catch { /* use default */ }
    }
    loadServiceCharge();
  }, [supabase]);

  const handleRefresh = useCallback(async () => {
    try {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "service_charge").maybeSingle();
      if (data?.value) setServiceCharge(Number(data.value));
    } catch { /* use existing */ }
  }, [supabase]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-surface p-4" aria-label="Loading...">
        <ListSkeleton count={4} />
      </div>
    );
  }

  const safeItems = Array.isArray(items) ? items : [];

  const vendors = Array.from(new Set(safeItems.map((i) => i.vendor_id).filter(Boolean))).map((vid) => ({
    id: vid,
    name: safeItems.find((i) => i.vendor_id === vid)?.vendor_name ?? vid,
    items: safeItems.filter((i) => i.vendor_id === vid),
  }));

  const hasMultipleVendors = vendors.length > 1;

  const total = totalPrice();

  const grandTotal = Math.max(0, total + serviceCharge);

  const fetchPastOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: orders } = await supabase
        .from("orders")
        .select("*, vendor_id")
        .eq("user_id", user.id)
        .eq("status", "delivered")
        .order("placed_at", { ascending: false })
        .limit(10);

      const ordersWithVendor = await Promise.all((orders || []).map(async (o: { id: string; total_amount: number | null; placed_at: string; vendor_id: string | null }) => {
        if (o.vendor_id) {
          const { data: v } = await supabase.from("vendors").select("shop_name").eq("id", o.vendor_id).single();
          return { ...o, vendors: v ? { shop_name: v.shop_name } : null };
        }
        return { ...o, vendors: null };
      }));
      setPastOrders(ordersWithVendor);
    } catch (error) {
      logger.error({ err: error }, "Failed to fetch past orders");
      addToast("Failed to load past orders. Please try again.", "error");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleReorder = async (orderId: string) => {
    setReordering(true);
    try {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*, menu_items(*)")
        .eq("order_id", orderId);
      if (orderItems) {
        let vendorName = t.cart.vendor;
        if (orderItems.length > 0 && orderItems[0].menu_items?.vendor_id) {
          const { data: vendor } = await supabase.from("vendors").select("shop_name").eq("id", orderItems[0].menu_items.vendor_id).maybeSingle();
          if (vendor) vendorName = vendor.shop_name;
        }
        for (const item of orderItems) {
          if (item.menu_items) {
            addItem({
              id: item.menu_item_id,
              menu_item_id: item.menu_item_id,
              vendor_id: item.menu_items.vendor_id,
              vendor_name: vendorName,
              name: item.menu_items.name,
              price: item.unit_price,
              image_url: item.menu_items.image_url,
            }, item.quantity, true);
          }
        }
      }
      setShowReorderModal(false);
    } catch (error) {
      logger.error({ err: error }, "Reorder failed");
      addToast("Failed to reorder. Please try again.", "error");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-28">
      <header className="sticky top-0 z-40 h-14 flex items-center gap-3 px-4 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Link href="/app/home" className="p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors" aria-label="Back">
          <span className="material-symbols-outlined text-on-surface text-[22px]">arrow_back</span>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[17px] font-bold text-on-surface leading-tight truncate">{t.cart.title}</h1>
          <p className="text-xs text-on-surface-variant leading-tight">
            {safeItems.length > 0 ? `${safeItems.length} item${safeItems.length > 1 ? "s" : ""}` : t.cart.subtitle}
          </p>
        </div>
        {safeItems.length > 0 && (
          <button
            onClick={async () => {
              await fetchPastOrders();
              setShowReorderModal(true);
            }}
            className="shrink-0 text-xs font-bold text-accent px-2 py-1.5 rounded-lg hover:bg-accent/10 transition-colors"
          >
            {t.cart.reorder}
          </button>
        )}
      </header>

      <main className="pb-4 max-w-2xl mx-auto">
        <PullToRefresh onRefresh={handleRefresh}>
        {hasMultipleVendors && (
          <div className="bg-primary/10 border-b border-outline-variant/60 px-4 py-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-primary-dim text-[18px] mt-0.5">warning</span>
              <div className="flex-1">
                <p className="font-bold text-on-surface text-sm">{t.cart.multiVendor}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{t.cart.multiVendorDesc}</p>
              </div>
            </div>
          </div>
        )}

        {safeItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="bg-surface-container-lowest">
            {vendors.map((vendor) => (
              <section key={vendor.id} className="px-4 py-4 border-b border-outline-variant/60">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-on-surface text-[20px]">restaurant</span>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-tight truncate text-on-surface">{vendor.name}</h2>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-wider">{t.cart.priorityDelivery}</p>
                  </div>
                </div>
                <div className="mt-2">
                  {vendor.items.map((item) => (
                    <SwipeableCard
                      key={item.id}
                      onSwipeLeft={() => removeItem(item.id)}
                      onSwipeRight={() => saveForLater(item.id)}
                      leftAction={{ label: "Remove", color: "bg-red-500", icon: "delete" }}
                      rightAction={{ label: "Save Later", color: "bg-amber-500", icon: "bookmark" }}
                    >
                    <div className="flex items-start gap-3 py-3 border-t border-outline-variant/40 first:border-t-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container border border-outline-variant/40">
                        {item.image_url ? (
                          <BlurImage src={item.image_url} alt={item.name} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 25vw" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-outline-variant text-2xl">fastfood</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-on-surface text-sm leading-snug line-clamp-2">{item.name}</h3>
                        {item.special_notes ? (
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">{item.special_notes}</p>
                        ) : null}
                        <p className="font-bold text-on-surface text-sm mt-1">₹{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center border border-primary rounded-lg overflow-hidden bg-primary/5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-9 h-9 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
                          </button>
                          <span className="px-1 font-bold text-sm w-7 text-center text-on-surface" aria-live="polite" aria-atomic="true">
                            <AnimatePresence mode="popLayout">
                              <motion.span
                                key={item.quantity}
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 10, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="block"
                              >
                                {item.quantity}
                              </motion.span>
                            </AnimatePresence>
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-9 h-9 flex items-center justify-center bg-primary text-on-primary hover:bg-primary-dim transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => saveForLater(item.id)}
                            className="text-[10px] font-bold text-on-surface-variant hover:text-accent transition-colors uppercase tracking-wide"
                          >
                            Save Later
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[10px] font-bold text-on-surface-variant hover:text-accent transition-colors uppercase tracking-wide"
                          >
                            {t.cart.remove}
                          </button>
                        </div>
                      </div>
                    </div>
                    </SwipeableCard>
                  ))}
                </div>
                <div className="mt-1 pt-3 border-t border-outline-variant/40 flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">{t.cart.subtotal} ({vendor.name})</span>
                  <span className="font-bold text-on-surface">₹{subtotalByVendor(vendor.id).toFixed(2)}</span>
                </div>
              </section>
            ))}

            {savedItems.length > 0 && (
              <section className="px-4 py-4 border-b border-outline-variant/60">
                <h3 className="text-[15px] font-bold mb-3 flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-accent">bookmark</span>
                  Saved for Later ({savedItems.length})
                </h3>
                <div>
                  {savedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-3 border-t border-outline-variant/40 first:border-t-0">
                      <BlurImage
                        src={item.image_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.name) + "&background=f3f4f6&color=6b7280"}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-on-surface truncate">{item.name}</p>
                        <p className="text-[11px] font-bold text-on-surface">₹{item.price}</p>
                      </div>
                      <button
                        onClick={() => moveToCart(item.id)}
                        className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wide"
                      >
                        Move to Cart
                      </button>
                      <button
                        onClick={() => removeSaved(item.id)}
                        aria-label="Remove saved item"
                        className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <CartCrossSell />

            <section className="px-4 py-4">
              <h3 className="text-[15px] font-bold mb-3 text-on-surface">{t.cart.paymentSummary}</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-on-surface-variant">{t.cart.itemsSubtotal}</span>
                  <span className="font-semibold text-on-surface truncate">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t.cart.deliveryFee}</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-on-surface-variant">{t.cart.serviceCharge}</span>
                  <span className="font-semibold text-on-surface truncate">₹{serviceCharge.toFixed(2)}</span>
                </div>
                <div className="pt-3 mt-1 border-t border-outline-variant/40 flex justify-between items-center gap-2">
                  <span className="font-bold text-on-surface">{t.cart.totalBalance}</span>
                  <span className="font-bold text-on-surface truncate">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {showReorderModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="reorder-modal-title" onClick={(e) => { if (e.target === e.currentTarget) setShowReorderModal(false); }} onKeyDown={(e) => { if (e.key === "Escape") setShowReorderModal(false); }}>
            <div className="bg-surface-container-lowest rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-outline-variant/60 flex items-center justify-between">
                <h3 id="reorder-modal-title" className="text-base font-bold text-on-surface">{t.cart.reorderFromPast}</h3>
                <button onClick={() => setShowReorderModal(false)} aria-label="Close" className="w-11 h-11 -mr-2 bg-surface-container rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[65vh]">
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : pastOrders.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant text-sm">{t.cart.noPastOrders}</div>
                ) : (
                  <div className="space-y-3">
                    {pastOrders.map((order) => (
                      <div key={order.id} className="border border-outline-variant/60 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-on-surface text-sm">{order.vendors?.shop_name || t.cart.restaurant}</p>
                            <p className="text-xs text-on-surface-variant">{new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <p className="font-bold text-on-surface text-sm">₹{order.total_amount?.toFixed(2)}</p>
                        </div>
                        <button onClick={() => handleReorder(order.id)} disabled={reordering} className="w-full mt-1 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary-dim disabled:opacity-60 transition-colors">
                          {reordering ? t.cart.adding : t.cart.addToCart}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </PullToRefresh>
      </main>

      {safeItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant/60 md:left-auto md:right-6 md:bottom-6 md:max-w-md md:border md:rounded-2xl md:shadow-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{t.cart.total}</p>
              <p className="text-lg font-extrabold text-on-surface truncate">₹{grandTotal.toFixed(2)}</p>
            </div>
            <Link
              href="/app/checkout"
              className="shrink-0 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold text-sm hover:bg-primary-dim active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {t.cart.proceed}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

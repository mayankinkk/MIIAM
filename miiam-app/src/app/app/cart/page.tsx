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
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "service_charge")
          .maybeSingle();
        if (data?.value) setServiceCharge(Number(data.value));
      } catch {
        /* use default */
      }
    }
    loadServiceCharge();
  }, [supabase]);

  const handleRefresh = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "service_charge")
        .maybeSingle();
      if (data?.value) setServiceCharge(Number(data.value));
    } catch {
      /* use existing */
    }
  }, [supabase]);

  if (!hydrated) {
    return (
      <div className="bg-surface min-h-screen p-4" aria-label="Loading...">
        <ListSkeleton count={4} />
      </div>
    );
  }

  const safeItems = Array.isArray(items) ? items : [];

  const vendors = Array.from(new Set(safeItems.map((i) => i.vendor_id).filter(Boolean))).map(
    (vid) => ({
      id: vid,
      name: safeItems.find((i) => i.vendor_id === vid)?.vendor_name ?? vid,
      items: safeItems.filter((i) => i.vendor_id === vid),
    })
  );

  const hasMultipleVendors = vendors.length > 1;

  const total = totalPrice();

  const grandTotal = Math.max(0, total + serviceCharge);

  const fetchPastOrders = async () => {
    setLoadingOrders(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: orders } = await supabase
        .from("orders")
        .select("*, vendor_id")
        .eq("user_id", user.id)
        .eq("status", "delivered")
        .order("placed_at", { ascending: false })
        .limit(10);

      const ordersWithVendor = await Promise.all(
        (orders || []).map(
          async (o: {
            id: string;
            total_amount: number | null;
            placed_at: string;
            vendor_id: string | null;
          }) => {
            if (o.vendor_id) {
              const { data: v } = await supabase
                .from("vendors")
                .select("shop_name")
                .eq("id", o.vendor_id)
                .single();
              return { ...o, vendors: v ? { shop_name: v.shop_name } : null };
            }
            return { ...o, vendors: null };
          }
        )
      );
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
          const { data: vendor } = await supabase
            .from("vendors")
            .select("shop_name")
            .eq("id", orderItems[0].menu_items.vendor_id)
            .maybeSingle();
          if (vendor) vendorName = vendor.shop_name;
        }
        for (const item of orderItems) {
          if (item.menu_items) {
            addItem(
              {
                id: item.menu_item_id,
                menu_item_id: item.menu_item_id,
                vendor_id: item.menu_items.vendor_id,
                vendor_name: vendorName,
                name: item.menu_items.name,
                price: item.unit_price,
                image_url: item.menu_items.image_url,
              },
              item.quantity,
              true
            );
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
    <div className="bg-surface min-h-screen pb-28">
      <header
        className="bg-surface-container-lowest/95 border-outline-variant/60 sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Link
          href="/app/home"
          className="hover:bg-surface-container -ml-2 rounded-full p-2 transition-colors"
          aria-label="Back"
        >
          <span className="material-symbols-outlined text-on-surface text-[22px]">arrow_back</span>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-on-surface truncate text-[17px] leading-tight font-bold">
            {t.cart.title}
          </h1>
          <p className="text-on-surface-variant text-xs leading-tight">
            {safeItems.length > 0
              ? `${safeItems.length} item${safeItems.length > 1 ? "s" : ""}`
              : t.cart.subtitle}
          </p>
        </div>
        {safeItems.length > 0 && (
          <button
            onClick={async () => {
              await fetchPastOrders();
              setShowReorderModal(true);
            }}
            className="text-accent hover:bg-accent/10 shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors"
          >
            {t.cart.reorder}
          </button>
        )}
      </header>

      <main className="mx-auto max-w-2xl pb-4">
        <PullToRefresh onRefresh={handleRefresh}>
          {hasMultipleVendors && (
            <div className="bg-primary/10 border-outline-variant/60 border-b px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary-dim mt-0.5 text-[18px]">
                  warning
                </span>
                <div className="flex-1">
                  <p className="text-on-surface text-sm font-bold">{t.cart.multiVendor}</p>
                  <p className="text-on-surface-variant mt-0.5 text-xs">{t.cart.multiVendorDesc}</p>
                </div>
              </div>
            </div>
          )}

          {safeItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="bg-surface-container-lowest">
              {vendors.map((vendor) => (
                <section key={vendor.id} className="border-outline-variant/60 border-b px-4 py-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface text-[20px]">
                      restaurant
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-on-surface truncate text-[15px] font-bold tracking-tight">
                        {vendor.name}
                      </h2>
                      <p className="text-accent text-[10px] font-bold tracking-wider uppercase">
                        {t.cart.priorityDelivery}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    {vendor.items.map((item) => (
                      <SwipeableCard
                        key={item.id}
                        onSwipeLeft={() => removeItem(item.id)}
                        onSwipeRight={() => saveForLater(item.id)}
                        leftAction={{ label: "Remove", color: "bg-red-500", icon: "delete" }}
                        rightAction={{
                          label: t.cart.saveLater,
                          color: "bg-amber-500",
                          icon: "bookmark",
                        }}
                      >
                        <div className="border-outline-variant/40 flex items-start gap-3 border-t py-3 first:border-t-0">
                          <div className="bg-surface-container border-outline-variant/40 h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border">
                            {item.image_url ? (
                              <BlurImage
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="h-full w-full"
                                sizes="(max-width: 768px) 50vw, 25vw"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <span className="material-symbols-outlined text-outline-variant text-2xl">
                                  fastfood
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-on-surface line-clamp-2 text-sm leading-snug font-semibold">
                              {item.name}
                            </h3>
                            {item.special_notes ? (
                              <p className="text-on-surface-variant mt-0.5 truncate text-xs">
                                {item.special_notes}
                              </p>
                            ) : null}
                            <p className="text-on-surface mt-1 text-sm font-bold">
                              ₹{item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <div className="border-primary bg-primary/5 flex items-center overflow-hidden rounded-lg border">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label={`Decrease quantity of ${item.name}`}
                                className="text-primary hover:bg-primary/10 flex h-9 w-9 items-center justify-center transition-colors"
                              >
                                <span
                                  className="material-symbols-outlined text-[18px]"
                                  aria-hidden="true"
                                >
                                  remove
                                </span>
                              </button>
                              <span
                                className="text-on-surface w-7 px-1 text-center text-sm font-bold"
                                aria-live="polite"
                                aria-atomic="true"
                              >
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
                                className="bg-primary text-on-primary hover:bg-primary-dim flex h-9 w-9 items-center justify-center transition-colors"
                              >
                                <span
                                  className="material-symbols-outlined text-[18px]"
                                  aria-hidden="true"
                                >
                                  add
                                </span>
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => saveForLater(item.id)}
                                className="text-on-surface-variant hover:text-accent text-[10px] font-bold tracking-wide uppercase transition-colors"
                              >
                                {t.cart.saveLater}
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-on-surface-variant hover:text-accent text-[10px] font-bold tracking-wide uppercase transition-colors"
                              >
                                {t.cart.remove}
                              </button>
                            </div>
                          </div>
                        </div>
                      </SwipeableCard>
                    ))}
                  </div>
                  <div className="border-outline-variant/40 mt-1 flex items-center justify-between border-t pt-3 text-sm">
                    <span className="text-on-surface-variant">
                      {t.cart.subtotal} ({vendor.name})
                    </span>
                    <span className="text-on-surface font-bold">
                      ₹{subtotalByVendor(vendor.id).toFixed(2)}
                    </span>
                  </div>
                </section>
              ))}

              {savedItems.length > 0 && (
                <section className="border-outline-variant/60 border-b px-4 py-4">
                  <h3 className="text-on-surface mb-3 flex items-center gap-2 text-[15px] font-bold">
                    <span className="material-symbols-outlined text-accent text-[18px]">
                      bookmark
                    </span>
                    {t.cart.savedForLater} ({savedItems.length})
                  </h3>
                  <div>
                    {savedItems.map((item) => (
                      <div
                        key={item.id}
                        className="border-outline-variant/40 flex items-center gap-3 border-t py-3 first:border-t-0"
                      >
                        <BlurImage
                          src={
                            item.image_url ||
                            "https://ui-avatars.com/api/?name=" +
                              encodeURIComponent(item.name) +
                              "&background=f3f4f6&color=6b7280"
                          }
                          alt={item.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-on-surface truncate text-xs font-semibold">
                            {item.name}
                          </p>
                          <p className="text-on-surface text-[11px] font-bold">₹{item.price}</p>
                        </div>
                        <button
                          onClick={() => moveToCart(item.id)}
                          className="text-accent text-[10px] font-bold tracking-wide uppercase hover:underline"
                        >
                          {t.cart.moveToCart}
                        </button>
                        <button
                          onClick={() => removeSaved(item.id)}
                          aria-label="Remove saved item"
                          className="text-on-surface-variant flex h-8 w-8 items-center justify-center hover:text-red-500"
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
                <h3 className="text-on-surface mb-3 text-[15px] font-bold">
                  {t.cart.paymentSummary}
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-on-surface-variant">{t.cart.itemsSubtotal}</span>
                    <span className="text-on-surface truncate font-semibold">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">{t.cart.deliveryFee}</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-on-surface-variant">{t.cart.serviceCharge}</span>
                    <span className="text-on-surface truncate font-semibold">
                      ₹{serviceCharge.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-outline-variant/40 mt-1 flex items-center justify-between gap-2 border-t pt-3">
                    <span className="text-on-surface font-bold">{t.cart.totalBalance}</span>
                    <span className="text-on-surface truncate font-bold">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {showReorderModal && (
            <div
              className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reorder-modal-title"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowReorderModal(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowReorderModal(false);
              }}
            >
              <div className="bg-surface-container-lowest max-h-[80vh] w-full overflow-hidden rounded-t-2xl">
                <div className="border-outline-variant/60 flex items-center justify-between border-b p-4">
                  <h3 id="reorder-modal-title" className="text-on-surface text-base font-bold">
                    {t.cart.reorderFromPast}
                  </h3>
                  <button
                    onClick={() => setShowReorderModal(false)}
                    aria-label="Close"
                    className="bg-surface-container -mr-2 flex h-11 w-11 items-center justify-center rounded-full"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <div className="max-h-[65vh] overflow-y-auto p-4">
                  {loadingOrders ? (
                    <div className="py-8 text-center">
                      <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                    </div>
                  ) : pastOrders.length === 0 ? (
                    <div className="text-on-surface-variant py-8 text-center text-sm">
                      {t.cart.noPastOrders}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pastOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border-outline-variant/60 rounded-xl border p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <p className="text-on-surface text-sm font-bold">
                                {order.vendors?.shop_name || t.cart.restaurant}
                              </p>
                              <p className="text-on-surface-variant text-xs">
                                {new Date(order.placed_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <p className="text-on-surface text-sm font-bold">
                              ₹{order.total_amount?.toFixed(2)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleReorder(order.id)}
                            disabled={reordering}
                            className="bg-primary text-on-primary hover:bg-primary-dim mt-1 w-full rounded-lg py-2.5 text-xs font-bold transition-colors disabled:opacity-60"
                          >
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
        <div
          className="bg-surface-container-lowest border-outline-variant/60 fixed right-0 bottom-0 left-0 z-40 border-t md:right-6 md:bottom-6 md:left-auto md:max-w-md md:rounded-2xl md:border md:shadow-xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-on-surface-variant text-[10px] font-bold tracking-wider uppercase">
                {t.cart.total}
              </p>
              <p className="text-on-surface truncate text-lg font-extrabold">
                ₹{grandTotal.toFixed(2)}
              </p>
            </div>
            <Link
              href="/app/checkout"
              className="bg-primary text-on-primary hover:bg-primary-dim flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold whitespace-nowrap transition-all active:scale-95"
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

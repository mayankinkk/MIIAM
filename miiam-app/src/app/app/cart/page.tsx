"use client";

import { useState, useEffect, useMemo } from "react";

import { useCartStore } from "@/lib/store/cartStore";
import { EmptyCart } from "@/components/ui/EmptyStates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ListSkeleton } from "@/components/Skeleton";


interface PastOrder {
  id: string;
  total_amount: number | null;
  placed_at: string;
  vendors?: { name: string } | null;
}

export default function CartPage() {
  const { t } = useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const subtotalByVendor = useCartStore((s) => s.subtotalByVendor);
  const clearCart = useCartStore((s) => s.clearCart);
  const addItem = useCartStore((s) => s.addItem);
  const saveForLater = useCartStore((s) => s.saveForLater);
  const savedItems = useCartStore((s) => s.savedItems);
  const moveToCart = useCartStore((s) => s.moveToCart);
  const removeSaved = useCartStore((s) => s.removeSaved);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const router = useRouter();
  const { addToast } = useToastStore();

  const [hydrated, setHydrated] = useState(() => useCartStore.persist?.hasHydrated() ?? false);
  const [vendorDeliveryCharges, setVendorDeliveryCharges] = useState<Record<string, number>>({});
  const [serviceCharge, setServiceCharge] = useState(8);

  useEffect(() => {
    if (hydrated) return;
    if (!useCartStore.persist) return;
    const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, [hydrated]);

  useEffect(() => {
    async function loadServiceCharge() {
      try {
        const { data } = await supabase.from("site_settings").select("value").eq("key", "service_charge").maybeSingle();
        if (data?.value) setServiceCharge(Number(data.value));
      } catch { /* use default */ }
    }
    loadServiceCharge();
  }, [supabase]);

  useEffect(() => {
    async function loadVendorDetails() {
      const safeItems = Array.isArray(items) ? items : [];
      const vendorIds = Array.from(new Set(safeItems.map((i) => i.vendor_id).filter(Boolean)));
      if (vendorIds.length === 0) {
        setVendorDeliveryCharges({});
        return;
      }
      const { data } = await supabase
        .from("vendors")
        .select("id")
        .in("id", vendorIds);
      if (data) {
        const charges = data.reduce((acc: Record<string, number>, v: { id: string }) => {
          acc[v.id] = 0;
          return acc;
        }, {} as Record<string, number>);
        setVendorDeliveryCharges(charges);
      }
    }
    loadVendorDetails();
  }, [items, supabase]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-surface dark:bg-[var(--color-surface)] p-4" aria-label="Loading...">
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

  const vendorIds = Array.from(new Set(safeItems.map((i) => i.vendor_id).filter(Boolean)));
  const totalDeliveryFee = 0;
  const grandTotal = Math.max(0, total + totalDeliveryFee + (vendorIds.length * serviceCharge));


  const fetchPastOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: orders } = await supabase
        .from("orders")
        .select("*, vendors(name)")
        .eq("user_id", user.id)
        .eq("status", "delivered")
        .order("placed_at", { ascending: false })
        .limit(10);
      setPastOrders(orders || []);
    } catch (error) {
      console.error("Failed to fetch past orders:", error);
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
        let vendorName = "Vendor";
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
      console.error("Reorder failed:", error);
      addToast("Failed to reorder. Please try again.", "error");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[var(--color-surface)] pb-24">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-surface/90 dark:bg-[var(--color-surface)]/90 backdrop-blur-2xl shadow-[0px_4px_20px_rgba(77,33,42,0.06)]"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/app/explore" className="p-2 rounded-full hover:bg-surface-container dark:hover:bg-[var(--color-surface-container)] transition-all" aria-label="Back">
            <span className="material-symbols-outlined text-on-surface dark:text-[var(--color-on-surface)] text-[22px]">arrow_back</span>
          </Link>
          <span className="text-xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app/notifications" aria-label="Notifications" className="p-2 rounded-full hover:bg-surface-container dark:hover:bg-[var(--color-surface-container)] transition-all">
            <span className="material-symbols-outlined text-on-surface dark:text-[var(--color-on-surface)] text-[22px]">notifications</span>
          </Link>
          <Link href="/app/profile" aria-label="Profile" className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-container dark:border-[var(--color-primary-container)] bg-primary-container dark:bg-[var(--color-primary-container)] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">person</span>
          </Link>
        </div>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Cart' }]} />

      <main className="pt-4 pb-40 px-3 sm:px-4 max-w-2xl mx-auto">
        <section className="mb-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary">{t.cart.title}</h1>
              <p className="text-[var(--color-on-surface-variant)] dark:text-[var(--color-outline)] text-xs mt-0.5">{t.cart.subtitle}</p>
            </div>
            <button
              onClick={async () => {
                await fetchPastOrders();
                setShowReorderModal(true);
              }}
              className="shrink-0 text-xs font-bold text-primary bg-primary/5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              {t.cart.reorder}
            </button>
          </div>
        </section>

        {hasMultipleVendors && (
          <div className="mb-4 bg-surface-container-low dark:bg-[var(--color-surface-container)] border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5">warning</span>
              <div className="flex-1">
                <p className="font-bold text-amber-800 text-sm">{t.cart.multiVendor}</p>
                <p className="text-xs text-amber-700 mt-0.5">{t.cart.multiVendorDesc}</p>
              </div>
            </div>
          </div>
        )}

        {safeItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-surface-container-low dark:bg-[var(--color-surface-container)] rounded-xl p-3 sm:p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <span className="material-symbols-outlined text-primary/10 text-6xl absolute -top-2 -right-2">lunch_dining</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-[18px]">
                      {vendor.id === PRINTING_VENDOR_ID ? "print" : "restaurant"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold tracking-tight truncate">{vendor.name}</h2>
                    <p className="text-[10px] font-medium text-primary uppercase tracking-widest">{t.cart.priorityDelivery}</p>
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                  {vendor.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 sm:gap-3 bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] p-2.5 sm:p-3 rounded-xl shadow-sm">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container dark:bg-[var(--color-surface-container)]">
                        {item.image_url ? (
                          <BlurImage src={item.image_url} alt={item.name} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 25vw" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-outline-variant text-2xl">{item.vendor_id === PRINTING_VENDOR_ID ? "print" : "fastfood"}</span>
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-on-surface dark:text-[var(--color-on-surface)] text-sm truncate">{item.name}</h3>
                        {item.special_notes && item.vendor_id === PRINTING_VENDOR_ID ? (
                          <p className="text-xs text-on-surface-variant dark:text-[var(--color-outline)] truncate">
                            {(() => { try { const s = JSON.parse(item.special_notes!); return `${s.pages}pg × ${s.copies}cp · ${s.colorMode === "bw" ? "B&W" : "Color"} · ${s.paperSize?.toUpperCase()}`; } catch { return item.special_notes; } })()}
                          </p>
                        ) : item.special_notes ? (
                          <p className="text-xs text-on-surface-variant dark:text-[var(--color-outline)] truncate">{item.special_notes}</p>
                        ) : null}
                        <span className="text-primary font-bold text-sm">₹{item.price.toFixed(2)}</span>
                      </div>
                      {/* Controls */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center bg-surface-container dark:bg-[var(--color-surface-container)] rounded-full">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-lowest transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">remove</span>
                          </button>
                          <span className="px-2 font-bold text-sm" aria-live="polite" aria-atomic="true">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-lowest transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => saveForLater(item.id)}
                            className="text-[9px] font-bold text-on-surface-variant dark:text-[var(--color-outline)] hover:text-primary transition-colors uppercase tracking-wider"
                          >
                            Save Later
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[9px] font-bold text-on-surface-variant dark:text-[var(--color-outline)] hover:text-primary transition-colors uppercase tracking-wider"
                          >
                            {t.cart.remove}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center text-xs border-t border-outline-variant/20 dark:border-t-[var(--color-border-subtle)]/20 pt-3">
                  <span className="text-on-surface-variant dark:text-[var(--color-outline)]">{t.cart.subtotal} ({vendor.name})</span>
                  <span className="font-bold">₹{subtotalByVendor(vendor.id).toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* Saved for Later */}
            {savedItems.length > 0 && (
              <div className="bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-[0px_4px_20px_rgba(77,33,42,0.06)] border border-outline-variant/10 dark:border-[var(--color-border-subtle)]/10">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">bookmark</span>
                  Saved for Later ({savedItems.length})
                </h3>
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface/50 dark:bg-[var(--color-surface)]/50">
                      <BlurImage
                        src={item.image_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.name) + "&background=f3f4f6&color=6b7280"}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface dark:text-[var(--color-on-surface)] truncate">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant dark:text-[var(--color-outline)]">₹{item.price}</p>
                      </div>
                      <button
                        onClick={() => moveToCart(item.id)}
                        className="text-[9px] font-bold text-primary hover:underline uppercase tracking-wider"
                      >
                        Move to Cart
                      </button>
                      <button
                        onClick={() => removeSaved(item.id)}
                        aria-label="Remove saved item"
                        className="text-on-surface-variant dark:text-[var(--color-outline)] hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <section className="bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] rounded-xl p-4 shadow-[0px_4px_20px_rgba(77,33,42,0.06)] border border-outline-variant/10 dark:border-[var(--color-border-subtle)]/10">
              <h3 className="text-base font-bold mb-4">{t.cart.paymentSummary}</h3>
              <div className="space-y-3 text-on-surface-variant dark:text-[var(--color-outline)] text-sm">
                <div className="flex justify-between gap-2">
                  <span>{t.cart.itemsSubtotal}</span>
                  <span className="text-on-surface dark:text-[var(--color-on-surface)] font-semibold truncate">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.cart.deliveryFee}</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t.cart.serviceCharge}</span>
                  <span className="text-on-surface font-semibold truncate">₹{(vendorIds.length * serviceCharge).toFixed(2)}</span>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 dark:border-t-[var(--color-border-subtle)]/20 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-widest font-bold text-on-surface dark:text-[var(--color-on-surface)]">{t.cart.totalBalance}</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tighter truncate">₹{grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {showReorderModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="reorder-modal-title" onKeyDown={(e) => { if (e.key === "Escape") setShowReorderModal(false); }}>
            <div className="bg-surface-container-lowest dark:bg-[var(--color-surface-container-lowest)] rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-outline-variant dark:border-[var(--color-border-subtle)] flex items-center justify-between">
                <h3 id="reorder-modal-title" className="text-base font-bold text-on-surface dark:text-[var(--color-on-surface)]">{t.cart.reorderFromPast}</h3>
                <button onClick={() => setShowReorderModal(false)} aria-label="Close" className="w-11 h-11 bg-surface-container dark:bg-[var(--color-surface-container)] rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[65vh]">
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : pastOrders.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant dark:text-[var(--color-outline)] text-sm">{t.cart.noPastOrders}</div>
                ) : (
                  <div className="space-y-3">
                    {pastOrders.map((order) => (
                      <div key={order.id} className="border border-outline-variant dark:border-[var(--color-border-subtle)] rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-on-surface dark:text-[var(--color-on-surface)] text-sm">{order.vendors?.name || "Restaurant"}</p>
                            <p className="text-xs text-on-surface-variant dark:text-[var(--color-outline)]">{new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <p className="font-bold text-primary text-sm">₹{order.total_amount?.toFixed(2)}</p>
                        </div>
                        <button onClick={() => handleReorder(order.id)} disabled={reordering} className="w-full mt-1 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-60">
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
      </main>

      {safeItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-surface/95 dark:bg-[var(--color-surface)]/95 backdrop-blur-xl border-t border-outline-variant/20 dark:border-t-[var(--color-border-subtle)]/20 shadow-[0px_-10px_30px_rgba(77,33,42,0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[var(--color-on-surface-variant)] dark:text-[var(--color-outline)] font-semibold uppercase tracking-wider">{t.cart.total}</p>
              <p className="text-xl sm:text-2xl font-extrabold text-primary truncate">₹{grandTotal.toFixed(2)}</p>
            </div>
            <Link
              href="/app/checkout"
              className="shrink-0 px-5 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {t.cart.proceed}
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

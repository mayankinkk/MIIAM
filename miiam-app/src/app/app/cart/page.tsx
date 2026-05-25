"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store/cartStore";
import { EmptyCart } from "@/components/ui/EmptyStates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store/toastStore";
import Breadcrumbs from "@/components/Breadcrumbs";
import BlurImage from "@/components/BlurImage";
import { StaggerContainer, StaggerItem } from "@/components/ui/AnimationWrappers";

const supabase = createClient();
const POINTS_TO_RUPEE = 0.1;

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, subtotalByVendor, clearCart, addItem } = useCartStore();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const router = useRouter();
  const { addToast } = useToastStore();

  useEffect(() => {
    async function loadLoyaltyPoints() {
      setLoyaltyLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_loyalty_points")
          .eq("id", user.id)
          .single();
        if (profile) setPointsBalance(profile.total_loyalty_points || 0);
      }
      setLoyaltyLoading(false);
    }
    loadLoyaltyPoints();
  }, []);

  const vendors = Array.from(new Set(items.map((i) => i.vendor_id))).map((vid) => ({
    id: vid,
    name: items.find((i) => i.vendor_id === vid)?.vendor_name ?? vid,
    items: items.filter((i) => i.vendor_id === vid),
  }));

  const hasMultipleVendors = vendors.length > 1;

  const total = totalPrice();
  const deliveryFee = total > 0 ? 5.99 : 0;
  const pointsDiscount = +(pointsToRedeem * POINTS_TO_RUPEE).toFixed(2);
  const grandTotal = Math.max(0, total + deliveryFee - pointsDiscount);
  const maxRedeemable = Math.min(pointsBalance, Math.floor((total + deliveryFee) / POINTS_TO_RUPEE));

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
        for (const item of orderItems) {
          if (item.menu_items) {
            addItem({
              id: item.menu_item_id,
              menu_item_id: item.menu_item_id,
              vendor_id: item.menu_items.vendor_id,
              vendor_name: item.menu_items.vendor_name || "Vendor",
              name: item.menu_items.name,
              price: item.unit_price,
              image_url: item.menu_items.image_url,
            }, item.quantity);
          }
        }
      }
      setShowReorderModal(false);
      router.push("/app/cart");
    } catch (error) {
      console.error("Reorder failed:", error);
      addToast("Failed to reorder. Please try again.", "error");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-surface/90 backdrop-blur-2xl shadow-[0px_4px_20px_rgba(77,33,42,0.06)]"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <span className="text-xl font-extrabold tracking-tighter text-primary">MIIAM</span>
        <div className="flex items-center gap-3">
          <Link href="/app/notifications" className="p-2 rounded-full hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-on-surface text-[22px]">notifications</span>
          </Link>
          <Link href="/app/profile" className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-container bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">person</span>
          </Link>
        </div>
      </header>

      <Breadcrumbs items={[{ label: 'Home', href: '/app/explore' }, { label: 'Cart' }]} />

      <main className="pt-4 pb-40 px-4 max-w-2xl mx-auto">
        <section className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary">Your Cart</h1>
          <p className="text-slate-600 text-xs mt-0.5">Review items from your favorite spots.</p>
        </section>

        {hasMultipleVendors && (
          <div className="mb-4 bg-surface-container-low border border-amber-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5">warning</span>
              <div className="flex-1">
                <p className="font-bold text-amber-800 text-sm">Items from multiple restaurants</p>
                <p className="text-xs text-amber-700 mt-0.5">These will be delivered as separate orders.</p>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-surface-container-low rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <span className="material-symbols-outlined text-primary/10 text-6xl absolute -top-2 -right-2">lunch_dining</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-[18px]">restaurant</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight">{vendor.name}</h2>
                    <p className="text-[10px] font-medium text-primary uppercase tracking-widest">Priority Delivery</p>
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                  <StaggerContainer staggerDelay={0.03}>
                  {vendor.items.map((item) => (
                    <StaggerItem key={item.menu_item_id}>
                    <div className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl shadow-sm">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                        {item.image_url ? (
                          <BlurImage src={item.image_url} alt={item.name} fill className="w-full h-full" sizes="(max-width: 768px) 50vw, 25vw" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-outline-variant text-2xl">fastfood</span>
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-on-surface text-sm truncate">{item.name}</h3>
                        {item.special_notes && <p className="text-xs text-on-surface-variant truncate">{item.special_notes}</p>}
                        <span className="text-primary font-bold text-sm">₹{item.price.toFixed(2)}</span>
                      </div>
                      {/* Controls */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center bg-surface-container rounded-full">
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-lowest transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">remove</span>
                          </button>
                          <span className="px-2 font-bold text-sm" aria-live="polite" aria-atomic="true">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-lowest transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.menu_item_id)}
                          className="text-[9px] font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    </StaggerItem>
                  ))}
                  </StaggerContainer>
                </div>
                <div className="mt-4 flex justify-between items-center text-xs border-t border-outline-variant/20 pt-3">
                  <span className="text-on-surface-variant">Subtotal ({vendor.name})</span>
                  <span className="font-bold">₹{subtotalByVendor(vendor.id).toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <section className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_4px_20px_rgba(77,33,42,0.06)] border border-outline-variant/10">
              <h3 className="text-base font-bold mb-4">Payment Summary</h3>
              <div className="space-y-3 text-on-surface-variant text-sm">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="text-on-surface font-semibold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery &amp; Service Fee</span>
                  <span className="text-on-surface font-semibold">₹{deliveryFee.toFixed(2)}</span>
                </div>
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                      Points Discount
                    </span>
                    <span className="font-semibold">–₹{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-on-surface">Total Balance</p>
                    <p className="text-3xl font-extrabold text-primary tracking-tighter">₹{grandTotal.toFixed(2)}</p>
                  </div>
                  <p className="text-[10px] bg-[#ffd709] text-[#453900] px-2 py-1 rounded-full font-bold">
                    EARN {Math.floor(grandTotal)} PTS
                  </p>
                </div>
              </div>

              {/* Loyalty Points Redemption */}
              {loyaltyLoading ? (
                <div className="mt-4 bg-gradient-to-r from-[#ffd709]/20 to-[#ffe9a0]/20 rounded-xl p-4 border border-[#ffd709]/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-40 bg-[#ffd709]/40 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-[#ffd709]/40 rounded-full animate-pulse" />
                  </div>
                  <div className="h-3 w-56 bg-[#ffd709]/30 rounded mb-3 animate-pulse" />
                  <div className="h-2 w-full bg-[#ffd709]/30 rounded-full animate-pulse" />
                </div>
              ) : (
              <div className="mt-4 bg-gradient-to-r from-[#ffd709]/20 to-[#ffe9a0]/20 rounded-xl p-4 border border-[#ffd709]/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#b08800] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    <span className="font-extrabold text-[#453900] text-sm">Redeem Loyalty Points</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ffd709] text-[#453900] px-2 py-0.5 rounded-full">
                    {pointsBalance} pts
                  </span>
                </div>
                <p className="text-[11px] text-[#665500] mb-3">1 pt = ₹{POINTS_TO_RUPEE} &nbsp;|&nbsp; Using {pointsToRedeem} pts = saves ₹{pointsDiscount.toFixed(2)}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={maxRedeemable}
                    step={10}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    className="flex-1 accent-[#b08800] h-2 rounded-full cursor-pointer"
                  />
                  <span className="text-sm font-extrabold text-[#453900] w-14 text-right">{pointsToRedeem} pts</span>
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-semibold text-[#665500]">
                  <span>0</span>
                  <span>{maxRedeemable} pts (max)</span>
                </div>
              </div>
              )}
            </section>
          </div>
        )}

        {showReorderModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center animate-fade-in">
            <div className="bg-surface-container-lowest rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-outline-variant flex items-center justify-between">
                <h3 className="text-base font-bold text-on-surface">Reorder from Past</h3>
                <button onClick={() => setShowReorderModal(false)} className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[65vh]">
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : pastOrders.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant text-sm">No past orders found</div>
                ) : (
                  <div className="space-y-3">
                    {pastOrders.map((order) => (
                      <div key={order.id} className="border border-outline-variant rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-on-surface text-sm">{order.vendors?.name || "Restaurant"}</p>
                            <p className="text-xs text-on-surface-variant">{new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <p className="font-bold text-primary text-sm">₹{order.total_amount?.toFixed(2)}</p>
                        </div>
                        <button onClick={() => handleReorder(order.id)} disabled={reordering} className="w-full mt-1 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-60">
                          {reordering ? "Adding..." : "Add to Cart"}
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

      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0px_-10px_30px_rgba(77,33,42,0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-extrabold text-primary">₹{grandTotal.toFixed(2)}</p>
              {pointsDiscount > 0 && (
                <p className="text-[10px] text-secondary font-semibold">Saving ₹{pointsDiscount.toFixed(2)}</p>
              )}
            </div>
            <Link
              href={`/app/checkout${pointsToRedeem > 0 ? `?redeemPts=${pointsToRedeem}` : ""}`}
              className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              Proceed
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

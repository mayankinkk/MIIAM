"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import { EmptyCart } from "@/components/ui/EmptyStates";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const POINTS_TO_RUPEE = 0.1;

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, subtotalByVendor, clearCart, addItem } = useCartStore();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadLoyaltyPoints() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_loyalty_points")
          .eq("id", user.id)
          .single();
        if (profile) setPointsBalance(profile.total_loyalty_points || 0);
      }
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
    } finally {
      setReordering(false);
    }
  };

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 py-3 bg-[#fff4f4]/90 backdrop-blur-2xl shadow-[0px_4px_20px_rgba(77,33,42,0.06)]"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <span className="text-xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        <div className="flex items-center gap-3">
          <Link href="/app/notifications" className="p-2 rounded-full hover:bg-[#ffe1e4] transition-all">
            <span className="material-symbols-outlined text-[#4d212a] text-[22px]">notifications</span>
          </Link>
          <Link href="/app/profile" className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#ff7670] bg-[#ff7670] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">person</span>
          </Link>
        </div>
      </header>

      <main className="pt-20 pb-28 px-4 max-w-2xl mx-auto">
        <section className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#ba001c]">Your Cart</h1>
          <p className="text-[#814c55] text-xs mt-0.5">Review items from your favorite spots.</p>
        </section>

        {hasMultipleVendors && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
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
              <div key={vendor.id} className="bg-[#ffecee] rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <span className="material-symbols-outlined text-[#ba001c]/10 text-6xl absolute -top-2 -right-2">lunch_dining</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#ba001c] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-white text-[18px]">restaurant</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight">{vendor.name}</h2>
                    <p className="text-[10px] font-medium text-[#ba001c] uppercase tracking-widest">Priority Delivery</p>
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                  {vendor.items.map((item) => (
                    <div key={item.menu_item_id} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#ffe1e4]">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#dd9ca6] text-2xl">fastfood</span>
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#4d212a] text-sm truncate">{item.name}</h3>
                        {item.special_notes && <p className="text-xs text-[#814c55] truncate">{item.special_notes}</p>}
                        <span className="text-[#ba001c] font-bold text-sm">₹{item.price.toFixed(2)}</span>
                      </div>
                      {/* Controls */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center bg-[#ffe1e4] rounded-full">
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="px-2 font-bold text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.menu_item_id)}
                          className="text-[9px] font-bold text-[#814c55] hover:text-[#ba001c] transition-colors uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center text-xs border-t border-[#dd9ca6]/20 pt-3">
                  <span className="text-[#814c55]">Subtotal ({vendor.name})</span>
                  <span className="font-bold">₹{subtotalByVendor(vendor.id).toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <section className="bg-white rounded-xl p-4 shadow-[0px_4px_20px_rgba(77,33,42,0.06)] border border-[#dd9ca6]/10">
              <h3 className="text-base font-bold mb-4">Payment Summary</h3>
              <div className="space-y-3 text-[#814c55] text-sm">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="text-[#4d212a] font-semibold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery &amp; Service Fee</span>
                  <span className="text-[#4d212a] font-semibold">₹{deliveryFee.toFixed(2)}</span>
                </div>
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-[#0b50d5]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                      Points Discount
                    </span>
                    <span className="font-semibold">–₹{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-[#dd9ca6]/20 flex justify-between items-center">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-[#4d212a]">Total Balance</p>
                    <p className="text-3xl font-extrabold text-[#ba001c] tracking-tighter">₹{grandTotal.toFixed(2)}</p>
                  </div>
                  <p className="text-[10px] bg-[#ffd709] text-[#453900] px-2 py-1 rounded-full font-bold">
                    EARN {Math.floor(grandTotal)} PTS
                  </p>
                </div>
              </div>

              {/* Loyalty Points Redemption */}
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

              <Link
                href={`/app/checkout${pointsToRedeem > 0 ? `?redeemPts=${pointsToRedeem}` : ""}`}
                className="w-full mt-4 py-4 bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white rounded-xl font-bold text-base shadow-lg shadow-[#ba001c]/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </section>
          </div>
        )}

        {showReorderModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
            <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#4d212a]">Reorder from Past</h3>
                <button onClick={() => setShowReorderModal(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[65vh]">
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : pastOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">No past orders found</div>
                ) : (
                  <div className="space-y-3">
                    {pastOrders.map((order) => (
                      <div key={order.id} className="border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-[#4d212a] text-sm">{order.vendors?.name || "Restaurant"}</p>
                            <p className="text-xs text-slate-500">{new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <p className="font-bold text-[#ba001c] text-sm">₹{order.total_amount?.toFixed(2)}</p>
                        </div>
                        <button onClick={() => handleReorder(order.id)} disabled={reordering} className="w-full mt-1 py-2 bg-[#ba001c] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-60">
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
    </>
  );
}

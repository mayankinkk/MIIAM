"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const POINTS_BALANCE = 350;
const POINTS_TO_RUPEE = 0.1;

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, subtotalByVendor, clearCart, addItem } = useCartStore();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const router = useRouter();

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
  const maxRedeemable = Math.min(POINTS_BALANCE, Math.floor((total + deliveryFee) / POINTS_TO_RUPEE));

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
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
        <div className="flex items-center gap-4">
          <Link href="/app/notifications" className="p-2 rounded-full hover:bg-[#ffe1e4] transition-all">
            <span className="material-symbols-outlined text-[#4d212a]">notifications</span>
          </Link>
          <Link href="/app/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff7670] bg-[#ff7670] flex items-center justify-center">
            <span className="material-symbols-outlined text-white">person</span>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <section className="mb-10">
          <h1 className="text-[3.5rem] font-extrabold tracking-tight leading-none mb-2 text-[#ba001c]">Your Cart</h1>
          <p className="text-[#814c55] text-lg">Review items from your favorite spots.</p>
        </section>

        {hasMultipleVendors && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
              <div className="flex-1">
                <p className="font-bold text-amber-800">Items from multiple restaurants</p>
                <p className="text-sm text-amber-700 mt-1">These will be delivered as separate orders. Do you want to continue?</p>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-[#4d212a] mb-3">Your cart is empty</h2>
            <p className="text-[#814c55] mb-6">Add items from vendors to get started.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/app/explore" className="bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white px-8 py-3 rounded-xl font-bold inline-block hover:scale-105 transition-transform shadow-lg shadow-[#ba001c]/20">
                Explore Vendors
              </Link>
              <button onClick={() => { fetchPastOrders(); setShowReorderModal(true); }} className="bg-white border border-[#dd9ca6]/30 text-[#4d212a] px-8 py-3 rounded-xl font-bold hover:border-[#ba001c] transition-colors">
                <span className="material-symbols-outlined align-middle mr-2">refresh</span>
                Reorder Past
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-[#ffecee] rounded-lg p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <span className="material-symbols-outlined text-[#ba001c]/10 text-8xl absolute -top-4 -right-4">lunch_dining</span>
                </div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-full bg-[#ba001c] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">restaurant</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{vendor.name}</h2>
                    <p className="text-xs font-medium text-[#ba001c] uppercase tracking-widest">Priority Delivery</p>
                  </div>
                </div>
                <div className="space-y-6 relative z-10">
                  {vendor.items.map((item) => (
                    <div key={item.menu_item_id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#ffe1e4]">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-[#dd9ca6] text-3xl">fastfood</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#4d212a]">{item.name}</h3>
                          {item.special_notes && <p className="text-sm text-[#814c55]">{item.special_notes}</p>}
                          <span className="text-[#ba001c] font-bold mt-1 block">₹{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center bg-[#ffe1e4] rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="px-4 font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.menu_item_id)}
                          className="text-[10px] font-bold text-[#814c55] hover:text-[#ba001c] transition-colors uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-between items-center text-sm border-t border-[#dd9ca6]/20 pt-4">
                  <span className="text-[#814c55]">Subtotal ({vendor.name})</span>
                  <span className="font-bold">₹{subtotalByVendor(vendor.id).toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <section className="bg-white rounded-lg p-8 shadow-[0px_20px_40px_rgba(77,33,42,0.06)] border border-[#dd9ca6]/10">
              <h3 className="text-xl font-bold mb-6">Payment Summary</h3>
              <div className="space-y-4 text-[#814c55]">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="text-[#4d212a] font-semibold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery & Service Fee</span>
                  <span className="text-[#4d212a] font-semibold">₹{deliveryFee.toFixed(2)}</span>
                </div>
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-[#0b50d5]">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                      Points Discount
                    </span>
                    <span className="font-semibold">–₹{pointsDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-[#dd9ca6]/20 flex justify-between items-end">
                  <div>
                    <p className="text-sm uppercase tracking-widest font-bold text-[#4d212a]">Total Balance</p>
                    <p className="text-4xl font-extrabold text-[#ba001c] tracking-tighter">₹{grandTotal.toFixed(2)}</p>
                  </div>
                  <p className="text-[10px] bg-[#ffd709] text-[#453900] px-2 py-1 rounded-full font-bold inline-block">
                    EARN {Math.floor(grandTotal)} POINTS
                  </p>
                </div>
              </div>

              {/* ── Loyalty Points Redemption ── */}
              <div className="mt-8 bg-gradient-to-r from-[#ffd709]/20 to-[#ffe9a0]/20 rounded-2xl p-5 border border-[#ffd709]/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#b08800] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                    <span className="font-extrabold text-[#453900]">Redeem Loyalty Points</span>
                  </div>
                  <span className="text-xs font-bold bg-[#ffd709] text-[#453900] px-2 py-1 rounded-full">
                    {POINTS_BALANCE} pts available
                  </span>
                </div>
                <p className="text-xs text-[#665500] mb-4">1 point = ₹{POINTS_TO_RUPEE} &nbsp;|&nbsp; Using {pointsToRedeem} pts = saves ₹{pointsDiscount.toFixed(2)}</p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={maxRedeemable}
                    step={10}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    className="flex-1 accent-[#b08800] h-2 rounded-full cursor-pointer"
                  />
                  <span className="text-lg font-extrabold text-[#453900] w-16 text-right">{pointsToRedeem} pts</span>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-semibold text-[#665500]">
                  <span>0</span>
                  <span>{maxRedeemable} pts (max)</span>
                </div>
              </div>

              <Link
                href="/app/checkout"
                className="w-full mt-8 py-6 bg-gradient-to-r from-[#ba001c] to-[#ff7670] text-white rounded-xl font-bold text-xl shadow-lg shadow-[#ba001c]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Proceed to Checkout
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </section>
          </div>
        )}

        {showReorderModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#4d212a]">Reorder from Past</h3>
                <button onClick={() => setShowReorderModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : pastOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>No past orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastOrders.map((order) => (
                      <div key={order.id} className="border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-[#4d212a]">{order.vendors?.name || "Restaurant"}</p>
                            <p className="text-xs text-slate-500">{new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <p className="font-bold text-[#ba001c]">₹{order.total_amount?.toFixed(2)}</p>
                        </div>
                        <button onClick={() => handleReorder(order.id)} disabled={reordering} className="w-full mt-2 py-2 bg-[#ba001c] text-white text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-60">
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

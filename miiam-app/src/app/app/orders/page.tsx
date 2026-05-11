"use client";

import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store/cartStore";

const statusColors: Record<string, string> = {
  pending: "bg-[#ffd709]/20 text-[#453900]",
  accepted: "bg-[#c4d0ff]/30 text-[#003dac]",
  preparing: "bg-[#c4d0ff]/30 text-[#003dac]",
  picking_up: "bg-[#ffe1e4] text-[#ba001c]",
  on_the_way: "bg-[#ffe1e4] text-[#ba001c]",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-[#f95630]/10 text-[#b02500]",
};

export default function OrdersPage() {
  const [reordering, setReordering] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { addItem } = useCartStore();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`orders-list-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      }, (payload: any) => {
        if (payload.new?.user_id === userId) {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchOrders = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      setUserId(authUser.id);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", authUser.id)
        .order("placed_at", { ascending: false });

      console.log("Orders response:", ordersData, "error:", ordersError);
      if (ordersError) {
        console.error("Fetch orders error:", ordersError.message);
        throw ordersError;
      }
      
      // Fetch vendors separately
      if (ordersData && ordersData.length > 0) {
        const vendorIds = [...new Set(ordersData.map(o => o.vendor_id).filter(Boolean))];
        const { data: vendorsData } = await supabase
          .from("vendors")
          .select("id, name, image_url")
          .in("id", vendorIds);
        
        const vendorMap = new Map(vendorsData?.map(v => [v.id, v]) || []);
        const ordersWithVendors = ordersData.map(order => ({
          ...order,
          vendor: vendorMap.get(order.vendor_id) || null
        }));
        setOrders(ordersWithVendors);
      } else {
        setOrders([]);
      }
    } catch (error: any) {
      console.error("Error fetching orders:", error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (order: Order) => {
    setReordering(order.id);
    try {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*, menu_item:menu_items(*)")
        .eq("order_id", order.id);

      if (orderItems) {
        for (const item of orderItems) {
          if (item.menu_item) {
            for (let i = 0; i < item.quantity; i++) {
              addItem({
                id: item.menu_item_id,
                menu_item_id: item.menu_item_id,
                vendor_id: order.vendor_id,
                vendor_name: order.vendor?.name || "Vendor",
                name: item.menu_item.name,
                price: item.unit_price,
                image_url: item.menu_item.image_url || undefined,
              });
            }
          }
        }
        router.push("/app/cart");
      }
    } catch (error) {
      console.error("Reorder failed:", error);
    } finally {
      setReordering(null);
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#fff4f4]/80 backdrop-blur-2xl shadow-[0px_20px_40px_rgba(77,33,42,0.06)]">
        <span className="text-2xl font-extrabold tracking-tighter text-[#ba001c]">MIIAM</span>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto">
        <section className="mb-10">
          <h1 className="text-[3.5rem] font-extrabold tracking-tight leading-none mb-2 text-[#4d212a]">My Orders</h1>
          <p className="text-[#814c55] text-lg">Track and manage your orders.</p>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-[#ba001c] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#814c55] font-medium">Fetching your orders...</p>
          </div>
        ) : !user ? (
          <div className="text-center py-24">
            <div className="text-8xl mb-6">👤</div>
            <h2 className="text-2xl font-bold text-[#4d212a] mb-3">Please log in</h2>
            <p className="text-[#814c55] mb-8">You need to be logged in to view your orders.</p>
            <Link href="/auth/login" className="bg-[#ba001c] text-white px-10 py-4 rounded-xl font-bold inline-block">
              Go to Login
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-8xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-[#4d212a] mb-3">No orders yet</h2>
            <p className="text-[#814c55] mb-8">Your order history will appear here.</p>
            <Link href="/app/explore" className="bg-[#ba001c] text-white px-10 py-4 rounded-xl font-bold inline-block hover:scale-105 transition-transform">
              Start Ordering
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-[0px_10px_30px_rgba(77,33,42,0.04)] overflow-hidden">
                <Link href={`/app/orders/${order.id}`} className="block p-6 hover:bg-[#ffecee]/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#ffe1e4] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {order.vendor?.image_url ? (
                        <img src={order.vendor.image_url} alt={order.vendor.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-[#dd9ca6] text-3xl">restaurant</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-[#4d212a]">{order.vendor?.name ?? "Order"}</h3>
                          <p className="text-xs text-[#814c55]">
                            {new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusColors[order.status] ?? "bg-[#ffe1e4] text-[#ba001c]"}`}>
                            {order.status.replace(/_/g, " ")}
                          </span>
                          <p className="font-bold text-[#4d212a] mt-2">₹{order.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#814c55]">chevron_right</span>
                  </div>
                </Link>
                {order.status === "delivered" && (
                  <div className="border-t border-[#dd9ca6]/20 px-6 py-4 flex gap-3">
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reordering === order.id}
                      className="flex-1 bg-[#ba001c] text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      {reordering === order.id ? "Adding..." : "Reorder"}
                    </button>
                    <Link
                      href={`/app/orders/${order.id}/review`}
                      className="flex-1 bg-white border border-[#dd9ca6]/30 text-[#4d212a] py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:border-[#ba001c]"
                    >
                      <span className="material-symbols-outlined text-sm">star</span>
                      Rate
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
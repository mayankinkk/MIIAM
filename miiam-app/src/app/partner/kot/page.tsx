"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorIdForUser } from "@/lib/vendor";
import type { Order, OrderStatus } from "@/lib/types";

export default function PartnerKOTPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mountedRef.current = true;
    init();
    return () => { mountedRef.current = false; };
  }, []);

  const mountedRef = useRef(true);

  async function init() {
    const id = await getVendorIdForUser();
    if (!mountedRef.current || !id) return;
    setVendorId(id);
    await loadOrders(id);
  }

  async function loadOrders(vId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", vId)
      .in("status", ["confirmed", "preparing"])
      .order("placed_at", { ascending: true });
    if (mountedRef.current && data) setOrders(data as Order[]);
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }

  if (loading) return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Loading tickets...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">KOT</h1>
        <p className="text-slate-500 text-sm mt-1">Kitchen Order Tickets — pending preparation</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <span className="material-symbols-outlined text-5xl text-slate-300">restaurant</span>
          <p className="text-slate-400 font-medium mt-3">No pending tickets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5">{order.customer_name || "Guest"}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${order.status === "confirmed" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                  {order.status}
                </span>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      <span className="font-bold mr-2">×{item.quantity}</span>
                      {item.name || "Unknown"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex gap-2 pt-1">
                {order.status === "confirmed" && (
                  <button
                    onClick={() => updateStatus(order.id, "preparing")}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    onClick={() => updateStatus(order.id, "ready")}
                    className="flex-1 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

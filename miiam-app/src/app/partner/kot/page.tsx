"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorIdForUser } from "@/lib/vendor";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export default function PartnerKOTPage() {
  const supabase = useMemo(() => createClient(), []);
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
      .select("*, items:order_items(*)")
      .eq("vendor_id", vId)
      .in("status", ["accepted", "preparing"])
      .order("placed_at", { ascending: true });
    if (mountedRef.current && data) setOrders(data as Order[]);
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }

  if (loading) return <div className="p-8 text-center text-[var(--color-outline-variant)] font-medium animate-pulse">Loading tickets...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight">KOT</h1>
        <p className="text-[var(--color-outline)] text-sm mt-1">Kitchen Order Tickets — pending preparation</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-12 text-center border border-[var(--color-border-subtle)]">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">restaurant</span>
          <p className="text-[var(--color-outline-variant)] font-medium mt-3">No pending tickets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-5 space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--color-outline-variant)]">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-lg font-extrabold text-[var(--color-on-surface)] mt-0.5">{order.customer_name || "Guest"}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${order.status === ("confirmed" as OrderStatus) ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                  {order.status}
                </span>
              </div>
              <div className="border-t border-[var(--color-border-subtle)] pt-3 space-y-2">
                {order.items?.map((item: OrderItem, i: number) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-on-surface)]">
                        <span className="font-bold mr-2">×{item.quantity}</span>
                        {item.menu_item?.name || "Unknown"}
                      </span>
                    </div>
                    {item.special_notes && (
                      <p className="text-xs text-amber-600 ml-6 mt-0.5">📝 {item.special_notes}</p>
                    )}
                  </div>
                ))}
              </div>
              {order.special_instructions && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 mb-0.5">Order Note:</p>
                  <p className="text-xs text-amber-800">{order.special_instructions}</p>
                </div>
              )}
              <div className="text-xs text-[var(--color-outline-variant)]">
                {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="flex gap-2 pt-1">
                {order.status === "accepted" && (
                  <button
                    onClick={() => updateStatus(order.id, "preparing")}
                    className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    onClick={() => updateStatus(order.id, "ready_for_pickup")}
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

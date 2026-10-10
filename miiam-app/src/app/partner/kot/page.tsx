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
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mountedRef = useRef(true);

  async function init() {
    const id = await getVendorIdForUser();
    if (!mountedRef.current) return;
    if (!id) {
      setLoading(false);
      return;
    }
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
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }

  if (loading)
    return (
      <div className="animate-pulse p-8 text-center font-medium text-[var(--color-outline-variant)]">
        Loading tickets...
      </div>
    );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
          KOT
        </h1>
        <p className="mt-1 text-sm text-[var(--color-outline)]">
          Kitchen Order Tickets — pending preparation
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]/60">
            restaurant
          </span>
          <p className="mt-3 font-medium text-[var(--color-outline-variant)]">No pending tickets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="space-y-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--color-outline-variant)]">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-0.5 text-lg font-extrabold text-[var(--color-on-surface)]">
                    {order.customer_name || "Guest"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${order.status === ("confirmed" as OrderStatus) ? "bg-amber-100 text-amber-700" : "bg-deal/10 text-deal"}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="space-y-2 border-t border-[var(--color-border-subtle)] pt-3">
                {order.items?.map((item: OrderItem, i: number) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--color-on-surface)]">
                        <span className="mr-2 font-bold">×{item.quantity}</span>
                        {item.menu_item?.name || "Unknown"}
                      </span>
                    </div>
                    {item.special_notes && (
                      <p className="mt-0.5 ml-6 text-xs text-amber-600">📝 {item.special_notes}</p>
                    )}
                  </div>
                ))}
              </div>
              {order.special_instructions && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-0.5 text-xs font-bold text-amber-700">Order Note:</p>
                  <p className="text-xs text-amber-800">{order.special_instructions}</p>
                </div>
              )}
              <div className="text-xs text-[var(--color-outline-variant)]">
                {new Date(order.placed_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="flex gap-2 pt-1">
                {order.status === "accepted" && (
                  <button
                    onClick={() => updateStatus(order.id, "preparing")}
                    className="bg-primary text-on-primary hover:bg-primary-hover flex-1 rounded-xl py-2.5 text-xs font-bold"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === "preparing" && (
                  <button
                    onClick={() => updateStatus(order.id, "ready_for_pickup")}
                    className="flex-1 rounded-xl bg-green-600 py-2.5 text-xs font-bold text-white hover:bg-green-700"
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

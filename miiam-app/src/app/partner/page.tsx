"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorIdForUser, getVendorMenuItems } from "@/lib/vendor";
import type { Order, OrderStatus } from "@/lib/types";

export default function PartnerPOS() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuItemNames, setMenuItemNames] = useState<Map<string, { name: string }>>(new Map());

  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      try {
        const id = await getVendorIdForUser();
        if (!mountedRef.current || !id) return;
        setVendorId(id);
        await loadOrders(id);
        if (mountedRef.current) {
          if (channelRef.current) supabase.removeChannel(channelRef.current);
          channelRef.current = subscribeToOrders(id);
        }
      } catch (err: any) {
        if (mountedRef.current) setError(err.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  async function loadOrders(vId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("vendor_id", vId)
      .order("placed_at", { ascending: false });
    if (error) throw error;
    if (data) {
      setOrders(data);
      const names = await getVendorMenuItems(vId);
      setMenuItemNames(names);
    }
  }

  function subscribeToOrders(vId: string) {
    const channel = supabase
      .channel("pos_orders_" + vId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `vendor_id=eq.${vId}` },
        () => {
          loadOrders(vId);
        }
      )
      .subscribe();
    return channel;
  }

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    if (["accepted", "preparing", "ready_for_pickup"].includes(newStatus)) {
      try {
        await fetch("/api/emails/order-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: newStatus }),
        });
      } catch { /* ignore */ }
    }
  };

  const statusActions: Record<string, { label: string; next: OrderStatus; color: string }[] | null> = {
    pending: [{ label: "Accept Order", next: "accepted", color: "bg-green-600 hover:bg-green-700" }],
    accepted: [{ label: "Start Preparing", next: "preparing", color: "bg-amber-600 hover:bg-amber-700" }],
    preparing: [{ label: "Mark Ready for Pickup", next: "ready_for_pickup", color: "bg-indigo-600 hover:bg-indigo-700" }],
    ready_for_pickup: null,
    on_the_way: null,
  };

  const statusBadge: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-blue-100 text-blue-700",
    preparing: "bg-indigo-100 text-indigo-700",
    ready_for_pickup: "bg-purple-100 text-purple-700",
    on_the_way: "bg-cyan-100 text-cyan-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const terminalStatuses = ["delivered", "cancelled", "refunded"];

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">Loading POS...</div>;
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-red-300 mb-4">error</span>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Something went wrong</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">storefront</span>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">No Vendor Account</h2>
        <p className="text-slate-500">Register your store to start receiving orders.</p>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => !terminalStatuses.includes(o.status));
  const pastOrders = orders.filter((o) => terminalStatuses.includes(o.status));

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Live Order POS</h1>
        <p className="text-slate-500">Manage real-time incoming orders — your job ends when order is ready for pickup</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Active</p>
          <p className="text-4xl font-black text-[#ba001c]">{activeOrders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Pending</p>
          <p className="text-4xl font-black text-amber-600">{orders.filter((o) => o.status === "pending").length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Ready for Pickup</p>
          <p className="text-4xl font-black text-purple-600">{orders.filter((o) => o.status === "ready_for_pickup").length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Delivered</p>
          <p className="text-4xl font-black text-green-600">{pastOrders.length}</p>
        </div>
      </div>

      {/* Active Orders Feed */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            Active Orders
          </h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time</span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">check_circle</span>
            <p className="text-slate-400 font-medium text-lg">All caught up!</p>
            <p className="text-slate-300 text-sm mt-1">Waiting for new orders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {activeOrders.map((order) => {
              const actions = statusActions[order.status];
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-black text-slate-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusBadge[order.status] || "bg-slate-100 text-slate-600"}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs font-medium">
                        {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" • "}
                        {order.payment_method === "wallet" ? "Wallet" : "Online"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#ba001c]">₹{order.total_amount.toFixed(2)}</p>
                      {order.delivery_address && (
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[160px] truncate">{order.delivery_address}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <p className="text-slate-700 font-bold">
                          <span className="text-slate-400 mr-2">{item.quantity}x</span>
                          {menuItemNames.get(item.menu_item_id)?.name || "Unknown Item"}
                        </p>
                        <p className="text-slate-500 font-medium">
                          ₹{(item.unit_price * item.quantity).toFixed(0)}
                        </p>
                      </div>
                    ))}
                    {order.special_instructions && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          <span className="font-bold">Note: </span>{order.special_instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {actions ? (
                      actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => updateStatus(order.id, action.next)}
                          className={`flex-1 ${action.color} text-white py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200`}
                        >
                          {action.label}
                        </button>
                      ))
                    ) : order.status === "ready_for_pickup" ? (
                      <div className="flex-1 text-center py-4 rounded-xl bg-purple-50 text-purple-700 font-bold text-sm border border-purple-200">
                        <span className="material-symbols-outlined align-middle text-lg mr-1">pedal_bike</span>
                        Waiting for Rider to Pick Up
                      </div>
                    ) : order.status === "on_the_way" ? (
                      <div className="flex-1 text-center py-4 rounded-xl bg-cyan-50 text-cyan-700 font-bold text-sm border border-cyan-200">
                        <span className="material-symbols-outlined align-middle text-lg mr-1">delivery_truck</span>
                        Out for Delivery — Rider on the Way
                      </div>
                    ) : null}
                    {order.status === "pending" && (
                      <button
                        onClick={() => updateStatus(order.id, "cancelled")}
                        className="px-6 border border-red-200 text-red-400 hover:text-red-600 hover:border-red-300 transition-colors rounded-xl font-bold text-xs"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past Orders */}
      <section className="pt-4">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Completed / Cancelled</h2>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastOrders.slice(0, 15).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs font-bold text-slate-700">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {order.items?.length || 0} items
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        order.status === "delivered" ? "bg-green-100 text-green-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-black text-slate-700 text-right">
                      ₹{order.total_amount.toFixed(0)}
                    </td>
                    <td className="p-4 text-xs text-slate-400 text-right">
                      {new Date(order.placed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

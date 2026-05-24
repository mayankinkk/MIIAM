"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorIdForUser } from "@/lib/vendor";
import type { Order, OrderStatus } from "@/lib/types";

export default function PartnerPOS() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: any = null;

    async function init() {
      try {
        const id = await getVendorIdForUser();
        if (id) {
          setVendorId(id);
          await loadOrders(id);
          channel = subscribeToOrders(id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function loadOrders(vId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, vendor:vendors(name), items:order_items(*, menu_item:menu_items(name))")
      .eq("vendor_id", vId)
      .order("placed_at", { ascending: false });
    if (error) throw error;
    if (data) setOrders(data);
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

    if (["accepted", "preparing"].includes(newStatus)) {
      try {
        await fetch("/api/emails/order-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: newStatus }),
        });
      } catch { /* ignore */ }
    }
  };

  const statusActions: Record<string, { label: string; next: OrderStatus; color: string }[]> = {
    pending: [{ label: "Accept Order", next: "accepted", color: "bg-green-600 hover:bg-green-700" }],
    accepted: [{ label: "Start Preparing", next: "preparing", color: "bg-amber-600 hover:bg-amber-700" }],
    preparing: [{ label: "Mark Ready", next: "picking_up", color: "bg-indigo-600 hover:bg-indigo-700" }],
    picking_up: [{ label: "Hand to Rider", next: "on_the_way", color: "bg-[#ba001c] hover:bg-[#a40017]" }],
    on_the_way: [{ label: "Mark Delivered", next: "delivered", color: "bg-green-600 hover:bg-green-700" }],
  };

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

  const activeOrders = orders.filter((o) => !["delivered", "cancelled", "refunded"].includes(o.status));
  const pastOrders = orders.filter((o) => ["delivered", "cancelled", "refunded"].includes(o.status));

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Live Order POS</h1>
        <p className="text-slate-500">Manage real-time incoming orders</p>
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
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Today Revenue</p>
          <p className="text-4xl font-black text-slate-900">
            ₹{orders.filter((o) => o.status === "delivered").reduce((a, c) => a + c.total_amount, 0).toFixed(0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Completed</p>
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
            {activeOrders.map((order) => (
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
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        order.status === "pending" ? "bg-amber-100 text-amber-700" :
                        order.status === "accepted" ? "bg-blue-100 text-blue-700" :
                        order.status === "preparing" ? "bg-indigo-100 text-indigo-700" :
                        order.status === "picking_up" ? "bg-purple-100 text-purple-700" :
                        "bg-green-100 text-green-700"
                      }`}>
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
                        {item.menu_item?.name || "Unknown Item"}
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
                  {statusActions[order.status]?.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => updateStatus(order.id, action.next)}
                      className={`flex-1 ${action.color} text-white py-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-slate-200`}
                    >
                      {action.label}
                    </button>
                  ))}
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
            ))}
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

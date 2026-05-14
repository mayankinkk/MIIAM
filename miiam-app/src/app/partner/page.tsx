"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";

export default function PartnerPOS() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const { data } = await supabase
        .from("orders")
        .select("*, vendor:vendors(name), items:order_items(*, menu_item:menu_items(name))")
        .order("placed_at", { ascending: false });
      
      if (data) setOrders(data);
      setLoading(false);
    }

    loadOrders();

    // Subscribe to changes
    const channel = supabase
      .channel("pos_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    
    if (error) {
      alert("Error updating status: " + error.message);
      return;
    }

    if (["accepted", "preparing"].includes(newStatus)) {
      try {
        await fetch("/api/emails/order-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: newStatus }),
        });
      } catch (emailErr) {
        console.warn("Failed to send status email:", emailErr);
      }
    }
  };

  const statusActions: Record<string, { label: string; next: OrderStatus; color: string }[]> = {
    pending: [{ label: "Accept Order", next: "accepted", color: "bg-blue-600 hover:bg-blue-700" }],
    accepted: [{ label: "Start Preparing", next: "preparing", color: "bg-amber-600 hover:bg-amber-700" }],
    preparing: [{ label: "Mark Ready / Picking Up", next: "picking_up", color: "bg-indigo-600 hover:bg-indigo-700" }],
    picking_up: [{ label: "Hand to Rider", next: "on_the_way", color: "bg-[#ba001c] hover:bg-[#a40017]" }],
    on_the_way: [{ label: "Delivered", next: "delivered", color: "bg-green-600 hover:bg-green-700" }],
  };

  if (loading) return <div className="p-8 text-slate-500">Loading incoming orders...</div>;

  const activeOrders = orders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status));
  const pastOrders = orders.filter(o => ["delivered", "cancelled", "refunded"].includes(o.status));

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Live Order POS</h1>
        <p className="text-slate-500">Manage real-time incoming delivery requests.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Active Orders</p>
          <p className="text-4xl font-black text-[#ba001c]">{activeOrders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Today's Revenue</p>
          <p className="text-4xl font-black text-slate-900">₹{orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.total_amount, 0).toFixed(0)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Completed Today</p>
          <p className="text-4xl font-black text-green-600">{pastOrders.length}</p>
        </div>
      </div>

      {/* Live Orders Feed */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            Incoming & Active Orders
          </h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Auto-refreshing</span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <p className="text-slate-400 font-medium">No active orders at the moment. Waiting for customers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {activeOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-black text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium">
                      {new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                      {order.payment_method === 'wallet' ? 'Paid via Wallet' : 'Online Payment'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[#ba001c]">₹{order.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <p className="text-slate-700 font-bold">
                        <span className="text-slate-400 mr-2">{item.quantity}x</span>
                        {item.menu_item?.name || "Unknown Item"}
                      </p>
                      <p className="text-slate-500 font-medium">₹{(item.unit_price * item.quantity).toFixed(0)}</p>
                    </div>
                  ))}
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
                  <button 
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="px-6 border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 transition-colors rounded-xl font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section className="pt-8 opacity-60">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Completed / Cancelled Orders</h2>
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastOrders.slice(0, 10).map((order) => (
                <tr key={order.id}>
                  <td className="p-4 text-xs font-bold text-slate-700">{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-4 text-xs text-slate-500 font-medium">Customer {order.user_id.slice(0, 4)}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-black text-slate-700 text-right">₹{order.total_amount.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";
import { PRINTING_VENDOR_ID } from "@/lib/constants";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "scheduled", "accepted", "preparing", "ready_for_pickup", "shopping", "picking_up", "on_the_way", "arrived", "delivered", "cancelled", "refunded", "no_rider_available"];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-indigo-100 text-indigo-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  ready_for_pickup: "bg-orange-100 text-orange-700",
  shopping: "bg-pink-100 text-pink-700",
  picking_up: "bg-orange-100 text-orange-700",
  on_the_way: "bg-cyan-100 text-cyan-700",
  arrived: "bg-teal-100 text-teal-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-slate-100 text-slate-700",
  no_rider_available: "bg-amber-100 text-amber-700",
};

export default function OrderManagement() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();

    const channel = supabase.channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*, vendor:vendors(name), rider:riders(*), user:user_id(*)")
      .order("placed_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  async function deletePrintFiles(orderId: string) {
    const { data: items } = await supabase.from("order_items").select("special_notes").eq("order_id", orderId);
    if (!items) return;
    for (const item of items) {
      if (!item.special_notes) continue;
      try {
        const settings = JSON.parse(item.special_notes);
        const urls: string[] = settings.fileUrls || [];
        for (const url of urls) {
          const path = url.split("/menu-images/")[1];
          if (path) {
            await supabase.storage.from("menu-images").remove([path]);
          }
        }
      } catch {}
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    // Fetch the order first to get user_id
    const { data: order } = await supabase.from("orders").select("user_id, vendor_id").eq("id", orderId).single();
    
    await supabase.from("orders").update({ status }).eq("id", orderId);
    
    // Clean up print files when order is delivered or cancelled
    if (order?.vendor_id === PRINTING_VENDOR_ID && (status === "delivered" || status === "cancelled")) {
      deletePrintFiles(orderId);
    }

    // Send notification to customer
    if (order?.user_id) {
      const notifMap: Record<string, { title: string; body: string }> = {
        accepted: { title: "Order Accepted! 🎉", body: "Your order has been accepted and is being prepared." },
        preparing: { title: "Order Being Prepared 🍳", body: "Your order is being prepared right now!" },
        shopping: { title: "Rider is Shopping 🛒", body: "Your rider is shopping for your items at the store." },
        picking_up: { title: "Rider Heading to Vendor 🛵", body: "A rider is on their way to pick up your order." },
        on_the_way: { title: "Your Order is On the Way! 🚀", body: "Sit tight — your order is heading to you." },
        arrived: { title: "Rider Has Arrived! 📍", body: "Your rider has arrived at your location." },
        delivered: { title: "Order Delivered! ✅", body: "Your order has been delivered. Enjoy! Rate your experience in the app." },
        cancelled: { title: "Order Cancelled ❌", body: "Your order has been cancelled. Contact support if you need help." },
        refunded: { title: "Refund Processed 💰", body: "Your refund has been processed and will reflect shortly." },
      };
      const notif = notifMap[status];
      if (notif) {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: order.user_id, ...notif, type: "order" }),
        });
      }
    }
    
    loadOrders();
    setSelectedOrder(null);
  }

  async function refundOrder(orderId: string) {
    const { data: order } = await supabase.from("orders").select("user_id").eq("id", orderId).single();
    await supabase.from("orders").update({ status: "refunded" }).eq("id", orderId);
    if (order?.user_id) {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: order.user_id, title: "Refund Processed 💰", body: "Your refund has been processed and will reflect shortly.", type: "order" }),
      });
    }
    loadOrders();
    setSelectedOrder(null);
  }

  async function exportToCSV() {
    const headers = ["Order ID", "Vendor", "Status", "Total", "Delivery Fee", "Payment", "Placed At"];
    const rows = filteredOrders.map(o => [
      o.id.slice(0, 8),
      o.vendor?.name || "Unknown",
      o.status,
      o.total_amount,
      o.delivery_fee,
      o.payment_method,
      new Date(o.placed_at).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  }

  async function bulkUpdateStatus(status: OrderStatus) {
    await Promise.all(
      Array.from(selectedIds).map(async (id) => {
        await supabase.from("orders").update({ status }).eq("id", id);
      })
    );
    setSelectedIds(new Set());
    loadOrders();
  }

  const filteredOrders = orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  if (loading) return <div className="px-8">Loading orders...</div>;

  return (
    <div className="px-8 space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-3xl font-black text-slate-800">{orders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
          <p className="text-3xl font-black text-green-600">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-3xl font-black text-yellow-600">{pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Avg Order</p>
          <p className="text-3xl font-black text-slate-800">₹{orders.length ? Math.round(totalRevenue / orders.filter(o => o.status === "delivered").length) : 0}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ba001c]/10"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
              className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs font-bold text-slate-400 self-center">{selectedIds.size} selected</span>
                {["accepted", "cancelled"].map(s => (
                  <button
                    key={s}
                    onClick={() => bulkUpdateStatus(s as OrderStatus)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    Mark {s}
                  </button>
                ))}
              </>
            )}
<button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-[#ba001c]"
                  />
                </th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Placed</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                      className="w-4 h-4 accent-[#ba001c]"
                    />
                  </td>
                  <td className="p-4">
                    <button onClick={() => setSelectedOrder(order)} className="font-mono text-xs font-bold text-[#ba001c] hover:underline">
                      #{order.id.slice(0, 8)}
                    </button>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-600">{order.vendor?.name || "Unknown"}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${STATUS_COLORS[order.status]}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-slate-800">₹{order.total_amount}</td>
                  <td className="p-4 text-right text-xs text-slate-400">
                    {new Date(order.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-slate-400 hover:text-[#ba001c] p-2"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-50 text-xs text-slate-400">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-black text-slate-800">Order #{selectedOrder.id.slice(0, 8)}</h2>
                <p className="text-xs text-slate-400">{new Date(selectedOrder.placed_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 p-2">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Vendor</p>
                  <p className="font-bold text-slate-800">{selectedOrder.vendor?.name}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Rider</p>
                  <p className="font-bold text-slate-800">{selectedOrder.rider?.name || "Not Assigned"}</p>
                  {selectedOrder.rider?.phone && <p className="text-xs text-slate-500">{selectedOrder.rider.phone}</p>}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase">Order Summary</p>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Subtotal</span>
                  <span className="text-sm font-bold">₹{selectedOrder.total_amount - selectedOrder.delivery_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Delivery Fee</span>
                  <span className="text-sm font-bold">₹{selectedOrder.delivery_fee}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Discount</span>
                    <span className="text-sm font-bold">-₹{selectedOrder.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-bold text-slate-800">Total</span>
                  <span className="font-black text-lg">₹{selectedOrder.total_amount}</span>
                </div>
              </div>
              {/* Status Management */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter(s => s !== selectedOrder.status && s !== "refunded").map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${STATUS_COLORS[s]} hover:opacity-80`}
                    >
                      → {s.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedOrder.status !== "refunded" && selectedOrder.status !== "cancelled" && (
                  <button
                    onClick={() => refundOrder(selectedOrder.id)}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100"
                  >
                    Refund Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
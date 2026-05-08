"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

export default function AdminFoodsDashboard() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      let query = supabase
        .from("orders")
        .select("*, vendor:vendors(name, shop_name), items:order_items(*)")
        .order("placed_at", { ascending: false });

      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte("placed_at", today.toISOString());
      } else if (dateFilter === "week") {
        const week = new Date();
        week.setDate(week.getDate() - 7);
        query = query.gte("placed_at", week.toISOString());
      }

      const { data } = await query;
      if (data) setOrders(data);
      setLoading(false);
    }
    loadData();
  }, [supabase, dateFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      alert(`Order status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating order:", error);
      alert(`Failed to update: ${error.message}`);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalGMV = orders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const activeOrders = orders.filter(o => !["delivered", "cancelled", "refunded"].includes(o.status)).length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    preparing: "bg-purple-100 text-purple-700",
    shopping: "bg-orange-100 text-orange-700",
    picked_up: "bg-indigo-100 text-indigo-700",
    on_the_way: "bg-cyan-100 text-cyan-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700",
  };

  if (loading) return <div className="px-8">Loading foods dashboard...</div>;

  return (
    <div className="px-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800">Food Orders</h1>
        <div className="flex gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total GMV", value: `₹${totalGMV.toLocaleString()}`, icon: "payments", color: "text-green-600" },
          { label: "Active Orders", value: activeOrders, icon: "shopping_cart", color: "text-[#ba001c]" },
          { label: "Pending", value: pendingOrders, icon: "schedule", color: "text-yellow-600" },
          { label: "Delivered", value: orders.filter(o => o.status === "delivered").length, icon: "check_circle", color: "text-green-600" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 ${kpi.color}`}>
              <span className="material-symbols-outlined text-lg">{kpi.icon}</span>
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{kpi.label}</p>
            <p className="text-xl font-black text-slate-800">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-sm">All Orders ({filteredOrders.length})</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID or vendor..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="on_the_way">On the Way</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className="font-black text-slate-800">#{order.id?.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td className="p-4 text-slate-600">{(order.vendor as any)?.name || (order.vendor as any)?.shop_name || "Unknown"}</td>
                    <td className="p-4 text-slate-500">{order.user_id?.slice(0, 8) || "Guest"}</td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id!, e.target.value)}
                        className={`text-[10px] font-black px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[order.status] || "bg-slate-100"}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="preparing">Preparing</option>
                        <option value="shopping">Shopping</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="on_the_way">On the Way</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4 text-slate-500">{order.items?.length || 0}</td>
                    <td className="p-4 text-right font-black text-slate-800">₹{(order.total_amount || 0).toFixed(0)}</td>
                    <td className="p-4 text-slate-400">{order.placed_at ? new Date(order.placed_at).toLocaleDateString() : "-"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[#ba001c] font-bold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-black text-lg">Order #{selectedOrder.id?.slice(0, 8).toUpperCase()}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Vendor</p>
                  <p className="font-bold">{selectedOrder.vendor?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Status</p>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${statusColors[selectedOrder.status] || ""}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Total</p>
                  <p className="font-black text-lg">₹{selectedOrder.total_amount?.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Delivery Fee</p>
                  <p className="font-bold">₹{selectedOrder.delivery_fee?.toFixed(0) || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase mb-2">Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm bg-slate-50 p-2 rounded-lg">
                      <span>{item.quantity}x {item.menu_item?.name || "Item"}</span>
                      <span className="font-bold">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedOrder.special_instructions && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-[10px] text-amber-700 uppercase">Special Instructions</p>
                  <p className="text-sm">{selectedOrder.special_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";

const supabase = createClient();

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  picking_up: "bg-orange-100 text-orange-700",
  on_the_way: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminPrintingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("vendor_id", PRINTING_VENDOR_ID)
      .order("placed_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    loadOrders();
    setSelectedOrder(null);
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending" || o.status === "accepted").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-slate-400 hover:text-slate-600">
          <span className="material-symbols-outlined text-3xl">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-800">Print Store Orders</h1>
          <p className="text-slate-500 text-sm">Manage print delivery orders</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-xs font-bold">TOTAL ORDERS</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-yellow-600 text-xs font-bold">PENDING</p>
          <p className="text-2xl font-black text-yellow-700 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <p className="text-green-600 text-xs font-bold">DELIVERED</p>
          <p className="text-2xl font-black text-green-700 mt-1">{stats.delivered}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="text-red-600 text-xs font-bold">CANCELLED</p>
          <p className="text-2xl font-black text-red-700 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
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

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl">
          <span className="material-symbols-outlined text-5xl text-slate-300">print</span>
          <p className="mt-4 font-bold">No print orders yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Order ID</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Items</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Print Settings</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Total</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Status</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Date</th>
                <th className="text-left p-4 font-bold text-slate-600 text-sm">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const item = order.order_items?.[0];
                let settings: Record<string, any> = {};
                try { if (item?.special_notes) settings = JSON.parse(item.special_notes); } catch {}
                return (
                  <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800 text-sm">{order.id.slice(0, 8)}...</td>
                    <td className="p-4 text-slate-600 text-sm">
                      {item?.name || "-"}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {settings.pages && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{settings.pages}pg</span>}
                        {settings.copies && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{settings.copies}cp</span>}
                        {settings.colorMode && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">{settings.colorMode === "bw" ? "B&W" : "Color"}</span>}
                        {settings.paperSize && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold uppercase">{settings.paperSize}</span>}
                      </div>
                      {settings.fileNames && (
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{settings.fileNames.join(", ")}</p>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-800">₹{order.total_amount}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusColors[order.status] || "bg-slate-100 text-slate-700"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{new Date(order.placed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Update Order Status</h3>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Order #{selectedOrder.id.slice(0, 8)}</p>
            <div className="flex flex-wrap gap-2">
              {["pending", "accepted", "preparing", "on_the_way", "delivered", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => updateOrderStatus(selectedOrder.id, status as OrderStatus)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${
                    selectedOrder.status === status
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

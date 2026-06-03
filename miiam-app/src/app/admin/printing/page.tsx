"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { getPrintingPricing, savePrintingPricing, type PrintingPricing } from "@/lib/printing-pricing";

const supabase = createClient();

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-indigo-100 text-indigo-700",
  ready_for_pickup: "bg-blue-100 text-blue-700",
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
  const [showPricing, setShowPricing] = useState(false);
  const [pricing, setPricing] = useState<PrintingPricing>(getPrintingPricing());

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSavePricing = () => {
    savePrintingPricing(pricing);
    setShowPricing(false);
  };

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

  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.placed_at).toDateString() === todayStr);
  const bwOrders = orders.filter(o => {
    const item = o.order_items?.[0];
    try { const s = JSON.parse(item?.special_notes || "{}"); return s.colorMode === "bw"; } catch { return false; }
  });
  const colorOrders = orders.filter(o => {
    const item = o.order_items?.[0];
    try { const s = JSON.parse(item?.special_notes || "{}"); return s.colorMode === "color"; } catch { return false; }
  });
  const a4Orders = orders.filter(o => {
    const item = o.order_items?.[0];
    try { const s = JSON.parse(item?.special_notes || "{}"); return s.paperSize === "a4"; } catch { return false; }
  });
  const a3Orders = orders.filter(o => {
    const item = o.order_items?.[0];
    try { const s = JSON.parse(item?.special_notes || "{}"); return s.paperSize === "a3"; } catch { return false; }
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending" || o.status === "processing").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    today: todayOrders.length,
    bw: bwOrders.length,
    color: colorOrders.length,
    a4: a4Orders.length,
    a3: a3Orders.length,
    avgOrderValue: orders.length > 0 ? (orders.reduce((s, o) => s + (o.total_amount || 0), 0) / orders.length).toFixed(0) : "0",
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

      {/* Pricing Settings */}
      <div className="mb-4">
        <button onClick={() => setShowPricing(!showPricing)} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-800">
          <span className="material-symbols-outlined text-lg">payments</span>
          Pricing Settings
          <span className="material-symbols-outlined text-sm">{showPricing ? "expand_less" : "expand_more"}</span>
        </button>
        {showPricing && (
          <div className="mt-2 bg-white rounded-xl border border-slate-100 p-4 max-w-md space-y-3">
            {(["bwPerPage", "colorPerPage", "glossySurcharge", "a3Surcharge"] as const).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-600 capitalize">{key.replace(/([A-Z])/g, " $1")} (₹)</label>
                <input type="number" value={pricing[key]} onChange={(e) => setPricing({ ...pricing, [key]: Math.max(0, parseInt(e.target.value) || 0) })} className="w-24 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-right" />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={handleSavePricing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Save</button>
              <button onClick={() => { setPricing(getPrintingPricing()); setShowPricing(false); }} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-xs font-bold">TOTAL</p>
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

      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
          <p className="text-indigo-500 text-[10px] font-bold">TODAY</p>
          <p className="text-xl font-black text-indigo-700">{stats.today}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold">B&W</p>
          <p className="text-xl font-black text-slate-700">{stats.bw}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold">COLOR</p>
          <p className="text-xl font-black text-slate-700">{stats.color}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold">A4/A3</p>
          <p className="text-xl font-black text-slate-700">{stats.a4}/{stats.a3}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-slate-400 text-[10px] font-bold">AVG ORDER</p>
          <p className="text-xl font-black text-slate-700">₹{stats.avgOrderValue}</p>
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
          <option value="processing">Processing</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
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
                      {settings.fileNames && settings.fileUrls && (
                        <div className="mt-1 space-y-0.5">
                          {settings.fileNames.map((name: string, fi: number) => (
                            <a key={fi} href={settings.fileUrls[fi]} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline truncate block max-w-[200px]">
                              {name}
                            </a>
                          ))}
                        </div>
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
              {["pending", "processing", "ready_for_pickup", "on_the_way", "delivered", "cancelled"].map((status) => (
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

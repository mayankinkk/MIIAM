"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderItem } from "@/lib/types";

interface MenuItemInfo {
  name: string;
  total_qty: number;
  total_revenue: number;
  order_count: number;
  category: string;
}

interface HourlyData {
  hour: number;
  orders: number;
  revenue: number;
}

export default function VendorAnalytics() {
  const supabase = createClient();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, shop_name, rating, review_count")
      .eq("email", user.email)
      .maybeSingle();

    if (vendor) {
      setVendorId(vendor.id);
      await loadOrders(vendor.id);
    }
    setLoading(false);
  }

  async function loadOrders(vId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*, menu_item:menu_items(name))")
      .eq("vendor_id", vId)
      .order("placed_at", { ascending: false });
    if (data) setOrders(data);
  }

  const now = new Date();
  const periodStart = new Date(now);
  if (period === "week") periodStart.setDate(periodStart.getDate() - 7);
  else if (period === "month") periodStart.setMonth(periodStart.getMonth() - 1);
  else periodStart.setFullYear(2000);

  const filteredOrders = orders.filter((o) => new Date(o.placed_at) >= periodStart);
  const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered");

  // Revenue
  const totalRevenue = deliveredOrders.reduce((s, o) => s + o.total_amount, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Revenue chart (daily)
  const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
  const dateMap = new Map<string, { revenue: number; orders: number }>();
  deliveredOrders.forEach((o) => {
    const d = new Date(o.placed_at).toLocaleDateString();
    const entry = dateMap.get(d) || { revenue: 0, orders: 0 };
    entry.revenue += o.total_amount;
    entry.orders += 1;
    dateMap.set(d, entry);
  });
  dateMap.forEach((v, k) => dailyRevenue.push({ date: k, ...v }));
  dailyRevenue.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Popular items
  const itemMap = new Map<string, MenuItemInfo>();
  deliveredOrders.forEach((o) => {
    o.items?.forEach((item) => {
      const name = item.menu_item?.name || "Unknown";
      const existing = itemMap.get(name) || {
        name,
        total_qty: 0,
        total_revenue: 0,
        order_count: 0,
        category: item.menu_item?.category || "",
      };
      existing.total_qty += item.quantity;
      existing.total_revenue += item.unit_price * item.quantity;
      existing.order_count += 1;
      itemMap.set(name, existing);
    });
  });
  const popularItems = Array.from(itemMap.values()).sort((a, b) => b.total_qty - a.total_qty).slice(0, 10);

  // Peak hours
  const hourMap = new Map<number, { orders: number; revenue: number }>();
  for (let i = 0; i < 24; i++) hourMap.set(i, { orders: 0, revenue: 0 });
  deliveredOrders.forEach((o) => {
    const hour = new Date(o.placed_at).getHours();
    const entry = hourMap.get(hour)!;
    entry.orders += 1;
    entry.revenue += o.total_amount;
  });
  const peakHours: HourlyData[] = Array.from(hourMap.entries()).map(([hour, data]) => ({
    hour,
    ...data,
  }));

  const maxOrders = Math.max(...peakHours.map((h) => h.orders), 1);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500 mt-1">Sales performance and insights</p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                period === p ? "bg-[#ba001c] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#ba001c] to-[#6b0011] text-white rounded-2xl p-6">
          <p className="text-white/70 text-sm font-medium">Total Revenue</p>
          <p className="text-3xl font-black mt-1">₹{totalRevenue.toFixed(0)}</p>
          <p className="text-white/50 text-xs mt-1">{deliveredOrders.length} orders</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Orders</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{totalOrders}</p>
          <p className="text-slate-400 text-xs mt-1">{deliveredOrders.length} delivered</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Avg. Order Value</p>
          <p className="text-3xl font-black text-slate-900 mt-1">₹{avgOrderValue.toFixed(0)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">Items Sold</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {deliveredOrders.reduce((s, o) => s + (o.items?.reduce((si, i) => si + i.quantity, 0) || 0), 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Daily Revenue</h3>
          {dailyRevenue.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {dailyRevenue.map((d) => {
                const maxRev = Math.max(...dailyRevenue.map((x) => x.revenue), 1);
                const pct = (d.revenue / maxRev) * 100;
                return (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 font-medium">{d.date}</span>
                    <div className="flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ba001c] to-[#e83350] rounded-lg flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      >
                        <span className="text-[10px] text-white font-bold">₹{d.revenue.toFixed(0)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{d.orders}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Peak Hours</h3>
          <div className="space-y-2">
            {peakHours.map((h) => {
              const pct = (h.orders / maxOrders) * 100;
              const label =
                h.hour === 0 ? "12 AM" :
                h.hour < 12 ? `${h.hour} AM` :
                h.hour === 12 ? "12 PM" :
                `${h.hour - 12} PM`;
              return (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-12 font-medium">{label}</span>
                  <div className="flex-1 h-5 bg-slate-50 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right font-medium">{h.orders} orders</span>
                  <span className="text-xs text-slate-400 w-16 text-right">₹{h.revenue.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">Popular Items</h3>
        {popularItems.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No items sold yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 rounded-xl">
                <tr>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sold</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Orders</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {popularItems.map((item, i) => (
                  <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-sm font-bold text-slate-400">{i + 1}</td>
                    <td className="p-3 text-sm font-bold text-slate-800">{item.name}</td>
                    <td className="p-3 text-xs text-slate-500">{item.category}</td>
                    <td className="p-3 text-sm font-bold text-slate-900 text-right">{item.total_qty}</td>
                    <td className="p-3 text-sm text-slate-600 text-right">{item.order_count}</td>
                    <td className="p-3 text-sm font-extrabold text-green-600 text-right">₹{item.total_revenue.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {([
            { status: "delivered", label: "Delivered", color: "green" },
            { status: "cancelled", label: "Cancelled", color: "red" },
            { status: "pending", label: "Pending", color: "amber" },
            { status: "accepted", label: "In Progress", color: "blue" },
          ] as const).map((s) => {
            const count = filteredOrders.filter((o) => o.status === s.status).length;
            const pct = filteredOrders.length > 0 ? (count / filteredOrders.length) * 100 : 0;
            return (
              <div key={s.status} className="text-center">
                <div className={`text-3xl font-black text-${s.color}-600`}>{count}</div>
                <div className="text-sm text-slate-500 font-medium">{s.label}</div>
                <div className="text-xs text-slate-400">{pct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

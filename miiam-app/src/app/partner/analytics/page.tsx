"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVendorForUser, getVendorMenuItems } from "@/lib/vendor";
import type { Order } from "@/lib/types";

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
  const [vendor, setVendor] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [loading, setLoading] = useState(true);
  const [menuItemNames, setMenuItemNames] = useState<Map<string, { name: string; category: string }>>(new Map());
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const v = await getVendorForUser();
    if (v) {
      setVendor(v);
      setVendorId(v.id);
      await Promise.all([
        loadOrders(v.id),
        loadCompetitors(v),
        loadForecast(v.id),
      ]);
    }
    setLoading(false);
  }

  async function loadOrders(vId: string) {
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("vendor_id", vId)
      .order("placed_at", { ascending: false });
    if (data) {
      setOrders(data);
      const names = await getVendorMenuItems(vId);
      setMenuItemNames(names);
    }
  }

  async function loadCompetitors(v: any) {
    if (!v.city && !v.pincode) return;
    const { data } = await supabase
      .from("vendors")
      .select("shop_name, type, rating, review_count, delivery_time_min, delivery_time_max, min_order_amount, city, pincode")
      .neq("id", v.id)
      .eq("status", "active");
    if (!data) return;

    const sameCity = data.filter((c: any) => c.city === v.city || c.pincode === v.pincode);
    const sameType = sameCity.filter((c: any) => c.type === v.type);
    setCompetitors(sameType.length > 0 ? sameType : sameCity.slice(0, 10));
  }

  async function loadForecast(vId: string) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data } = await supabase
      .from("orders")
      .select("placed_at, total_amount")
      .eq("vendor_id", vId)
      .eq("status", "delivered")
      .gte("placed_at", ninetyDaysAgo);

    if (!data || data.length < 5) return;

    const dayOfWeek: Record<number, { count: number; revenue: number }> = {};
    for (let i = 0; i < 7; i++) dayOfWeek[i] = { count: 0, revenue: 0 };
    data.forEach((o: any) => {
      const d = new Date(o.placed_at);
      const dow = d.getDay();
      dayOfWeek[dow].count++;
      dayOfWeek[dow].revenue += o.total_amount || 0;
    });

    const avgDailyOrders = Object.values(dayOfWeek).reduce((s, d) => s + d.count, 0) / 7;
    const peakDay = Object.entries(dayOfWeek).sort((a: any, b: any) => b[1].count - a[1].count)[0];
    const slowDay = Object.entries(dayOfWeek).sort((a: any, b: any) => a[1].count - b[1].count)[0];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    setForecast({
      avgDailyOrders: Math.round(avgDailyOrders * 10) / 10,
      peakDay: { name: dayNames[parseInt(peakDay[0])], orders: (peakDay[1] as any).count },
      slowDay: { name: dayNames[parseInt(slowDay[0])], orders: (slowDay[1] as any).count },
      projectedWeekly: Math.round(avgDailyOrders * 7),
      dayOfWeek: Object.entries(dayOfWeek).map(([day, val]: any) => ({
        day: dayNames[parseInt(day)],
        orders: val.count,
        revenue: val.revenue,
      })),
    });
  }

  const now = new Date();
  const periodStart = new Date(now);
  if (period === "week") periodStart.setDate(periodStart.getDate() - 7);
  else if (period === "month") periodStart.setMonth(periodStart.getMonth() - 1);
  else periodStart.setFullYear(2000);

  const filteredOrders = orders.filter((o) => new Date(o.placed_at) >= periodStart);
  const deliveredOrders = filteredOrders.filter((o) => o.status === "delivered");

  const totalRevenue = deliveredOrders.reduce((s, o) => s + o.total_amount, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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

  const itemMap = new Map<string, MenuItemInfo>();
  deliveredOrders.forEach((o) => {
    o.items?.forEach((item) => {
      const menuItem = menuItemNames.get(item.menu_item_id);
      const name = menuItem?.name || "Unknown";
      const existing = itemMap.get(name) || { name, total_qty: 0, total_revenue: 0, order_count: 0, category: menuItem?.category || "" };
      existing.total_qty += item.quantity;
      existing.total_revenue += item.unit_price * item.quantity;
      existing.order_count += 1;
      itemMap.set(name, existing);
    });
  });
  const popularItems = Array.from(itemMap.values()).sort((a, b) => b.total_qty - a.total_qty).slice(0, 10);

  const hourMap = new Map<number, { orders: number; revenue: number }>();
  for (let i = 0; i < 24; i++) hourMap.set(i, { orders: 0, revenue: 0 });
  deliveredOrders.forEach((o) => {
    const hour = new Date(o.placed_at).getHours();
    const entry = hourMap.get(hour)!;
    entry.orders += 1;
    entry.revenue += o.total_amount;
  });
  const peakHours: HourlyData[] = Array.from(hourMap.entries()).map(([hour, data]) => ({ hour, ...data }));
  const maxOrders = Math.max(...peakHours.map((h) => h.orders), 1);

  const avgCompetitorRating = competitors.length
    ? (competitors.reduce((s: number, c: any) => s + (c.rating || 0), 0) / competitors.length).toFixed(1)
    : "N/A";
  const avgCompetitorDeliveryMin = competitors.length
    ? Math.round(competitors.reduce((s: number, c: any) => s + ((c.delivery_time_min || 0) + (c.delivery_time_max || 30)) / 2, 0) / competitors.length)
    : 0;
  const competitorCount = competitors.length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 font-medium animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  function exportCSV() {
    const rows = [["Date", "Orders", "Revenue", "Avg Order Value"]];
    dailyRevenue.forEach(d => {
      rows.push([d.date, String(d.orders), String(d.revenue), d.orders > 0 ? String(Math.round(d.revenue / d.orders)) : "0"]);
    });
    rows.push([]);
    rows.push(["Popular Items", "Qty Sold", "Revenue", "Orders"]);
    popularItems.forEach(i => {
      rows.push([i.name, String(i.total_qty), String(i.total_revenue), String(i.order_count)]);
    });
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analytics_export_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!vendorId) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">analytics</span>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">No Vendor Found</h2>
        <p className="text-slate-500">Register your store to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500 mt-1">Sales performance, competitor insights & demand forecast</p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "all"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${period === p ? "bg-[#ba001c] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
            </button>
          ))}
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">download</span> Export
          </button>
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
                      <div className="h-full bg-gradient-to-r from-[#ba001c] to-[#e83350] rounded-lg flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max(pct, 5)}%` }}>
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
              const label = h.hour === 0 ? "12 AM" : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? "12 PM" : `${h.hour - 12} PM`;
              return (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-12 font-medium">{label}</span>
                  <div className="flex-1 h-5 bg-slate-50 rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right font-medium">{h.orders} orders</span>
                  <span className="text-xs text-slate-400 w-16 text-right">₹{h.revenue.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance & Staffing */}
      {(() => {
        const topHours = [...peakHours].sort((a, b) => b.orders - a.orders).slice(0, 3);
        const peakLabel = topHours.length > 0
          ? `${topHours.map(h => `${h.hour === 0 ? "12 AM" : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? "12 PM" : `${h.hour - 12} PM`} (${h.orders} orders)`).join(", ")}`
          : "N/A";
        const prepTimes: number[] = [];
        const delayedOrders = orders.filter(o => o.delay_minutes && o.delay_minutes > 0);
        orders.forEach((o) => {
          if (o.status === "delivered" || o.status === "ready_for_pickup") {
            const placed = new Date(o.placed_at).getTime();
            if (o.delivered_at) {
              const diff = (new Date(o.delivered_at).getTime() - placed) / 60000;
              if (diff > 0 && diff < 300) prepTimes.push(diff);
            }
          }
        });
        const avgPrepTime = prepTimes.length > 0 ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length) : null;
        const onTimeRate = prepTimes.length > 0
          ? Math.round((prepTimes.filter(t => t <= 45).length / prepTimes.length) * 100)
          : null;
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-emerald-500">speed</span>
              <h3 className="font-bold text-slate-800">Performance & Staffing</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-xs text-emerald-600 mb-2 font-bold uppercase tracking-wider">Staffing Recommendation</p>
                <p className="text-sm text-emerald-800">
                  {topHours.length > 0
                    ? `Schedule extra staff during peak: ${peakLabel}`
                    : "Insufficient data for recommendation"}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-xs text-blue-600 mb-1 font-bold uppercase tracking-wider">Avg Prep Time</p>
                <p className="text-3xl font-black text-blue-700">{avgPrepTime ?? "—"}</p>
                <p className="text-xs text-blue-500 mt-1">minutes</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <p className="text-xs text-green-600 mb-1 font-bold uppercase tracking-wider">On-time Rate</p>
                <p className="text-3xl font-black text-green-700">{onTimeRate != null ? `${onTimeRate}%` : "—"}</p>
                <p className="text-xs text-green-500 mt-1">delivered within 45 min</p>
              </div>
            </div>
            {delayedOrders.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
                <p className="text-xs text-red-700">
                  {delayedOrders.length} order{delayedOrders.length > 1 ? "s" : ""} reported with delays — avg {Math.round(delayedOrders.reduce((s, o) => s + (o.delay_minutes || 0), 0) / delayedOrders.length)} min delay
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Competitor Benchmarking */}
      {competitors.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Competitor Benchmarking</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{competitorCount} similar vendors</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">Your Rating</p>
              <p className="text-2xl font-black text-amber-500">{vendor?.rating?.toFixed(1) || "0.0"}</p>
              <p className="text-[10px] text-slate-400 mt-1">vs avg {avgCompetitorRating}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">Delivery Time</p>
              <p className="text-2xl font-black text-blue-600">
                {vendor?.delivery_time_min || vendor?.delivery_time_minutes || "30"} min
              </p>
              <p className="text-[10px] text-slate-400 mt-1">vs avg {avgCompetitorDeliveryMin} min</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">Min Order</p>
              <p className="text-2xl font-black text-green-600">₹{vendor?.min_order_amount || 0}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">Reviews</p>
              <p className="text-2xl font-black text-purple-600">{vendor?.review_count || 0}</p>
              <p className="text-[10px] text-slate-400 mt-1">competitors in area</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 rounded-xl">
                <tr>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Vendor</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Rating</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Reviews</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Delivery</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">Min Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {competitors.slice(0, 5).map((c: any) => (
                  <tr key={c.shop_name + Math.random()} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-800">{c.shop_name}</td>
                    <td className="p-3"><span className="text-amber-500">★</span> {c.rating?.toFixed(1) || "N/A"}</td>
                    <td className="p-3 text-slate-600">{c.review_count || 0}</td>
                    <td className="p-3 text-slate-600">{c.delivery_time_min || c.delivery_time_minutes || "N/A"} min</td>
                    <td className="p-3 text-slate-600">₹{c.min_order_amount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demand Forecasting */}
      {forecast && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-purple-500">trending_up</span>
            <h3 className="font-bold text-slate-800">Demand Forecast</h3>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Based on last 90 days</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <p className="text-xs text-purple-600 mb-1">Avg Daily Orders</p>
              <p className="text-2xl font-black text-purple-700">{forecast.avgDailyOrders}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-xs text-green-600 mb-1">Busiest Day</p>
              <p className="text-2xl font-black text-green-700">{forecast.peakDay.name}</p>
              <p className="text-[10px] text-green-500">{forecast.peakDay.orders} orders</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <p className="text-xs text-amber-600 mb-1">Slowest Day</p>
              <p className="text-2xl font-black text-amber-700">{forecast.slowDay.name}</p>
              <p className="text-[10px] text-amber-500">{forecast.slowDay.orders} orders</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-xs text-blue-600 mb-1">Projected Weekly</p>
              <p className="text-2xl font-black text-blue-700">{forecast.projectedWeekly}</p>
              <p className="text-[10px] text-blue-500">orders</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {forecast.dayOfWeek.map((d: any) => {
              const maxOrders = Math.max(...forecast.dayOfWeek.map((x: any) => x.orders), 1);
              return (
                <div key={d.day} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <span className="text-xs font-bold text-slate-500">{d.day}</span>
                  <div className="w-8 h-24 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-lg transition-all" style={{ height: `${(d.orders / maxOrders) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{d.orders}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Re-order Analysis */}
      {(() => {
        const userItemOrders = new Map<string, Map<string, number>>();
        deliveredOrders.forEach((o) => {
          if (!o.user_id) return;
          if (!userItemOrders.has(o.user_id)) userItemOrders.set(o.user_id, new Map());
          const seen = new Set<string>();
          o.items?.forEach((item) => {
            const name = menuItemNames.get(item.menu_item_id)?.name || "Unknown";
            if (seen.has(name)) return;
            seen.add(name);
            const m = userItemOrders.get(o.user_id)!;
            m.set(name, (m.get(name) || 0) + 1);
          });
        });
        const itemStats = new Map<string, { totalCustomers: number; repeatCustomers: number }>();
        userItemOrders.forEach((itemCounts) => {
          itemCounts.forEach((count, itemName) => {
            if (!itemStats.has(itemName)) itemStats.set(itemName, { totalCustomers: 0, repeatCustomers: 0 });
            const s = itemStats.get(itemName)!;
            s.totalCustomers++;
            if (count > 1) s.repeatCustomers++;
          });
        });
        const reorderItems = Array.from(itemStats.entries())
          .map(([name, s]) => ({ name, ...s, reorderRate: Math.round((s.repeatCustomers / s.totalCustomers) * 100) }))
          .filter(i => i.totalCustomers > 1)
          .sort((a, b) => b.reorderRate - a.reorderRate)
          .slice(0, 10);
        return reorderItems.length > 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-indigo-500">replay</span>
              <h3 className="font-bold text-slate-800">Re-order Analysis</h3>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Customer favorites</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 rounded-xl">
                  <tr>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Repeat Customers</th>
                    <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Re-order Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reorderItems.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-sm font-bold text-slate-800">{item.name}</td>
                      <td className="p-3 text-sm font-bold text-indigo-600 text-right">{item.repeatCustomers}/{item.totalCustomers}</td>
                      <td className="p-3 text-right">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          item.reorderRate >= 50 ? "bg-green-100 text-green-700" : item.reorderRate >= 25 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {item.reorderRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null;
      })()}

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

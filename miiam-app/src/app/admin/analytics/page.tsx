"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsOrder {
  id: string;
  user_id?: string;
  vendor_id?: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  discount_amount: number;
  placed_at: string;
  delivered_at?: string;
  vendor?: { name: string };
  rider?: { name: string };
}

interface AnalyticsUser {
  id: string;
  created_at: string;
}

interface AnalyticsVendor {
  id: string;
  name: string;
  category?: string;
  is_active: boolean;
  created_at: string;
}

interface AnalyticsRider {
  id: string;
  name: string;
  is_online: boolean;
  total_earnings: number;
  total_deliveries?: number;
}

interface OrderWithTimes {
  id: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  discount_amount: number;
  placed_at: string;
  delivered_at?: string;
  vendor?: { name: string };
  rider?: { name: string };
}

export default function AdvancedAnalytics() {
  const supabase = createClient();
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [users, setUsers] = useState<AnalyticsUser[]>([]);
  const [vendors, setVendors] = useState<AnalyticsVendor[]>([]);
  const [riders, setRiders] = useState<AnalyticsRider[]>([]);
  const [reviews, setReviews] = useState<{ rating: number; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "users" | "vendors" | "riders" | "reports">("overview");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [ordersRes, usersRes, vendorsRes, ridersRes, reviewsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, vendor:vendors(name), rider:riders(name, total_deliveries, total_earnings)")
          .gte("placed_at", startDate.toISOString())
          .order("placed_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("id, created_at")
          .gte("created_at", startDate.toISOString()),
        supabase
          .from("vendors")
          .select("id, name, category, is_active, created_at"),
        supabase
          .from("riders")
          .select("id, name, is_online, total_earnings, total_deliveries"),
        supabase
          .from("reviews")
          .select("rating, created_at")
          .gte("created_at", startDate.toISOString()),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (usersRes.data) setUsers(usersRes.data);
      if (vendorsRes.data) setVendors(vendorsRes.data);
      if (ridersRes.data) setRiders(ridersRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      setLoading(false);
    }
    loadData();

    const channel = supabase.channel('admin-analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        // Reload data quietly in background without setting loading true
        const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        supabase.from("orders")
          .select("*, vendor:vendors(name), rider:riders(name, total_deliveries, total_earnings)")
          .gte("placed_at", startDate.toISOString())
          .order("placed_at", { ascending: true })
          .then((res: { data: Record<string, unknown>[] | null }) => { if (res.data) setOrders(res.data); });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [period, supabase]);

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount ? totalRevenue / orderCount : 0;

  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const pendingOrders = orders.filter((o) => ["pending", "accepted", "preparing"].includes(o.status)).length;

  // Calculate average delivery time
  const ordersWithDeliveryTime = orders.filter((o) => o.delivered_at && o.placed_at);
  let avgDeliveryMinutes = 0;
  if (ordersWithDeliveryTime.length > 0) {
    const totalMinutes = ordersWithDeliveryTime.reduce((sum, order) => {
      const placed = new Date(order.placed_at).getTime();
      const delivered = new Date(order.delivered_at!).getTime();
      return sum + (delivered - placed);
    }, 0);
    avgDeliveryMinutes = Math.round(totalMinutes / ordersWithDeliveryTime.length / 60000);
  }

  // Rider utilization
  const activeRiders = riders.filter((r) => r.is_online).length;
  const totalRiders = riders.length;
  const riderUtilization = totalRiders > 0 ? Math.round((activeRiders / totalRiders) * 100) : 0;

  // Orders per rider
  const ordersPerRider = activeRiders > 0 ? Math.round(deliveredOrders / activeRiders) : 0;

  const dailyRevenue: Record<string, number> = {};
  const hourlyOrders: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0 };
  
  orders.forEach((o) => {
    const date = new Date(o.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    dailyRevenue[date] = (dailyRevenue[date] || 0) + (o.total_amount || 0);
    
    const hour = new Date(o.placed_at).getHours();
    hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
  });

  const chartData = Object.entries(dailyRevenue);
  const maxRevenue = Math.max(...Object.values(dailyRevenue), 1);

  const vendorRevenue: Record<string, { revenue: number; orders: number }> = {};
  orders.forEach((o) => {
    const vendor = o.vendor?.name || "Unknown";
    if (!vendorRevenue[vendor]) {
      vendorRevenue[vendor] = { revenue: 0, orders: 0 };
    }
    vendorRevenue[vendor].revenue += o.total_amount || 0;
    vendorRevenue[vendor].orders += 1;
  });
  const topVendors = Object.entries(vendorRevenue)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  const peakHours = Object.entries(hourlyOrders)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  const newUsersCount = users.length;
  const activeVendors = vendors.filter((v) => v.is_active).length;
  const onlineRiders = riders.filter((r) => r.is_online).length;

  const statusDistribution = [
    { status: "delivered", label: "Delivered", count: deliveredOrders, color: "bg-green-500" },
    { status: "cancelled", label: "Cancelled", count: cancelledOrders, color: "bg-red-500" },
    { status: "pending", label: "In Progress", count: pendingOrders, color: "bg-blue-500" },
    { status: "other", label: "Other", count: orderCount - deliveredOrders - cancelledOrders - pendingOrders, color: "bg-slate-400" },
  ];

  // --- Real analytics computations for Reports tab ---
  const deliveredOrdersFull = orders.filter((o) => o.status === "delivered");
  const uniqueUsersWithOrders = new Set(orders.map((o) => o.user_id)).size;
  const repeatOrderUsers = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.user_id) acc[o.user_id] = (acc[o.user_id] || 0) + 1;
    return acc;
  }, {});
  const usersWithRepeatOrders = Object.values(repeatOrderUsers).filter((c) => c > 1).length;
  const customerRetention = uniqueUsersWithOrders > 0 ? Math.round((usersWithRepeatOrders / uniqueUsersWithOrders) * 100) : 0;
  const repeatOrderPct = orderCount > 0 ? Math.round((deliveredOrdersFull.length / orderCount) * 100) : 0;
  const avgOrdersPerCustomer = uniqueUsersWithOrders > 0 ? (orderCount / uniqueUsersWithOrders).toFixed(1) : "0";

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) : 0;

  // Build real heatmap data from order timestamps
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heatmapData: number[][] = Array.from({ length: 24 }, () => Array(7).fill(0));
  orders.forEach((o) => {
    const d = new Date(o.placed_at);
    const hour = d.getHours();
    const dayIndex = (d.getDay() + 6) % 7; // Convert Sun=0 to Mon=0 index
    heatmapData[hour][dayIndex]++;
  });
  const maxHeatmapValue = Math.max(...heatmapData.flat(), 1);

  // Build real service category performance from orders x vendors
  const vendorCategoryMap = new Map(vendors.map((v) => [v.id, v.category || "Other"]));
  const categoryStats: Record<string, { revenue: number; orders: number }> = {};
  orders.forEach((o) => {
    const cat = o.vendor_id ? (vendorCategoryMap.get(o.vendor_id) || "Other") : "Other";
    if (!categoryStats[cat]) categoryStats[cat] = { revenue: 0, orders: 0 };
    categoryStats[cat].revenue += o.total_amount || 0;
    categoryStats[cat].orders += 1;
  });
  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);
  const maxCategoryRevenue = topCategories.length > 0 ? topCategories[0][1].revenue : 1;

  if (loading) {
    return (
      <div className="px-8 py-12 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-8 space-y-8">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Advanced Analytics</h1>
          <p className="text-[var(--color-outline)]">Comprehensive platform insights and reporting</p>
        </div>
        <div className="flex gap-2 bg-[var(--color-surface-container)] p-1 rounded-xl">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                period === p ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-outline)]"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-1 inline-flex">
        {(["overview", "orders", "users", "vendors", "riders", "reports"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
              activeTab === tab
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-outline)] hover:bg-[var(--color-surface-subtle)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "reports" && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-lg">
              <p className="text-sm text-[var(--color-outline)] mb-1">Customer Retention</p>
              <p className="text-3xl font-black text-green-600">{customerRetention}%</p>
              <p className="text-xs text-green-500 mt-1">{uniqueUsersWithOrders} customers, {usersWithRepeatOrders} returning</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-lg">
              <p className="text-sm text-[var(--color-outline)] mb-1">Repeat Orders</p>
              <p className="text-3xl font-black text-blue-600">{repeatOrderPct}%</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">Avg {avgOrdersPerCustomer} orders/customer</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-lg">
              <p className="text-sm text-[var(--color-outline)] mb-1">Avg Delivery Time</p>
              <p className="text-3xl font-black text-purple-600">{avgDeliveryMinutes} min</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">Across {ordersWithDeliveryTime.length} deliveries</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl shadow-lg">
              <p className="text-sm text-[var(--color-outline)] mb-1">CSAT Score</p>
              <p className="text-3xl font-black text-amber-600">{avgRating.toFixed(1)}/5</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-1">Based on {totalReviews.toLocaleString()} reviews</p>
            </div>
          </div>

          {/* Order Heatmap by Hour & Day */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[var(--color-on-surface)]">Order Heatmap</h3>
              <div className="flex gap-2">
                <span className="text-xs text-[var(--color-outline-variant)]">Low</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded ${
                        i === 0 ? "bg-green-100" :
                        i === 1 ? "bg-green-300" :
                        i === 2 ? "bg-green-500" :
                        i === 3 ? "bg-green-700" :
                        "bg-green-900"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[var(--color-outline-variant)]">High</span>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1 text-xs">
              <div />
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center font-bold text-[var(--color-outline)] py-2">{day}</div>
              ))}
              {heatmapData.map((hours, hour) => (
                <div key={`row-${hour}`} className="contents">
                  <div className="text-[var(--color-outline-variant)] text-right pr-2 py-1">{hour}:00</div>
                  {hours.map((count, dayIndex) => {
                    const intensity = maxHeatmapValue > 0 ? Math.floor((count / maxHeatmapValue) * 4) : 0;
                    return (
                      <div
                        key={`${hour}-${dayIndex}`}
                        className={`h-8 rounded ${
                          intensity === 0 ? "bg-green-100" :
                          intensity === 1 ? "bg-green-300" :
                          intensity === 2 ? "bg-green-500" :
                          intensity === 3 ? "bg-green-700" :
                          "bg-green-900"
                        }`}
                        title={`${hour}:00 - ${daysOfWeek[dayIndex]}: ${count} orders`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Service Category Performance */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Service Category Performance</h3>
            <div className="space-y-4">
              {topCategories.map(([name, stats]) => (
                <div key={name} className="flex items-center gap-4">
                  <div className="w-32 font-bold text-[var(--color-on-surface)] capitalize">{name}</div>
                  <div className="flex-1 bg-[var(--color-surface-container)] rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--color-primary)] to-pink-500 rounded-full"
                      style={{ width: `${(stats.revenue / maxCategoryRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <span className="font-bold text-[var(--color-on-surface)]">₹{stats.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-[var(--color-outline)]">{stats.orders} orders</span>
                  </div>
                </div>
              ))}
              {topCategories.length === 0 && (
                <p className="text-[var(--color-outline-variant)] text-center py-4">No order data available for this period</p>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Export Reports</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  const rows = [["Date", "Revenue", "Orders"]];
                  orders.filter(o => o.status === "delivered").forEach(o => {
                    rows.push([new Date(o.placed_at).toLocaleDateString(), String(o.total_amount), "1"]);
                  });
                  const csv = rows.map(r => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "revenue-report.csv"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-4 border-2 border-[var(--color-border-subtle)] rounded-xl hover:border-[var(--color-primary)] hover:bg-pink-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600">description</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-[var(--color-on-surface)]">Revenue Report</p>
                  <p className="text-xs text-[var(--color-outline)]">Last 30 days</p>
                </div>
              </button>
              <button
                onClick={() => {
                  const rows = [["Join Date", "User ID"]];
                  users.forEach(u => {
                    rows.push([new Date(u.created_at).toLocaleDateString(), u.id]);
                  });
                  const csv = rows.map(r => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "user-analytics.csv"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-4 border-2 border-[var(--color-border-subtle)] rounded-xl hover:border-[var(--color-primary)] hover:bg-pink-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600">group</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-[var(--color-on-surface)]">User Analytics</p>
                  <p className="text-xs text-[var(--color-outline)]">Growth metrics</p>
                </div>
              </button>
              <button
                onClick={() => {
                  const rows = [["Metric", "Value"]];
                  rows.push(["Total Revenue", `₹${totalRevenue}`]);
                  rows.push(["Total Orders", String(orderCount)]);
                  rows.push(["Active Vendors", String(activeVendors)]);
                  rows.push(["Online Riders", String(onlineRiders)]);
                  rows.push(["Avg Order Value", orderCount > 0 ? `₹${Math.round(totalRevenue / orderCount)}` : "₹0"]);
                  const csv = rows.map(r => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "performance-report.csv"; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-4 border-2 border-[var(--color-border-subtle)] rounded-xl hover:border-[var(--color-primary)] hover:bg-pink-50 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-purple-600">trending_up</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-[var(--color-on-surface)]">Performance</p>
                  <p className="text-xs text-[var(--color-outline)]">Service metrics</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-3xl text-white shadow-lg shadow-green-900/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined">payments</span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total GMV</span>
              </div>
              <p className="text-4xl font-black">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-white/60 mt-2">{orderCount} orders</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">shopping_cart</span>
                <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Avg Order</span>
              </div>
              <p className="text-3xl font-black text-[var(--color-on-surface)]">₹{Math.round(avgOrderValue)}</p>
              <p className="text-xs text-green-500 mt-2">per order</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">group</span>
                <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">New Users</span>
              </div>
              <p className="text-3xl font-black text-[var(--color-on-surface)]">{newUsersCount}</p>
              <p className="text-xs text-green-500 mt-2">this period</p>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">local_shipping</span>
                <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Peak Hours</span>
              </div>
              <p className="text-xl font-black text-[var(--color-on-surface)]">{peakHours.join(", ")}</p>
              <p className="text-xs text-[var(--color-outline-variant)] mt-2">most orders</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
              <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Revenue Trend</h2>
              <div className="h-64 flex items-end gap-2">
                {chartData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-outline-variant)]">
                    No data available
                  </div>
                ) : (
                  chartData.map(([date, revenue], i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gradient-to-t from-[var(--color-primary)] to-[#ff7670] rounded-t-lg transition-all hover:opacity-80 relative group">
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ₹{revenue.toLocaleString()}
                        </div>
                        <div
                          className="w-full bg-[var(--color-primary)] rounded-t-lg"
                          style={{ height: `${Math.max((revenue / maxRevenue) * 100, 5)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--color-outline-variant)] truncate w-full text-center">{date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
              <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Order Status</h2>
              <div className="space-y-4">
                {statusDistribution.map((item) => (
                  <div key={item.status}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold text-[var(--color-on-surface-variant)]">{item.label}</span>
                      <span className="text-sm font-black text-[var(--color-on-surface)]">{item.count}</span>
                    </div>
                    <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${orderCount ? (item.count / orderCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-outline)]">Success Rate</span>
                  <span className="font-bold text-green-600">
                    {orderCount ? Math.round((deliveredOrders / orderCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
              <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Top Vendors by Revenue</h2>
              <div className="space-y-4">
                {topVendors.map(([vendor, data], i) => (
                  <div key={vendor} className="flex items-center gap-4">
                    <span className="w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-[var(--color-on-surface)]">{vendor}</span>
                        <span className="font-black text-[var(--color-on-surface)]">₹{data.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-[var(--color-outline)] mb-1">
                        <span>{data.orders} orders</span>
                        <span>₹{Math.round(data.revenue / data.orders)}/order</span>
                      </div>
                      <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[#ff7670]"
                          style={{ width: `${topVendors[0] ? (data.revenue / topVendors[0][1].revenue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
              <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Operations Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl">
                  <span className="material-symbols-outlined text-green-600 text-2xl">store</span>
                  <p className="text-2xl font-black text-[var(--color-on-surface)] mt-2">{activeVendors}</p>
                  <p className="text-xs text-[var(--color-outline)]">Active Vendors</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <span className="material-symbols-outlined text-blue-600 text-2xl">two_wheeler</span>
                  <p className="text-2xl font-black text-[var(--color-on-surface)] mt-2">{onlineRiders}</p>
                  <p className="text-xs text-[var(--color-outline)]">Online Riders</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <span className="material-symbols-outlined text-purple-600 text-2xl">timer</span>
                  <p className="text-2xl font-black text-[var(--color-on-surface)] mt-2">{avgDeliveryMinutes > 0 ? `${avgDeliveryMinutes}m` : "N/A"}</p>
                  <p className="text-xs text-[var(--color-outline)]">Avg Delivery Time</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <span className="material-symbols-outlined text-amber-600 text-2xl">percent</span>
                  <p className="text-2xl font-black text-[var(--color-on-surface)] mt-2">{riderUtilization}%</p>
                  <p className="text-xs text-[var(--color-outline)]">Rider Utilization</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl">
                  <span className="material-symbols-outlined text-rose-600 text-2xl">trending_up</span>
                  <p className="text-2xl font-black text-[var(--color-on-surface)] mt-2">
                    {orderCount ? Math.round((deliveredOrders / orderCount) * 100) : 0}%
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">Success Rate</p>
                </div>
                <div className="p-4 bg-cyan-50 rounded-xl">
                  <span className="material-symbols-outlined text-cyan-600 text-2xl">person</span>
                  <p className="text-2xl font-black text-[var(--color-on-surface)] mt-2">{newUsersCount}</p>
                  <p className="text-xs text-[var(--color-outline)]">New Users</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "orders" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-[var(--color-on-surface)]">Orders Report</h2>
            <button
              onClick={() => {
                const rows = [["Order ID", "Amount", "Status", "Date"]];
                orders.forEach(o => {
                  rows.push([o.id.slice(0, 8).toUpperCase(), String(o.total_amount), o.status, new Date(o.placed_at).toLocaleDateString()]);
                });
                const csv = rows.map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "orders-report.csv"; a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Order ID</th>
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Vendor</th>
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Amount</th>
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Status</th>
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-[var(--color-surface-subtle)]">
                    <td className="py-3 font-bold text-[var(--color-on-surface)]">{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="py-3 text-[var(--color-on-surface-variant)]">{order.vendor?.name || "Unknown"}</td>
                    <td className="py-3 font-bold text-[var(--color-on-surface)]">₹{order.total_amount?.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.status === "delivered" ? "bg-green-100 text-green-700" :
                        order.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-[var(--color-outline)] text-sm">
                      {new Date(order.placed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">User Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
              <p className="text-xs font-bold opacity-80">Total Users</p>
              <p className="text-4xl font-black mt-2">{users.length}</p>
            </div>
            <div className="p-6 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-2xl">
              <p className="text-xs font-bold text-[var(--color-outline-variant)]">New This Period</p>
              <p className="text-4xl font-black text-[var(--color-on-surface)] mt-2">{newUsersCount}</p>
            </div>
            <div className="p-6 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-2xl">
              <p className="text-xs font-bold text-[var(--color-outline-variant)]">Conversion Rate</p>
              <p className="text-4xl font-black text-[var(--color-on-surface)] mt-2">
                {users.length ? Math.round((orderCount / users.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "vendors" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Vendor Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <p className="text-3xl font-black text-green-600">{activeVendors}</p>
              <p className="text-xs text-[var(--color-outline)]">Active</p>
            </div>
            <div className="p-4 bg-[var(--color-surface-subtle)] rounded-xl text-center">
              <p className="text-3xl font-black text-[var(--color-on-surface-variant)]">{vendors.length - activeVendors}</p>
              <p className="text-xs text-[var(--color-outline)]">Inactive</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <p className="text-3xl font-black text-blue-600">{topVendors.length}</p>
              <p className="text-xs text-[var(--color-outline)]">With Orders</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <p className="text-3xl font-black text-purple-600">
                ₹{topVendors[0] ? Math.round(topVendors[0][1].revenue / topVendors[0][1].orders) : 0}
              </p>
              <p className="text-xs text-[var(--color-outline)]">Top Avg Order</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Vendor</th>
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Status</th>
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Revenue</th>
                  <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Orders</th>
                </tr>
              </thead>
              <tbody>
                {topVendors.map(([vendor, data]) => (
                  <tr key={vendor} className="border-b border-slate-50">
                    <td className="py-3 font-bold text-[var(--color-on-surface)]">{vendor}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        Active
                      </span>
                    </td>
                    <td className="py-3 font-bold text-[var(--color-on-surface)]">₹{data.revenue.toLocaleString()}</td>
                    <td className="py-3 text-[var(--color-on-surface-variant)]">{data.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "riders" && (
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <h2 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Rider Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl text-white">
              <p className="text-xs font-bold opacity-80">Total Riders</p>
              <p className="text-4xl font-black mt-2">{riders.length}</p>
            </div>
            <div className="p-6 bg-green-50 rounded-2xl">
              <p className="text-xs font-bold text-green-600">Online Now</p>
              <p className="text-4xl font-black text-green-600 mt-2">{onlineRiders}</p>
            </div>
            <div className="p-6 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-2xl">
              <p className="text-xs font-bold text-[var(--color-outline-variant)]">Total Earnings</p>
              <p className="text-4xl font-black text-[var(--color-on-surface)] mt-2">
                ₹{riders.reduce((s, r) => s + (r.total_earnings || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
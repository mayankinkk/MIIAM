"use client";

export const dynamic = "force-dynamic";

import { useMemo, useEffect, useState } from "react";
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
  vendor?: { shop_name?: string };
}

interface AnalyticsUser {
  id: string;
  created_at: string;
}

interface AnalyticsVendor {
  id: string;
  shop_name: string;
  category?: string;
  status?: string;
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
  vendor?: { shop_name?: string };
}

export default function AdvancedAnalytics() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<AnalyticsOrder[]>([]);
  const [users, setUsers] = useState<AnalyticsUser[]>([]);
  const [vendors, setVendors] = useState<AnalyticsVendor[]>([]);
  const [riders, setRiders] = useState<AnalyticsRider[]>([]);
  const [reviews, setReviews] = useState<{ rating: number; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "users" | "vendors" | "riders" | "reports"
  >("overview");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [ordersRes, usersRes, vendorsRes, ridersRes, reviewsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, vendor:vendors(shop_name)")
          .gte("placed_at", startDate.toISOString())
          .order("placed_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("id, created_at")
          .gte("created_at", startDate.toISOString()),
        supabase.from("vendors").select("id, shop_name, category, status, created_at"),
        supabase.from("riders").select("id, name, is_online, total_earnings, total_deliveries"),
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

    const channel = supabase
      .channel("admin-analytics")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        // Reload data quietly in background without setting loading true
        const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        supabase
          .from("orders")
          .select("*, vendor:vendors(shop_name)")
          .gte("placed_at", startDate.toISOString())
          .order("placed_at", { ascending: true })
          .then((res: { data: AnalyticsOrder[] | null }) => {
            if (res.data) setOrders(res.data);
          });
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
  const pendingOrders = orders.filter((o) =>
    ["pending", "accepted", "preparing"].includes(o.status)
  ).length;

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
  const hourlyOrders: Record<number, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
    16: 0,
    17: 0,
    18: 0,
    19: 0,
    20: 0,
    21: 0,
    22: 0,
    23: 0,
  };

  orders.forEach((o) => {
    const date = new Date(o.placed_at).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    dailyRevenue[date] = (dailyRevenue[date] || 0) + (o.total_amount || 0);

    const hour = new Date(o.placed_at).getHours();
    hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
  });

  const chartData = Object.entries(dailyRevenue);
  const maxRevenue = Math.max(...Object.values(dailyRevenue), 1);

  const vendorRevenue: Record<string, { revenue: number; orders: number }> = {};
  orders.forEach((o) => {
    const vendor = o.vendor?.shop_name || "Unknown";
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
  const activeVendors = vendors.filter((v) => v.status === "active").length;
  const onlineRiders = riders.filter((r) => r.is_online).length;

  const statusDistribution = [
    { status: "delivered", label: "Delivered", count: deliveredOrders, color: "bg-green-500" },
    { status: "cancelled", label: "Cancelled", count: cancelledOrders, color: "bg-red-500" },
    { status: "pending", label: "In Progress", count: pendingOrders, color: "bg-accent" },
    {
      status: "other",
      label: "Other",
      count: orderCount - deliveredOrders - cancelledOrders - pendingOrders,
      color: "bg-slate-400",
    },
  ];

  // --- Real analytics computations for Reports tab ---
  const deliveredOrdersFull = orders.filter((o) => o.status === "delivered");
  const uniqueUsersWithOrders = new Set(orders.map((o) => o.user_id)).size;
  const repeatOrderUsers = orders.reduce<Record<string, number>>((acc, o) => {
    if (o.user_id) acc[o.user_id] = (acc[o.user_id] || 0) + 1;
    return acc;
  }, {});
  const usersWithRepeatOrders = Object.values(repeatOrderUsers).filter((c) => c > 1).length;
  const customerRetention =
    uniqueUsersWithOrders > 0
      ? Math.round((usersWithRepeatOrders / uniqueUsersWithOrders) * 100)
      : 0;
  const repeatOrderPct =
    orderCount > 0 ? Math.round((deliveredOrdersFull.length / orderCount) * 100) : 0;
  const avgOrdersPerCustomer =
    uniqueUsersWithOrders > 0 ? (orderCount / uniqueUsersWithOrders).toFixed(1) : "0";

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews : 0;

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
    const cat = o.vendor_id ? vendorCategoryMap.get(o.vendor_id) || "Other" : "Other";
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
      <div className="flex items-center justify-center px-8 py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Advanced Analytics
          </h1>
          <p className="text-[var(--color-outline)]">
            Comprehensive platform insights and reporting
          </p>
        </div>
        <div className="flex gap-2 rounded-xl bg-[var(--color-surface-container)] p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                period === p
                  ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-outline)]"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="inline-flex rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-1">
        {(["overview", "orders", "users", "vendors", "riders", "reports"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition-colors ${
              activeTab === tab
                ? "text-on-primary bg-[var(--color-primary)]"
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
              <p className="mb-1 text-sm text-[var(--color-outline)]">Customer Retention</p>
              <p className="text-3xl font-black text-green-600">{customerRetention}%</p>
              <p className="mt-1 text-xs text-green-500">
                {uniqueUsersWithOrders} customers, {usersWithRepeatOrders} returning
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
              <p className="mb-1 text-sm text-[var(--color-outline)]">Repeat Orders</p>
              <p className="text-accent text-3xl font-black">{repeatOrderPct}%</p>
              <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                Avg {avgOrdersPerCustomer} orders/customer
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
              <p className="mb-1 text-sm text-[var(--color-outline)]">Avg Delivery Time</p>
              <p className="text-accent text-3xl font-black">{avgDeliveryMinutes} min</p>
              <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                Across {ordersWithDeliveryTime.length} deliveries
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
              <p className="mb-1 text-sm text-[var(--color-outline)]">CSAT Score</p>
              <p className="text-3xl font-black text-amber-600">{avgRating.toFixed(1)}/5</p>
              <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                Based on {totalReviews.toLocaleString()} reviews
              </p>
            </div>
          </div>

          {/* Order Heatmap by Hour & Day */}
          <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-black text-[var(--color-on-surface)]">Order Heatmap</h3>
              <div className="flex gap-2">
                <span className="text-xs text-[var(--color-outline-variant)]">Low</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-4 w-4 rounded ${
                        i === 0
                          ? "bg-green-100"
                          : i === 1
                            ? "bg-green-300"
                            : i === 2
                              ? "bg-green-500"
                              : i === 3
                                ? "bg-green-700"
                                : "bg-green-900"
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
                <div key={day} className="py-2 text-center font-bold text-[var(--color-outline)]">
                  {day}
                </div>
              ))}
              {heatmapData.map((hours, hour) => (
                <div key={`row-${hour}`} className="contents">
                  <div className="py-1 pr-2 text-right text-[var(--color-outline-variant)]">
                    {hour}:00
                  </div>
                  {hours.map((count, dayIndex) => {
                    const intensity =
                      maxHeatmapValue > 0 ? Math.floor((count / maxHeatmapValue) * 4) : 0;
                    return (
                      <div
                        key={`${hour}-${dayIndex}`}
                        className={`h-8 rounded ${
                          intensity === 0
                            ? "bg-green-100"
                            : intensity === 1
                              ? "bg-green-300"
                              : intensity === 2
                                ? "bg-green-500"
                                : intensity === 3
                                  ? "bg-green-700"
                                  : "bg-green-900"
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
          <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
            <h3 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
              Service Category Performance
            </h3>
            <div className="space-y-4">
              {topCategories.map(([name, stats]) => (
                <div key={name} className="flex items-center gap-4">
                  <div className="w-32 font-bold text-[var(--color-on-surface)] capitalize">
                    {name}
                  </div>
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-pink-500"
                      style={{ width: `${(stats.revenue / maxCategoryRevenue) * 100}%` }}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <span className="font-bold text-[var(--color-on-surface)]">
                      ₹{stats.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-[var(--color-outline)]">
                      {stats.orders} orders
                    </span>
                  </div>
                </div>
              ))}
              {topCategories.length === 0 && (
                <p className="py-4 text-center text-[var(--color-outline-variant)]">
                  No order data available for this period
                </p>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-6 shadow-lg">
            <h3 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
              Export Reports
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <button
                onClick={() => {
                  const rows = [["Date", "Revenue", "Orders"]];
                  orders
                    .filter((o) => o.status === "delivered")
                    .forEach((o) => {
                      rows.push([
                        new Date(o.placed_at).toLocaleDateString(),
                        String(o.total_amount),
                        "1",
                      ]);
                    });
                  const csv = rows.map((r) => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "revenue-report.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-4 rounded-xl border-2 border-[var(--color-border-subtle)] p-4 transition-all hover:border-[var(--color-primary)] hover:bg-pink-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
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
                  users.forEach((u) => {
                    rows.push([new Date(u.created_at).toLocaleDateString(), u.id]);
                  });
                  const csv = rows.map((r) => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "user-analytics.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-4 rounded-xl border-2 border-[var(--color-border-subtle)] p-4 transition-all hover:border-[var(--color-primary)] hover:bg-pink-50"
              >
                <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-xl">
                  <span className="material-symbols-outlined text-accent">group</span>
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
                  rows.push([
                    "Avg Order Value",
                    orderCount > 0 ? `₹${Math.round(totalRevenue / orderCount)}` : "₹0",
                  ]);
                  const csv = rows.map((r) => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "performance-report.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-4 rounded-xl border-2 border-[var(--color-border-subtle)] p-4 transition-all hover:border-[var(--color-primary)] hover:bg-pink-50"
              >
                <div className="bg-accent/10 flex h-12 w-12 items-center justify-center rounded-xl">
                  <span className="material-symbols-outlined text-accent">trending_up</span>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-3xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg shadow-green-900/20">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">payments</span>
                <span className="text-xs font-bold tracking-widest uppercase opacity-80">
                  Total GMV
                </span>
              </div>
              <p className="text-4xl font-black">₹{totalRevenue.toLocaleString()}</p>
              <p className="mt-2 text-xs text-white/60">{orderCount} orders</p>
            </div>
            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                  shopping_cart
                </span>
                <span className="text-xs font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Avg Order
                </span>
              </div>
              <p className="text-3xl font-black text-[var(--color-on-surface)]">
                ₹{Math.round(avgOrderValue)}
              </p>
              <p className="mt-2 text-xs text-green-500">per order</p>
            </div>
            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                  group
                </span>
                <span className="text-xs font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
                  New Users
                </span>
              </div>
              <p className="text-3xl font-black text-[var(--color-on-surface)]">{newUsersCount}</p>
              <p className="mt-2 text-xs text-green-500">this period</p>
            </div>
            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
                  local_shipping
                </span>
                <span className="text-xs font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
                  Peak Hours
                </span>
              </div>
              <p className="text-xl font-black text-[var(--color-on-surface)]">
                {peakHours.join(", ")}
              </p>
              <p className="mt-2 text-xs text-[var(--color-outline-variant)]">most orders</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm lg:col-span-2">
              <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
                Revenue Trend
              </h2>
              <div className="flex h-64 items-end gap-2">
                {chartData.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center text-[var(--color-outline-variant)]">
                    No data available
                  </div>
                ) : (
                  chartData.map(([date, revenue], i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div className="group relative w-full rounded-t-lg bg-gradient-to-t from-[var(--color-primary)] to-[#ff7670] transition-all hover:opacity-80">
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                          ₹{revenue.toLocaleString()}
                        </div>
                        <div
                          className="w-full rounded-t-lg bg-[var(--color-primary)]"
                          style={{ height: `${Math.max((revenue / maxRevenue) * 100, 5)}%` }}
                        />
                      </div>
                      <span className="w-full truncate text-center text-[10px] text-[var(--color-outline-variant)]">
                        {date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
                Order Status
              </h2>
              <div className="space-y-4">
                {statusDistribution.map((item) => (
                  <div key={item.status}>
                    <div className="mb-1 flex justify-between">
                      <span className="text-sm font-bold text-[var(--color-on-surface-variant)]">
                        {item.label}
                      </span>
                      <span className="text-sm font-black text-[var(--color-on-surface)]">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${orderCount ? (item.count / orderCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-outline)]">Success Rate</span>
                  <span className="font-bold text-green-600">
                    {orderCount ? Math.round((deliveredOrders / orderCount) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
                Top Vendors by Revenue
              </h2>
              <div className="space-y-4">
                {topVendors.map(([vendor, data], i) => (
                  <div key={vendor} className="flex items-center gap-4">
                    <span className="text-on-primary flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between">
                        <span className="font-bold text-[var(--color-on-surface)]">{vendor}</span>
                        <span className="font-black text-[var(--color-on-surface)]">
                          ₹{data.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-1 flex justify-between text-xs text-[var(--color-outline)]">
                        <span>{data.orders} orders</span>
                        <span>₹{Math.round(data.revenue / data.orders)}/order</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[#ff7670]"
                          style={{
                            width: `${topVendors[0] ? (data.revenue / topVendors[0][1].revenue) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
                Operations Metrics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-green-50 p-4">
                  <span className="material-symbols-outlined text-2xl text-green-600">store</span>
                  <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
                    {activeVendors}
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">Active Vendors</p>
                </div>
                <div className="bg-accent/10 rounded-xl p-4">
                  <span className="material-symbols-outlined text-accent text-2xl">
                    two_wheeler
                  </span>
                  <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
                    {onlineRiders}
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">Online Riders</p>
                </div>
                <div className="bg-accent/10 rounded-xl p-4">
                  <span className="material-symbols-outlined text-accent text-2xl">timer</span>
                  <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
                    {avgDeliveryMinutes > 0 ? `${avgDeliveryMinutes}m` : "N/A"}
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">Avg Delivery Time</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4">
                  <span className="material-symbols-outlined text-2xl text-amber-600">percent</span>
                  <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
                    {riderUtilization}%
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">Rider Utilization</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-4">
                  <span className="material-symbols-outlined text-2xl text-rose-600">
                    trending_up
                  </span>
                  <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
                    {orderCount ? Math.round((deliveredOrders / orderCount) * 100) : 0}%
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">Success Rate</p>
                </div>
                <div className="rounded-xl bg-cyan-50 p-4">
                  <span className="material-symbols-outlined text-2xl text-cyan-600">person</span>
                  <p className="mt-2 text-2xl font-black text-[var(--color-on-surface)]">
                    {newUsersCount}
                  </p>
                  <p className="text-xs text-[var(--color-outline)]">New Users</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "orders" && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black text-[var(--color-on-surface)]">Orders Report</h2>
            <button
              onClick={() => {
                const rows = [["Order ID", "Amount", "Status", "Date"]];
                orders.forEach((o) => {
                  rows.push([
                    o.id.slice(0, 8).toUpperCase(),
                    String(o.total_amount),
                    o.status,
                    new Date(o.placed_at).toLocaleDateString(),
                  ]);
                });
                const csv = rows.map((r) => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "orders-report.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-on-primary flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Order ID
                  </th>
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Vendor
                  </th>
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Amount
                  </th>
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Status
                  </th>
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-50 hover:bg-[var(--color-surface-subtle)]"
                  >
                    <td className="py-3 font-bold text-[var(--color-on-surface)]">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 text-[var(--color-on-surface-variant)]">
                      {order.vendor?.shop_name || "Unknown"}
                    </td>
                    <td className="py-3 font-bold text-[var(--color-on-surface)]">
                      ₹{order.total_amount?.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-deal/10 text-deal dark:bg-deal/20 dark:text-deal"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-[var(--color-outline)]">
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
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">User Analytics</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="from-accent to-accent/70 rounded-2xl bg-gradient-to-br p-6 text-white">
              <p className="text-xs font-bold opacity-80">Total Users</p>
              <p className="mt-2 text-4xl font-black">{users.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
              <p className="text-xs font-bold text-[var(--color-outline-variant)]">
                New This Period
              </p>
              <p className="mt-2 text-4xl font-black text-[var(--color-on-surface)]">
                {newUsersCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
              <p className="text-xs font-bold text-[var(--color-outline-variant)]">
                Conversion Rate
              </p>
              <p className="mt-2 text-4xl font-black text-[var(--color-on-surface)]">
                {users.length ? Math.round((orderCount / users.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "vendors" && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
            Vendor Analytics
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-3xl font-black text-green-600">{activeVendors}</p>
              <p className="text-xs text-[var(--color-outline)]">Active</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center">
              <p className="text-3xl font-black text-[var(--color-on-surface-variant)]">
                {vendors.length - activeVendors}
              </p>
              <p className="text-xs text-[var(--color-outline)]">Inactive</p>
            </div>
            <div className="bg-accent/10 rounded-xl p-4 text-center">
              <p className="text-accent text-3xl font-black">{topVendors.length}</p>
              <p className="text-xs text-[var(--color-outline)]">With Orders</p>
            </div>
            <div className="bg-accent/10 rounded-xl p-4 text-center">
              <p className="text-accent text-3xl font-black">
                ₹
                {topVendors[0] ? Math.round(topVendors[0][1].revenue / topVendors[0][1].orders) : 0}
              </p>
              <p className="text-xs text-[var(--color-outline)]">Top Avg Order</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)]">
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Vendor
                  </th>
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Status
                  </th>
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Revenue
                  </th>
                  <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody>
                {topVendors.map(([vendor, data]) => (
                  <tr key={vendor} className="border-b border-slate-50">
                    <td className="py-3 font-bold text-[var(--color-on-surface)]">{vendor}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Active
                      </span>
                    </td>
                    <td className="py-3 font-bold text-[var(--color-on-surface)]">
                      ₹{data.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 text-[var(--color-on-surface-variant)]">{data.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "riders" && (
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
            Rider Analytics
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white">
              <p className="text-xs font-bold opacity-80">Total Riders</p>
              <p className="mt-2 text-4xl font-black">{riders.length}</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-6">
              <p className="text-xs font-bold text-green-600">Online Now</p>
              <p className="mt-2 text-4xl font-black text-green-600">{onlineRiders}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6">
              <p className="text-xs font-bold text-[var(--color-outline-variant)]">
                Total Earnings
              </p>
              <p className="mt-2 text-4xl font-black text-[var(--color-on-surface)]">
                ₹{riders.reduce((s, r) => s + (r.total_earnings || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

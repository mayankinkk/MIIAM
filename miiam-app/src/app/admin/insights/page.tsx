"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminCustomerInsights() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    loadInsights();
  }, [period]);

  async function loadInsights() {
    setLoading(true);
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [ordersRes, vendorsRes, reviewsRes, profilesRes] = await Promise.all([
      supabase.from("orders").select("user_id, vendor_id, total_amount, status, placed_at").gte("placed_at", since),
      supabase.from("vendors").select("id, shop_name, type, rating, review_count"),
      supabase.from("reviews").select("user_id, vendor_id, rating, created_at").gte("created_at", since),
      supabase.from("profiles").select("id, full_name, created_at"),
    ]);

    const orders = ordersRes.data || [];
    const vendors = vendorsRes.data || [];
    const reviews = reviewsRes.data || [];
    const profiles = profilesRes.data || [];

    const orderUsers = new Set(orders.map(o => o.user_id));
    const repeatUserIds: string[] = [];
    const userOrderCounts: Record<string, number> = {};
    orders.forEach(o => {
      userOrderCounts[o.user_id] = (userOrderCounts[o.user_id] || 0) + 1;
    });
    Object.entries(userOrderCounts).forEach(([uid, count]) => {
      if (count > 1) repeatUserIds.push(uid);
    });

    const vendorOrderCounts: Record<string, number> = {};
    orders.forEach(o => {
      vendorOrderCounts[o.vendor_id] = (vendorOrderCounts[o.vendor_id] || 0) + 1;
    });

    const topVendors = [...vendors]
      .map(v => ({ ...v, orderCount: vendorOrderCounts[v.id] || 0 }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    const vendorRatings: Record<string, { sum: number; count: number }> = {};
    reviews.forEach(r => {
      if (!vendorRatings[r.vendor_id]) vendorRatings[r.vendor_id] = { sum: 0, count: 0 };
      vendorRatings[r.vendor_id].sum += r.rating;
      vendorRatings[r.vendor_id].count++;
    });

    const topRatedVendors = [...vendors]
      .map(v => ({
        ...v,
        avgRating: vendorRatings[v.id] ? (vendorRatings[v.id].sum / vendorRatings[v.id].count).toFixed(1) : v.rating?.toFixed(1) || "0",
        reviewCount: vendorRatings[v.id]?.count || v.review_count || 0,
      }))
      .sort((a, b) => parseFloat(b.avgRating) - parseFloat(a.avgRating))
      .slice(0, 10);

    const newUsers = profiles.filter(p => new Date(p.created_at) >= new Date(since)).length;
    const totalOrdersValue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const deliveredOrders = orders.filter(o => o.status === "delivered").length;
    const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
    const cancellRate = orders.length ? ((cancelledOrders / orders.length) * 100).toFixed(1) : "0";

    const ordersByDay: Record<string, number> = {};
    orders.forEach(o => {
      const day = new Date(o.placed_at).toLocaleDateString();
      ordersByDay[day] = (ordersByDay[day] || 0) + 1;
    });
    const peakDays = Object.entries(ordersByDay).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const customersPerVendor: Record<string, Set<string>> = {};
    orders.forEach(o => {
      if (!customersPerVendor[o.vendor_id]) customersPerVendor[o.vendor_id] = new Set();
      customersPerVendor[o.vendor_id].add(o.user_id);
    });

    setInsights({
      totalCustomers: orderUsers.size,
      totalProfiles: profiles.length,
      newUsers,
      repeatCustomers: repeatUserIds.length,
      repeatRate: orderUsers.size ? ((repeatUserIds.length / orderUsers.size) * 100).toFixed(1) : "0",
      totalOrdersValue,
      deliveredOrders,
      cancelledOrders,
      cancellRate,
      avgOrderValue: orders.length ? (totalOrdersValue / orders.length).toFixed(2) : "0",
      topVendors,
      topRatedVendors,
      peakDays,
      totalOrders: orders.length,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-[var(--color-outline-variant)] animate-pulse font-medium">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--color-on-surface)]">Customer Insights</h1>
          <p className="text-[var(--color-outline)] text-sm mt-1">Platform-wide customer behavior analytics</p>
        </div>
        <div className="flex gap-2 bg-[var(--color-surface-container)] p-1 rounded-xl">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${period === p ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] shadow-sm" : "text-[var(--color-outline)] hover:text-[var(--color-on-surface)]"}`}>
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard title="Total Customers" value={insights.totalCustomers} icon="people" color="text-blue-600" />
        <MetricCard title="New Users" value={insights.newUsers} icon="person_add" color="text-green-600" />
        <MetricCard title="Repeat Customers" value={insights.repeatCustomers} icon="repeat" color="text-purple-600" />
        <MetricCard title="Repeat Rate" value={`${insights.repeatRate}%`} icon="trending_up" color="text-amber-600" />
        <MetricCard title="Total Orders" value={insights.totalOrders} icon="receipt_long" color="text-[var(--color-on-surface-variant)]" />
        <MetricCard title="Avg Order Value" value={`₹${insights.avgOrderValue}`} icon="payments" color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Vendors by Orders */}
        <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-5">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Top Vendors by Orders</h3>
          <div className="space-y-3">
            {insights.topVendors.map((v: any, i: number) => (
              <div key={v.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="w-6 h-6 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center text-xs font-bold text-[var(--color-outline)]">#{i + 1}</span>
                <div className="flex-1">
                  <p className="font-bold text-[var(--color-on-surface)] text-sm">{v.shop_name}</p>
                  <p className="text-xs text-[var(--color-outline-variant)]">Type: {v.type || "food"}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--color-on-surface)]">{v.orderCount}</p>
                  <p className="text-[10px] text-[var(--color-outline-variant)]">orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Rated Vendors */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-5">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Top Rated Vendors</h3>
          <div className="space-y-3">
            {insights.topRatedVendors.slice(0, 8).map((v: any, i: number) => (
              <div key={v.id} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-amber-400 text-sm">★</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{v.shop_name}</p>
                </div>
                <span className="text-sm font-bold text-amber-600">{v.avgRating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Days / Order Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-5">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Peak Order Days</h3>
          <div className="space-y-2">
            {insights.peakDays.map(([day, count]: [string, number], i: number) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--color-outline-variant)] w-4">{i + 1}</span>
                <span className="text-sm text-[var(--color-on-surface)] w-32">{day}</span>
                <div className="flex-1 h-5 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(count / Math.max(...insights.peakDays.map(([_, c]: [string, number]) => c))) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-[var(--color-on-surface)] w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-5">
          <h3 className="font-bold text-[var(--color-on-surface)] mb-4">Order Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div>
                <p className="font-bold text-green-700">Delivered</p>
                <p className="text-xs text-green-600">{insights.deliveredOrders} orders</p>
              </div>
              <span className="text-2xl font-black text-green-700">{((insights.deliveredOrders / insights.totalOrders) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div>
                <p className="font-bold text-red-700">Cancelled</p>
                <p className="text-xs text-red-600">{insights.cancelledOrders} orders</p>
              </div>
              <span className="text-2xl font-black text-red-700">{insights.cancellRate}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <p className="font-bold text-blue-700">Total Revenue</p>
                <p className="text-xs text-blue-600">In selected period</p>
              </div>
              <span className="text-2xl font-black text-blue-700">₹{insights.totalOrdersValue.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-border-subtle)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
        <p className="text-xs text-[var(--color-outline)] font-medium">{title}</p>
      </div>
      <p className="text-2xl font-black text-[var(--color-on-surface)]">{value}</p>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
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

interface VendorInfo {
  id: string;
  shop_name: string;
  type?: string;
  rating?: number;
  review_count?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_time_minutes?: number;
  min_order_amount?: number;
  city?: string;
  pincode?: string;
}

interface Competitor {
  id?: string;
  shop_name: string;
  type?: string;
  rating?: number;
  review_count?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_time_minutes?: number;
  min_order_amount?: number;
  city?: string;
  pincode?: string;
}

interface ForecastDay {
  day: string;
  orders: number;
  revenue: number;
}

interface Forecast {
  avgDailyOrders: number;
  peakDay: { name: string; orders: number };
  slowDay: { name: string; orders: number };
  projectedWeekly: number;
  dayOfWeek: ForecastDay[];
}

export default function VendorAnalytics() {
  const supabase = useMemo(() => createClient(), []);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [loading, setLoading] = useState(true);
  const [menuItemNames, setMenuItemNames] = useState<
    Map<string, { name: string; category: string }>
  >(new Map());
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [dimRatings, setDimRatings] = useState<{
    food_quality: number;
    packaging: number;
    delivery_time: number;
  } | null>(null);

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
        loadReviews(v.id),
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

  async function loadCompetitors(v: VendorInfo) {
    if (!v.city && !v.pincode) return;
    const { data } = await supabase
      .from("vendors")
      .select(
        "id, shop_name, type, rating, review_count, delivery_time_min, delivery_time_max, min_order_amount, city, pincode"
      )
      .neq("id", v.id)
      .eq("status", "active");
    if (!data) return;

    const sameCity = data.filter((c: Competitor) => c.city === v.city || c.pincode === v.pincode);
    const sameType = sameCity.filter((c: Competitor) => c.type === v.type);
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
    data.forEach((o: { placed_at: string; total_amount: number }) => {
      const d = new Date(o.placed_at);
      const dow = d.getDay();
      dayOfWeek[dow].count++;
      dayOfWeek[dow].revenue += o.total_amount || 0;
    });

    const avgDailyOrders = Object.values(dayOfWeek).reduce((s, d) => s + d.count, 0) / 7;
    const peakDay = Object.entries(dayOfWeek).sort((a, b) => b[1].count - a[1].count)[0];
    const slowDay = Object.entries(dayOfWeek).sort((a, b) => a[1].count - b[1].count)[0];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    setForecast({
      avgDailyOrders: Math.round(avgDailyOrders * 10) / 10,
      peakDay: { name: dayNames[parseInt(peakDay[0])], orders: peakDay[1].count },
      slowDay: { name: dayNames[parseInt(slowDay[0])], orders: slowDay[1].count },
      projectedWeekly: Math.round(avgDailyOrders * 7),
      dayOfWeek: Object.entries(dayOfWeek).map(([day, val]) => ({
        day: dayNames[parseInt(day)],
        orders: val.count,
        revenue: val.revenue,
      })),
    });
  }

  async function loadReviews(vId: string) {
    const { data } = await supabase
      .from("reviews")
      .select("food_quality, packaging, delivery_time")
      .eq("vendor_id", vId)
      .not("food_quality", "is", null);
    if (!data || data.length === 0) return;
    const sum = (field: "food_quality" | "packaging" | "delivery_time") =>
      data.reduce(
        (
          s: number,
          r: { food_quality: number | null; packaging: number | null; delivery_time: number | null }
        ) => s + (r[field] || 0),
        0
      ) / data.length;
    setDimRatings({
      food_quality: Math.round(sum("food_quality") * 10) / 10,
      packaging: Math.round(sum("packaging") * 10) / 10,
      delivery_time: Math.round(sum("delivery_time") * 10) / 10,
    });
  }

  const {
    filteredOrders,
    deliveredOrders,
    totalRevenue,
    totalOrders,
    avgOrderValue,
    dailyRevenue,
    popularItems,
    peakHours,
    maxOrders,
  } = useMemo(() => {
    const now = new Date();
    const periodStart = new Date(now);
    if (period === "week") periodStart.setDate(periodStart.getDate() - 7);
    else if (period === "month") periodStart.setMonth(periodStart.getMonth() - 1);
    else periodStart.setFullYear(2000);

    const filtered = orders.filter((o) => new Date(o.placed_at) >= periodStart);
    const delivered = filtered.filter((o) => o.status === "delivered");

    const rev = delivered.reduce((s, o) => s + o.total_amount, 0);
    const count = filtered.length;
    const avg = count > 0 ? rev / count : 0;

    const daily: { date: string; revenue: number; orders: number }[] = [];
    const dateMap = new Map<string, { revenue: number; orders: number }>();
    delivered.forEach((o) => {
      const d = new Date(o.placed_at).toLocaleDateString();
      const entry = dateMap.get(d) || { revenue: 0, orders: 0 };
      entry.revenue += o.total_amount;
      entry.orders += 1;
      dateMap.set(d, entry);
    });
    dateMap.forEach((v, k) => daily.push({ date: k, ...v }));
    daily.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const itemMap = new Map<string, MenuItemInfo>();
    delivered.forEach((o) => {
      o.items?.forEach((item) => {
        const menuItem = menuItemNames.get(item.menu_item_id);
        const name = menuItem?.name || "Unknown";
        const existing = itemMap.get(name) || {
          name,
          total_qty: 0,
          total_revenue: 0,
          order_count: 0,
          category: menuItem?.category || "",
        };
        existing.total_qty += item.quantity;
        existing.total_revenue += item.unit_price * item.quantity;
        existing.order_count += 1;
        itemMap.set(name, existing);
      });
    });
    const popular = Array.from(itemMap.values())
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 10);

    const hourMap = new Map<number, { orders: number; revenue: number }>();
    for (let i = 0; i < 24; i++) hourMap.set(i, { orders: 0, revenue: 0 });
    delivered.forEach((o) => {
      const hour = new Date(o.placed_at).getHours();
      const entry = hourMap.get(hour)!;
      entry.orders += 1;
      entry.revenue += o.total_amount;
    });
    const hours: HourlyData[] = Array.from(hourMap.entries()).map(([hour, data]) => ({
      hour,
      ...data,
    }));
    const maxOrd = Math.max(...hours.map((h) => h.orders), 1);

    return {
      filteredOrders: filtered,
      deliveredOrders: delivered,
      totalRevenue: rev,
      totalOrders: count,
      avgOrderValue: avg,
      dailyRevenue: daily,
      popularItems: popular,
      peakHours: hours,
      maxOrders: maxOrd,
    };
  }, [orders, period, menuItemNames]);

  const { avgCompetitorRating, avgCompetitorDeliveryMin, competitorCount } = useMemo(
    () => ({
      avgCompetitorRating: competitors.length
        ? (competitors.reduce((s, c) => s + (c.rating || 0), 0) / competitors.length).toFixed(1)
        : "N/A",
      avgCompetitorDeliveryMin: competitors.length
        ? Math.round(
            competitors.reduce(
              (s, c) => s + ((c.delivery_time_min || 0) + (c.delivery_time_max || 30)) / 2,
              0
            ) / competitors.length
          )
        : 0,
      competitorCount: competitors.length,
    }),
    [competitors]
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-4 md:p-8">
        <div className="h-8 w-48 rounded bg-[var(--color-surface-container)]" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--color-surface-container)]" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-[var(--color-surface-container)]" />
      </div>
    );
  }

  function exportCSV() {
    const rows = [["Date", "Orders", "Revenue", "Avg Order Value"]];
    dailyRevenue.forEach((d) => {
      rows.push([
        d.date,
        String(d.orders),
        String(d.revenue),
        d.orders > 0 ? String(Math.round(d.revenue / d.orders)) : "0",
      ]);
    });
    rows.push([]);
    rows.push(["Popular Items", "Qty Sold", "Revenue", "Orders"]);
    popularItems.forEach((i) => {
      rows.push([i.name, String(i.total_qty), String(i.total_revenue), String(i.order_count)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!vendorId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <span className="material-symbols-outlined mb-4 text-6xl text-[var(--color-outline-variant)]/60">
          analytics
        </span>
        <h2 className="mb-2 text-2xl font-extrabold text-[var(--color-on-surface)]">
          No Vendor Found
        </h2>
        <p className="text-[var(--color-outline)]">Register your store to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-on-surface)]">
            Analytics
          </h1>
          <p className="mt-1 text-[var(--color-outline)]">
            Sales performance, competitor insights & demand forecast
          </p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${period === p ? "text-on-primary bg-[var(--color-primary)]" : "border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-subtle)]"}`}
            >
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
            </button>
          ))}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] px-4 py-2 text-sm font-bold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-subtle)]"
          >
            <span className="material-symbols-outlined text-base">download</span> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dim)] p-6 text-white">
          <p className="text-sm font-medium text-white/80">Total Revenue</p>
          <p className="mt-1 text-3xl font-black">₹{totalRevenue.toFixed(0)}</p>
          <p className="mt-1 text-xs text-white/80">{deliveredOrders.length} orders</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-outline)]">Orders</p>
          <p className="mt-1 text-3xl font-black text-[var(--color-on-surface)]">{totalOrders}</p>
          <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
            {deliveredOrders.length} delivered
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-outline)]">Avg. Order Value</p>
          <p className="mt-1 text-3xl font-black text-[var(--color-on-surface)]">
            ₹{avgOrderValue.toFixed(0)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-outline)]">Items Sold</p>
          <p className="mt-1 text-3xl font-black text-[var(--color-on-surface)]">
            {deliveredOrders.reduce(
              (s, o) => s + (o.items?.reduce((si, i) => si + i.quantity, 0) || 0),
              0
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div
          className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm"
          role="img"
          aria-label="Daily revenue bar chart"
        >
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Daily Revenue</h3>
          {dailyRevenue.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-outline-variant)]">
              No data for this period
            </p>
          ) : (
            <div className="space-y-3">
              {dailyRevenue.map((d) => {
                const maxRev = Math.max(...dailyRevenue.map((x) => x.revenue), 1);
                const pct = (d.revenue / maxRev) * 100;
                return (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="w-24 text-xs font-medium text-[var(--color-outline)]">
                      {d.date}
                    </span>
                    <div className="h-7 flex-1 overflow-hidden rounded-lg bg-[var(--color-surface-subtle)]">
                      <div
                        className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[#e83350] pr-2 transition-all"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">
                          ₹{d.revenue.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <span className="w-8 text-right text-xs text-[var(--color-outline-variant)]">
                      {d.orders}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div
          className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm"
          role="img"
          aria-label="Peak hours bar chart showing order volume by hour"
        >
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Peak Hours</h3>
          <div className="space-y-2">
            {peakHours.map((h) => {
              const pct = (h.orders / maxOrders) * 100;
              const label =
                h.hour === 0
                  ? "12 AM"
                  : h.hour < 12
                    ? `${h.hour} AM`
                    : h.hour === 12
                      ? "12 PM"
                      : `${h.hour - 12} PM`;
              return (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="w-12 text-xs font-medium text-[var(--color-outline)]">
                    {label}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded-lg bg-[var(--color-surface-subtle)]">
                    <div
                      className="from-accent to-accent/70 h-full rounded-lg bg-gradient-to-r transition-all"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs font-medium text-[var(--color-outline)]">
                    {h.orders} orders
                  </span>
                  <span className="w-16 text-right text-xs text-[var(--color-outline-variant)]">
                    ₹{h.revenue.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance & Staffing */}
      {(() => {
        const topHours = [...peakHours].sort((a, b) => b.orders - a.orders).slice(0, 3);
        const peakLabel =
          topHours.length > 0
            ? `${topHours.map((h) => `${h.hour === 0 ? "12 AM" : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? "12 PM" : `${h.hour - 12} PM`} (${h.orders} orders)`).join(", ")}`
            : "N/A";
        const prepTimes: number[] = [];
        const delayedOrders = orders.filter((o) => o.delay_minutes && o.delay_minutes > 0);
        orders.forEach((o) => {
          if (o.status === "delivered" || o.status === "ready_for_pickup") {
            const placed = new Date(o.placed_at).getTime();
            if (o.delivered_at) {
              const diff = (new Date(o.delivered_at).getTime() - placed) / 60000;
              if (diff > 0 && diff < 300) prepTimes.push(diff);
            }
          }
        });
        const avgPrepTime =
          prepTimes.length > 0
            ? Math.round(prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length)
            : null;
        const onTimeRate =
          prepTimes.length > 0
            ? Math.round((prepTimes.filter((t) => t <= 45).length / prepTimes.length) * 100)
            : null;
        return (
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">speed</span>
              <h3 className="font-bold text-[var(--color-on-surface)]">Performance & Staffing</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
                <p className="mb-2 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                  Staffing Recommendation
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  {topHours.length > 0
                    ? `Schedule extra staff during peak: ${peakLabel}`
                    : "Insufficient data for recommendation"}
                </p>
              </div>
              <div className="bg-accent/10 dark:bg-accent/20 rounded-xl p-4 text-center">
                <p className="text-accent mb-1 text-xs font-bold tracking-wider uppercase">
                  Avg Prep Time
                </p>
                <p className="text-accent dark:text-accent text-3xl font-black">
                  {avgPrepTime ?? "—"}
                </p>
                <p className="text-accent dark:text-accent mt-1 text-xs">minutes</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/30">
                <p className="mb-1 text-xs font-bold tracking-wider text-green-600 uppercase dark:text-green-400">
                  On-time Rate
                </p>
                <p className="text-3xl font-black text-green-700 dark:text-green-300">
                  {onTimeRate != null ? `${onTimeRate}%` : "—"}
                </p>
                <p className="mt-1 text-xs text-green-500 dark:text-green-400">
                  delivered within 45 min
                </p>
              </div>
            </div>
            {delayedOrders.length > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 dark:bg-red-900/30">
                <span className="material-symbols-outlined text-sm text-red-500">warning</span>
                <p className="text-xs text-red-700 dark:text-red-300">
                  {delayedOrders.length} order{delayedOrders.length > 1 ? "s" : ""} reported with
                  delays — avg{" "}
                  {Math.round(
                    delayedOrders.reduce((s, o) => s + (o.delay_minutes || 0), 0) /
                      delayedOrders.length
                  )}{" "}
                  min delay
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Rating Breakdown */}
      {dimRatings && (
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">star</span>
            <h3 className="font-bold text-[var(--color-on-surface)]">Rating Breakdown</h3>
            <span className="rounded-full bg-[var(--color-surface-container)] px-2 py-0.5 text-[10px] text-[var(--color-outline-variant)]">
              Detailed scores
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Taste & Quality", field: dimRatings.food_quality, icon: "restaurant" },
              { label: "Packaging", field: dimRatings.packaging, icon: "inventory_2" },
              { label: "Delivery Time", field: dimRatings.delivery_time, icon: "schedule" },
            ].map((dim) => (
              <div
                key={dim.label}
                className="rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center"
              >
                <div className="mb-2 flex justify-center">
                  <span className="material-symbols-outlined text-2xl text-amber-500">
                    {dim.icon}
                  </span>
                </div>
                <p className="text-3xl font-black text-[var(--color-on-surface)]">
                  {dim.field.toFixed(1)}
                </p>
                <div className="mt-1 flex justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`material-symbols-outlined text-sm ${s <= Math.round(dim.field) ? "text-amber-500" : "text-[var(--color-outline-variant)]/40"}`}
                      style={{
                        fontVariationSettings: `'FILL' ${s <= Math.round(dim.field) ? 1 : 0}`,
                      }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-xs text-[var(--color-outline)]">{dim.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Benchmarking */}
      {competitors.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-on-surface)]">Competitor Benchmarking</h3>
            <span className="rounded-full bg-[var(--color-surface-container)] px-2 py-1 text-xs text-[var(--color-outline-variant)]">
              {competitorCount} similar vendors
            </span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center">
              <p className="mb-1 text-xs text-[var(--color-outline)]">Your Rating</p>
              <p className="text-2xl font-black text-amber-500">
                {vendor?.rating?.toFixed(1) || "0.0"}
              </p>
              <p className="mt-1 text-[10px] text-[var(--color-outline-variant)]">
                vs avg {avgCompetitorRating}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center">
              <p className="mb-1 text-xs text-[var(--color-outline)]">Delivery Time</p>
              <p className="text-accent text-2xl font-black">
                {vendor?.delivery_time_min || vendor?.delivery_time_minutes || "30"} min
              </p>
              <p className="mt-1 text-[10px] text-[var(--color-outline-variant)]">
                vs avg {avgCompetitorDeliveryMin} min
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center">
              <p className="mb-1 text-xs text-[var(--color-outline)]">Min Order</p>
              <p className="text-2xl font-black text-green-600">₹{vendor?.min_order_amount || 0}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-4 text-center">
              <p className="mb-1 text-xs text-[var(--color-outline)]">Reviews</p>
              <p className="text-accent text-2xl font-black">{vendor?.review_count || 0}</p>
              <p className="mt-1 text-[10px] text-[var(--color-outline-variant)]">
                competitors in area
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Competitor benchmarking data</caption>
              <thead className="rounded-xl bg-[var(--color-surface-subtle)]">
                <tr>
                  <th className="p-3 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                    Vendor
                  </th>
                  <th className="p-3 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                    Rating
                  </th>
                  <th className="p-3 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                    Reviews
                  </th>
                  <th className="p-3 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                    Delivery
                  </th>
                  <th className="p-3 text-[10px] font-black text-[var(--color-outline-variant)] uppercase">
                    Min Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {competitors.slice(0, 5).map((c) => (
                  <tr key={c.id || c.shop_name} className="hover:bg-[var(--color-surface-subtle)]">
                    <td className="p-3 font-bold text-[var(--color-on-surface)]">{c.shop_name}</td>
                    <td className="p-3">
                      <span className="text-amber-500">★</span> {c.rating?.toFixed(1) || "N/A"}
                    </td>
                    <td className="p-3 text-[var(--color-on-surface-variant)]">
                      {c.review_count || 0}
                    </td>
                    <td className="p-3 text-[var(--color-on-surface-variant)]">
                      {c.delivery_time_min || c.delivery_time_minutes || "N/A"} min
                    </td>
                    <td className="p-3 text-[var(--color-on-surface-variant)]">
                      ₹{c.min_order_amount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demand Forecasting */}
      {forecast && (
        <div
          className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm"
          role="img"
          aria-label="Demand forecast by day of week"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-accent">trending_up</span>
            <h3 className="font-bold text-[var(--color-on-surface)]">Demand Forecast</h3>
            <span className="rounded-full bg-[var(--color-surface-container)] px-2 py-0.5 text-[10px] text-[var(--color-outline-variant)]">
              Based on last 90 days
            </span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="bg-accent/10 dark:bg-accent/20 rounded-xl p-4 text-center">
              <p className="text-accent dark:text-accent mb-1 text-xs">Avg Daily Orders</p>
              <p className="text-accent dark:text-accent text-2xl font-black">
                {forecast.avgDailyOrders}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/30">
              <p className="mb-1 text-xs text-green-600 dark:text-green-400">Busiest Day</p>
              <p className="text-2xl font-black text-green-700 dark:text-green-300">
                {forecast.peakDay.name}
              </p>
              <p className="text-[10px] text-green-500 dark:text-green-400">
                {forecast.peakDay.orders} orders
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-900/30">
              <p className="mb-1 text-xs text-amber-600 dark:text-amber-400">Slowest Day</p>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300">
                {forecast.slowDay.name}
              </p>
              <p className="text-[10px] text-amber-500 dark:text-amber-400">
                {forecast.slowDay.orders} orders
              </p>
            </div>
            <div className="bg-accent/10 dark:bg-accent/20 rounded-xl p-4 text-center">
              <p className="text-accent mb-1 text-xs">Projected Weekly</p>
              <p className="text-accent dark:text-accent text-2xl font-black">
                {forecast.projectedWeekly}
              </p>
              <p className="text-accent dark:text-accent text-[10px]">orders</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {forecast.dayOfWeek.map((d) => {
              const maxOrders = Math.max(...forecast.dayOfWeek.map((x) => x.orders), 1);
              return (
                <div key={d.day} className="flex min-w-[60px] flex-col items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-outline)]">{d.day}</span>
                  <div className="relative h-24 w-8 overflow-hidden rounded-lg bg-[var(--color-surface-container)]">
                    <div
                      className="from-deal to-deal/70 absolute bottom-0 w-full rounded-lg bg-gradient-to-t transition-all"
                      style={{ height: `${(d.orders / maxOrders) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)]">
                    {d.orders}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Items */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Popular Items</h3>
        {popularItems.length === 0 ? (
          <>
            <p className="py-8 text-center text-sm text-[var(--color-outline-variant)]">
              No items sold yet
            </p>
            <p className="-mt-6 mb-6 text-center text-xs text-[var(--color-outline-variant)] opacity-60">
              Analytics will appear once you start receiving orders
            </p>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Popular items by quantity sold</caption>
              <thead className="rounded-xl bg-[var(--color-surface-subtle)]">
                <tr>
                  <th className="p-3 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                    #
                  </th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                    Item
                  </th>
                  <th className="p-3 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                    Category
                  </th>
                  <th className="p-3 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                    Sold
                  </th>
                  <th className="p-3 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                    Orders
                  </th>
                  <th className="p-3 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {popularItems.map((item, i) => (
                  <tr
                    key={item.name}
                    className="transition-colors hover:bg-[var(--color-surface-subtle)]"
                  >
                    <td className="p-3 text-sm font-bold text-[var(--color-outline-variant)]">
                      {i + 1}
                    </td>
                    <td className="p-3 text-sm font-bold text-[var(--color-on-surface)]">
                      {item.name}
                    </td>
                    <td className="p-3 text-xs text-[var(--color-outline)]">{item.category}</td>
                    <td className="p-3 text-right text-sm font-bold text-[var(--color-on-surface)]">
                      {item.total_qty}
                    </td>
                    <td className="p-3 text-right text-sm text-[var(--color-on-surface-variant)]">
                      {item.order_count}
                    </td>
                    <td className="p-3 text-right text-sm font-extrabold text-green-600">
                      ₹{item.total_revenue.toFixed(0)}
                    </td>
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
          const userId = o.user_id;
          if (!userItemOrders.has(userId)) userItemOrders.set(userId, new Map());
          const seen = new Set<string>();
          o.items?.forEach((item) => {
            const name = menuItemNames.get(item.menu_item_id)?.name || "Unknown";
            if (seen.has(name)) return;
            seen.add(name);
            const m = userItemOrders.get(userId)!;
            m.set(name, (m.get(name) || 0) + 1);
          });
        });
        const itemStats = new Map<string, { totalCustomers: number; repeatCustomers: number }>();
        userItemOrders.forEach((itemCounts) => {
          itemCounts.forEach((count, itemName) => {
            if (!itemStats.has(itemName))
              itemStats.set(itemName, { totalCustomers: 0, repeatCustomers: 0 });
            const s = itemStats.get(itemName)!;
            s.totalCustomers++;
            if (count > 1) s.repeatCustomers++;
          });
        });
        const reorderItems = Array.from(itemStats.entries())
          .map(([name, s]) => ({
            name,
            ...s,
            reorderRate: Math.round((s.repeatCustomers / s.totalCustomers) * 100),
          }))
          .filter((i) => i.totalCustomers > 1)
          .sort((a, b) => b.reorderRate - a.reorderRate)
          .slice(0, 10);
        return reorderItems.length > 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">replay</span>
              <h3 className="font-bold text-[var(--color-on-surface)]">Re-order Analysis</h3>
              <span className="rounded-full bg-[var(--color-surface-container)] px-2 py-0.5 text-[10px] text-[var(--color-outline-variant)]">
                Customer favorites
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="rounded-xl bg-[var(--color-surface-subtle)]">
                  <tr>
                    <th className="p-3 text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                      Item
                    </th>
                    <th className="p-3 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                      Repeat Customers
                    </th>
                    <th className="p-3 text-right text-[10px] font-black tracking-widest text-[var(--color-outline-variant)] uppercase">
                      Re-order Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {reorderItems.map((item) => (
                    <tr
                      key={item.name}
                      className="transition-colors hover:bg-[var(--color-surface-subtle)]"
                    >
                      <td className="p-3 text-sm font-bold text-[var(--color-on-surface)]">
                        {item.name}
                      </td>
                      <td className="text-accent p-3 text-right text-sm font-bold">
                        {item.repeatCustomers}/{item.totalCustomers}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            item.reorderRate >= 50
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : item.reorderRate >= 25
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]"
                          }`}
                        >
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
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              {
                status: "delivered",
                label: "Delivered",
                textClass: "text-green-600 dark:text-green-400",
              },
              {
                status: "cancelled",
                label: "Cancelled",
                textClass: "text-red-600 dark:text-red-400",
              },
              {
                status: "pending",
                label: "Pending",
                textClass: "text-amber-600 dark:text-amber-400",
              },
              { status: "accepted", label: "In Progress", textClass: "text-accent" },
            ] as const
          ).map((s) => {
            const count = filteredOrders.filter((o) => o.status === s.status).length;
            const pct = filteredOrders.length > 0 ? (count / filteredOrders.length) * 100 : 0;
            return (
              <div key={s.status} className="text-center">
                <div className={`text-3xl font-black ${s.textClass}`}>{count}</div>
                <div className="text-sm font-medium text-[var(--color-outline)]">{s.label}</div>
                <div className="text-xs text-[var(--color-outline-variant)]">{pct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

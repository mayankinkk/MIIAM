"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRINTING_VENDOR_ID } from "@/lib/constants";
import logger from "@/lib/logger";

interface OrderRecord {
  id: string;
  placed_at: string;
  total_amount: number;
  user_id: string | null;
  order_items?: OrderItemRecord[];
}

interface OrderItemRecord {
  id: string;
  special_notes: string | null;
}

interface AnalyticsData {
  totalRevenue: number;
  revenueThisWeek: number;
  revenueToday: number;
  totalOrders: number;
  ordersThisWeek: number;
  ordersToday: number;
  averageOrderValue: number;
  averagePagesPerOrder: number;
  topCustomers: { id: string; name: string; total: number; orders: number }[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  colorSplit: { bw: number; color: number };
  addOnsRevenue: number;
  rushRevenue: number;
}

export default function AdminPrintingAnalytics() {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  async function loadAnalytics() {
    setLoading(true);
    const startRange = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("vendor_id", PRINTING_VENDOR_ID)
      .gte("placed_at", startRange.toISOString())
      .order("placed_at", { ascending: false });

    if (error) {
      logger.error({ err: error instanceof Error ? error : new Error(String(error)) }, "[print-analytics] Failed to load orders");
      setLoading(false);
      return;
    }

    if (!orders) {
      setLoading(false);
      return;
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * dayMs;
    const startRangeMs = startRange.getTime();

    const inRange = orders.filter((o: OrderRecord) => new Date(o.placed_at).getTime() >= startRangeMs);
    const inWeek = orders.filter((o: OrderRecord) => new Date(o.placed_at).getTime() >= weekAgo);
    const today = orders.filter((o: OrderRecord) => {
      const d = new Date(o.placed_at);
      const t = new Date();
      return d.toDateString() === t.toDateString();
    });

    const totalRevenue = inRange.reduce((acc: number, o: OrderRecord) => acc + (o.total_amount || 0), 0);
    const revenueThisWeek = inWeek.reduce((acc: number, o: OrderRecord) => acc + (o.total_amount || 0), 0);
    const revenueToday = today.reduce((acc: number, o: OrderRecord) => acc + (o.total_amount || 0), 0);

    let totalPages = 0;
    let bwCount = 0;
    let colorCount = 0;
    let addOnsRevenue = 0;
    let rushRevenue = 0;

    for (const o of inRange) {
      const item = o.order_items?.[0];
      if (!item?.special_notes) continue;
      try {
        const s = JSON.parse(item.special_notes);
        const pages = s.totalPages || s.pages || 0;
        totalPages += pages;
        if (s.colorMode === "bw") bwCount++;
        else if (s.colorMode === "color") colorCount++;
        if (s.addOns && Array.isArray(s.addOns) && s.addOns.length > 0) {
          addOnsRevenue += s.addOnsTotal || 0;
        }
        if (s.rushTier && s.rushTier !== "standard" && s.rushMultiplier > 1) {
          rushRevenue += (s.subtotal || 0) - (s.baseSubtotal || 0);
        }
      } catch (e) {
        logger.warn({ err: e instanceof Error ? e : new Error(String(e)) }, "[print-analytics] Failed to parse order special_notes");
      }
    }

    const customerMap = new Map<string, { total: number; orders: number; name: string }>();
    for (const o of inRange) {
      if (!o.user_id) continue;
      const cur = customerMap.get(o.user_id) || { total: 0, orders: 0, name: "" };
      cur.total += o.total_amount || 0;
      cur.orders += 1;
      customerMap.set(o.user_id, cur);
    }

    // Resolve customer names from profiles table
    const userIds = Array.from(customerMap.keys());
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      if (profiles) {
        for (const p of profiles) {
          const customer = customerMap.get(p.id);
          if (customer) {
            customer.name = p.full_name || p.email || p.id.slice(0, 8);
          }
        }
      }
      // Fill in any remaining unnamed customers
      for (const [id, customer] of customerMap) {
        if (!customer.name) customer.name = id.slice(0, 8);
      }
    }
    const topCustomers = Array.from(customerMap.entries())
      .map(([id, v]) => ({ id, name: v.name, total: v.total, orders: v.orders }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      const key = d.toISOString().split("T")[0];
      dailyMap.set(key, { revenue: 0, orders: 0 });
    }
    for (const o of inRange) {
      const d = new Date(o.placed_at);
      const key = d.toISOString().split("T")[0];
      const cur = dailyMap.get(key);
      if (cur) {
        cur.revenue += o.total_amount || 0;
        cur.orders += 1;
      }
    }
    const dailyRevenue = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, ...v }));

    setData({
      totalRevenue,
      revenueThisWeek,
      revenueToday,
      totalOrders: inRange.length,
      ordersThisWeek: inWeek.length,
      ordersToday: today.length,
      averageOrderValue: inRange.length > 0 ? Math.round(totalRevenue / inRange.length) : 0,
      averagePagesPerOrder: inRange.length > 0 ? Math.round(totalPages / inRange.length) : 0,
      topCustomers,
      dailyRevenue,
      colorSplit: { bw: bwCount, color: colorCount },
      addOnsRevenue: Math.round(addOnsRevenue),
      rushRevenue: Math.round(rushRevenue),
    });
    setLoading(false);
  }

  const maxDaily = useMemo(() => {
    if (!data) return 0;
    return Math.max(1, ...data.dailyRevenue.map((d) => d.revenue));
  }, [data]);

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/printing" className="w-10 h-10 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">arrow_back</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--color-on-surface)]">Print Analytics</h1>
          <p className="text-[var(--color-outline)] text-sm">Revenue, customers & page trends</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-border-subtle)] rounded-lg text-sm font-bold"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {loading || !data ? (
        <div className="text-center py-12 text-[var(--color-outline)]">Loading…</div>
      ) : (
        <div className="space-y-4">
          {/* Headline numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total revenue" value={`₹${data.totalRevenue.toLocaleString()}`} sub={`${days} days`} color="bg-emerald-50 text-emerald-700" />
            <Stat label="Today" value={`₹${data.revenueToday.toLocaleString()}`} sub={`${data.ordersToday} orders`} color="bg-indigo-50 text-indigo-700" />
            <Stat label="This week" value={`₹${data.revenueThisWeek.toLocaleString()}`} sub={`${data.ordersThisWeek} orders`} color="bg-blue-50 text-blue-700" />
            <Stat label="Avg order value" value={`₹${data.averageOrderValue}`} sub={`${data.averagePagesPerOrder} pages avg`} color="bg-amber-50 text-amber-700" />
          </div>

          {/* Daily chart */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-5">
            <h3 className="font-bold text-[var(--color-on-surface)] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Daily revenue
            </h3>
            <div className="flex items-end gap-1 h-32">
              {data.dailyRevenue.map((d) => {
                const heightPct = maxDaily > 0 ? (d.revenue / maxDaily) * 100 : 0;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md transition-all hover:opacity-80"
                      style={{ height: `${Math.max(2, heightPct)}%` }}
                      title={`${d.date}: ₹${d.revenue} · ${d.orders} orders`}
                    />
                    <span className="text-[8px] text-[var(--color-outline-variant)] -rotate-45 origin-top-left whitespace-nowrap">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color split */}
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-5">
              <h3 className="font-bold text-[var(--color-on-surface)] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">palette</span>
                Color split
              </h3>
              <div className="space-y-2">
                <SplitBar label="B&W" count={data.colorSplit.bw} total={data.colorSplit.bw + data.colorSplit.color} color="bg-slate-700" />
                <SplitBar label="Color" count={data.colorSplit.color} total={data.colorSplit.bw + data.colorSplit.color} color="bg-rose-500" />
              </div>
            </div>

            {/* Revenue breakdown */}
            <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-5">
              <h3 className="font-bold text-[var(--color-on-surface)] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Revenue breakdown
              </h3>
              <div className="space-y-2 text-sm">
                <Row label="Base prints" value={`₹${Math.max(0, data.totalRevenue - data.addOnsRevenue - data.rushRevenue).toLocaleString()}`} />
                <Row label="Add-ons (est.)" value={`₹${data.addOnsRevenue.toLocaleString()}`} />
                <Row label="Rush surcharge (est.)" value={`₹${data.rushRevenue.toLocaleString()}`} />
                <div className="pt-2 border-t border-[var(--color-border-subtle)] flex justify-between font-black">
                  <span>Total</span>
                  <span className="text-primary">₹{data.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top customers */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-border-subtle)] p-5">
            <h3 className="font-bold text-[var(--color-on-surface)] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Top customers
            </h3>
            {data.topCustomers.length === 0 ? (
              <p className="text-sm text-[var(--color-outline)]">No customers in range yet</p>
            ) : (
              <div className="space-y-2">
                {data.topCustomers.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-3 p-2 bg-[var(--color-surface-subtle)] rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{c.name}</p>
                      <p className="text-xs text-[var(--color-outline)]">{c.orders} order{c.orders > 1 ? "s" : ""}</p>
                    </div>
                    <p className="text-sm font-black text-[var(--color-on-surface)]">₹{c.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 border border-[var(--color-border-subtle)] ${color}`}>
      <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
      <p className="text-[11px] opacity-70 mt-0.5">{sub}</p>
    </div>
  );
}

function SplitBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-bold text-[var(--color-on-surface)]">{label}</span>
        <span className="text-[var(--color-outline)]">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-on-surface-variant)]">{label}</span>
      <span className="font-bold text-[var(--color-on-surface)]">{value}</span>
    </div>
  );
}

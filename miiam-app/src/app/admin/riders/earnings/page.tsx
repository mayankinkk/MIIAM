"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface RiderEarning {
  rider_id: string;
  rider_name: string;
  total_deliveries: number;
  total_earnings: number;
  avg_per_delivery: number;
  this_week: number;
  this_month: number;
  rating: number;
  is_online: boolean;
}

export default function RiderEarningsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [riders, setRiders] = useState<RiderEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [sortBy, setSortBy] = useState<"earnings" | "deliveries" | "rating">("earnings");

  useEffect(() => {
    loadData();
  }, [period, supabase]);

  async function loadData() {
    setLoading(true);
    
    const { data: riderData } = await supabase
      .from("riders")
      .select("id, name, rating, is_online, earnings")
      .order("earnings", { ascending: false });

    if (riderData) {
      const days = period === "week" ? 7 : period === "month" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, rider_id, total_amount, placed_at, status")
        .gte("placed_at", startDate.toISOString())
        .eq("status", "delivered");

      const riderMap: Record<string, RiderEarning> = {};

      riderData.forEach((rider: { id: string; name: string | null; rating: number | null; is_online: boolean | null; earnings: number | null }) => {
        riderMap[rider.id] = {
          rider_id: rider.id,
          rider_name: rider.name || "Unknown",
          total_deliveries: 0,
          total_earnings: 0,
          avg_per_delivery: 0,
          this_week: 0,
          this_month: 0,
          rating: rider.rating || 0,
          is_online: rider.is_online || false,
        };
      });

      ordersData?.forEach((order: { rider_id: string | null; total_amount: number; placed_at: string }) => {
        if (order.rider_id && riderMap[order.rider_id]) {
          const earning = order.total_amount * 0.15;
          riderMap[order.rider_id].total_deliveries += 1;
          riderMap[order.rider_id].total_earnings += earning;

          const orderDate = new Date(order.placed_at);
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          if (orderDate >= weekAgo) {
            riderMap[order.rider_id].this_week += earning;
          }
          if (orderDate >= monthAgo) {
            riderMap[order.rider_id].this_month += earning;
          }
        }
      });

      Object.values(riderMap).forEach((r) => {
        r.avg_per_delivery = r.total_deliveries > 0 ? r.total_earnings / r.total_deliveries : 0;
      });

      setRiders(Object.values(riderMap));
    }
    setLoading(false);
  }

  const sortedRiders = [...riders].sort((a, b) => {
    if (sortBy === "earnings") return b.total_earnings - a.total_earnings;
    if (sortBy === "deliveries") return b.total_deliveries - a.total_deliveries;
    return b.rating - a.rating;
  });

  const totalEarnings = riders.reduce((s, r) => s + r.total_earnings, 0);
  const totalDeliveries = riders.reduce((s, r) => s + r.total_deliveries, 0);
  const onlineRiders = riders.filter((r) => r.is_online).length;
  const avgRating = riders.length > 0 ? riders.reduce((s, r) => s + r.rating, 0) / riders.length : 0;

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
          <h1 className="text-3xl font-extrabold text-[var(--color-on-surface)] tracking-tight mb-2">Rider Earnings</h1>
          <p className="text-[var(--color-outline)]">Track rider performance and payout reports</p>
        </div>
        <div className="flex gap-2 bg-[var(--color-surface-container)] p-1 rounded-xl">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                period === p ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-outline)]"
              }`}
            >
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-3xl text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined">payments</span>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Total Payout</span>
          </div>
          <p className="text-4xl font-black">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-xs text-white/60 mt-2">{totalDeliveries} deliveries</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">two_wheeler</span>
            <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Active Riders</span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{onlineRiders}</p>
          <p className="text-xs text-green-500 mt-2">online now</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">inventory_2</span>
            <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Avg Deliveries</span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">
            {riders.length ? Math.round(totalDeliveries / riders.length) : 0}
          </p>
          <p className="text-xs text-[var(--color-outline-variant)] mt-2">per rider</p>
        </div>
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-3xl border border-[var(--color-border-subtle)] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-amber-500">star</span>
            <span className="text-xs font-bold text-[var(--color-outline-variant)] uppercase tracking-widest">Avg Rating</span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-green-500 mt-2">out of 5.0</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-[var(--color-on-surface)]">Rider Performance</h2>
          <div className="flex gap-2">
            {(["earnings", "deliveries", "rating"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  sortBy === s 
                    ? "bg-[var(--color-primary)] text-white" 
                    : "bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Rider</th>
                <th className="text-left py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Status</th>
                <th className="text-right py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Deliveries</th>
                <th className="text-right py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Earnings</th>
                <th className="text-right py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Avg/Order</th>
                <th className="text-right py-3 text-xs font-bold text-[var(--color-outline)] uppercase">This Week</th>
                <th className="text-right py-3 text-xs font-bold text-[var(--color-outline)] uppercase">This Month</th>
                <th className="text-right py-3 text-xs font-bold text-[var(--color-outline)] uppercase">Rating</th>
              </tr>
            </thead>
            <tbody>
              {sortedRiders.slice(0, 20).map((rider, index) => (
                <tr key={rider.rider_id} className="border-b border-slate-50 hover:bg-[var(--color-surface-subtle)]">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-bold text-[var(--color-on-surface)]">{rider.rider_name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      rider.is_online ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"
                    }`}>
                      {rider.is_online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-[var(--color-on-surface)]">{rider.total_deliveries}</td>
                  <td className="py-3 text-right font-bold text-green-600">₹{rider.total_earnings.toFixed(0)}</td>
                  <td className="py-3 text-right text-[var(--color-on-surface-variant)]">₹{rider.avg_per_delivery.toFixed(0)}</td>
                  <td className="py-3 text-right font-bold text-[var(--color-on-surface)]">₹{rider.this_week.toFixed(0)}</td>
                  <td className="py-3 text-right font-bold text-[var(--color-on-surface)]">₹{rider.this_month.toFixed(0)}</td>
                  <td className="py-3 text-right">
                    <span className="flex items-center justify-end gap-1 text-amber-500 font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      {rider.rating.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <h3 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Top Earners This Month</h3>
          <div className="space-y-4">
            {sortedRiders.slice(0, 5).map((rider, index) => (
              <div key={rider.rider_id} className="flex items-center gap-4">
                <span className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-[var(--color-on-surface)]">{rider.rider_name}</span>
                    <span className="font-black text-green-600">₹{rider.this_month.toFixed(0)}</span>
                  </div>
                  <div className="h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400"
                      style={{ width: `${(rider.this_month / (sortedRiders[0]?.this_month || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface-container-lowest)] rounded-3xl border border-[var(--color-border-subtle)] p-6 shadow-sm">
          <h3 className="text-lg font-black text-[var(--color-on-surface)] mb-6">Payout Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">account_balance</span>
                <span className="font-bold text-[var(--color-on-surface)]">Bank Transfers</span>
              </div>
              <span className="font-black text-[var(--color-on-surface)]">₹{(totalEarnings * 0.7).toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-600">payments</span>
                <span className="font-bold text-[var(--color-on-surface)]">UPI Transfers</span>
              </div>
              <span className="font-black text-[var(--color-on-surface)]">₹{(totalEarnings * 0.2).toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[var(--color-surface-subtle)] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-600">wallet</span>
                <span className="font-bold text-[var(--color-on-surface)]">Wallet Balance</span>
              </div>
              <span className="font-black text-[var(--color-on-surface)]">₹{(totalEarnings * 0.1).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
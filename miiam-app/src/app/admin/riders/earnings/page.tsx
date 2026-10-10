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

      riderData.forEach(
        (rider: {
          id: string;
          name: string | null;
          rating: number | null;
          is_online: boolean | null;
          earnings: number | null;
        }) => {
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
        }
      );

      ordersData?.forEach(
        (order: { rider_id: string | null; total_amount: number; placed_at: string }) => {
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
        }
      );

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
  const avgRating =
    riders.length > 0 ? riders.reduce((s, r) => s + r.rating, 0) / riders.length : 0;

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
            Rider Earnings
          </h1>
          <p className="text-[var(--color-outline)]">Track rider performance and payout reports</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-[var(--color-surface-container)] p-1">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${
                period === p
                  ? "bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-outline)]"
              }`}
            >
              {p === "week" ? "This Week" : p === "month" ? "This Month" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-3xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">payments</span>
            <span className="text-xs font-bold tracking-widest uppercase opacity-80">
              Total Payout
            </span>
          </div>
          <p className="text-4xl font-black">₹{totalEarnings.toLocaleString()}</p>
          <p className="mt-2 text-xs text-white/60">{totalDeliveries} deliveries</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
              two_wheeler
            </span>
            <span className="text-xs font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
              Active Riders
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">{onlineRiders}</p>
          <p className="mt-2 text-xs text-green-500">online now</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-outline-variant)]">
              inventory_2
            </span>
            <span className="text-xs font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
              Avg Deliveries
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">
            {riders.length ? Math.round(totalDeliveries / riders.length) : 0}
          </p>
          <p className="mt-2 text-xs text-[var(--color-outline-variant)]">per rider</p>
        </div>
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">star</span>
            <span className="text-xs font-bold tracking-widest text-[var(--color-outline-variant)] uppercase">
              Avg Rating
            </span>
          </div>
          <p className="text-3xl font-black text-[var(--color-on-surface)]">
            {avgRating.toFixed(1)}
          </p>
          <p className="mt-2 text-xs text-green-500">out of 5.0</p>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-black text-[var(--color-on-surface)]">Rider Performance</h2>
          <div className="flex gap-2">
            {(["earnings", "deliveries", "rating"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                  sortBy === s
                    ? "text-on-primary bg-[var(--color-primary)]"
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
                <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                  Rider
                </th>
                <th className="py-3 text-left text-xs font-bold text-[var(--color-outline)] uppercase">
                  Status
                </th>
                <th className="py-3 text-right text-xs font-bold text-[var(--color-outline)] uppercase">
                  Deliveries
                </th>
                <th className="py-3 text-right text-xs font-bold text-[var(--color-outline)] uppercase">
                  Earnings
                </th>
                <th className="py-3 text-right text-xs font-bold text-[var(--color-outline)] uppercase">
                  Avg/Order
                </th>
                <th className="py-3 text-right text-xs font-bold text-[var(--color-outline)] uppercase">
                  This Week
                </th>
                <th className="py-3 text-right text-xs font-bold text-[var(--color-outline)] uppercase">
                  This Month
                </th>
                <th className="py-3 text-right text-xs font-bold text-[var(--color-outline)] uppercase">
                  Rating
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRiders.slice(0, 20).map((rider, index) => (
                <tr
                  key={rider.rider_id}
                  className="border-b border-slate-50 hover:bg-[var(--color-surface-subtle)]"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-on-primary flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-bold text-[var(--color-on-surface)]">
                        {rider.rider_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        rider.is_online
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-[var(--color-surface-container)] text-[var(--color-outline)]"
                      }`}
                    >
                      {rider.is_online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-[var(--color-on-surface)]">
                    {rider.total_deliveries}
                  </td>
                  <td className="py-3 text-right font-bold text-green-600">
                    ₹{rider.total_earnings.toFixed(0)}
                  </td>
                  <td className="py-3 text-right text-[var(--color-on-surface-variant)]">
                    ₹{rider.avg_per_delivery.toFixed(0)}
                  </td>
                  <td className="py-3 text-right font-bold text-[var(--color-on-surface)]">
                    ₹{rider.this_week.toFixed(0)}
                  </td>
                  <td className="py-3 text-right font-bold text-[var(--color-on-surface)]">
                    ₹{rider.this_month.toFixed(0)}
                  </td>
                  <td className="py-3 text-right">
                    <span className="flex items-center justify-end gap-1 font-bold text-amber-500">
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">
            Top Earners This Month
          </h3>
          <div className="space-y-4">
            {sortedRiders.slice(0, 5).map((rider, index) => (
              <div key={rider.rider_id} className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between">
                    <span className="font-bold text-[var(--color-on-surface)]">
                      {rider.rider_name}
                    </span>
                    <span className="font-black text-green-600">
                      ₹{rider.this_month.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container)]">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400"
                      style={{
                        width: `${(rider.this_month / (sortedRiders[0]?.this_month || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-container-lowest)] p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-black text-[var(--color-on-surface)]">Payout Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">account_balance</span>
                <span className="font-bold text-[var(--color-on-surface)]">Bank Transfers</span>
              </div>
              <span className="font-black text-[var(--color-on-surface)]">
                ₹{(totalEarnings * 0.7).toFixed(0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-accent">payments</span>
                <span className="font-bold text-[var(--color-on-surface)]">UPI Transfers</span>
              </div>
              <span className="font-black text-[var(--color-on-surface)]">
                ₹{(totalEarnings * 0.2).toFixed(0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-accent">wallet</span>
                <span className="font-bold text-[var(--color-on-surface)]">Wallet Balance</span>
              </div>
              <span className="font-black text-[var(--color-on-surface)]">
                ₹{(totalEarnings * 0.1).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

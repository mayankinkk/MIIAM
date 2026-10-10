"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface DailyStats {
  day: string;
  deliveries: number;
  earnings: number;
  rating: number;
  time: string;
}

export default function RiderAnalyticsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [weeklyData, setWeeklyData] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [rider, setRider] = useState<{ rating?: number; total_deliveries?: number } | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: myRider } = await supabase
        .from("riders")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setRider(myRider);

      const days = period === "week" ? 7 : period === "month" ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, total_amount, delivery_fee, placed_at, delivered_at")
        .eq("rider_id", myRider?.id)
        .gte("placed_at", startDate.toISOString())
        .in("status", ["delivered", "completed"]);

      if (orders && orders.length > 0) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dailyMap: Record<
          string,
          { deliveries: number; earnings: number; ratings: number[] }
        > = {};

        orders.forEach((order: { placed_at: string; delivery_fee: number | null }) => {
          const date = new Date(order.placed_at);
          const dayKey = dayNames[date.getDay()];
          if (!dailyMap[dayKey]) {
            dailyMap[dayKey] = { deliveries: 0, earnings: 0, ratings: [] };
          }
          dailyMap[dayKey].deliveries += 1;
          dailyMap[dayKey].earnings += order.delivery_fee || 0;
        });

        const data = dayNames.map((day) => {
          const d = dailyMap[day] || { deliveries: 0, earnings: 0, ratings: [] };
          const avgRating =
            d.ratings.length > 0 ? d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length : 5.0;
          return {
            day,
            deliveries: d.deliveries,
            earnings: d.earnings,
            rating: parseFloat(avgRating.toFixed(1)),
            time: `${Math.round(d.deliveries * 0.5)}h ${Math.round((d.deliveries * 0.5 * 60) % 60)}m`,
          };
        });
        setWeeklyData(data);
      } else {
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        setWeeklyData(
          dayNames.map((day) => ({
            day,
            deliveries: 0,
            earnings: 0,
            rating: 5.0,
            time: "0h 0m",
          }))
        );
      }
      setLoading(false);
    }
    fetchAnalytics();
  }, [period, supabase]);

  const totalDeliveries = weeklyData.reduce((s, d) => s + d.deliveries, 0);
  const totalEarnings = weeklyData.reduce((s, d) => s + d.earnings, 0);
  const avgRating = rider?.rating?.toFixed(1) || "5.0";

  const chartMax = Math.max(...weeklyData.map((d) => d.earnings), 1);

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="from-brand-secondary bg-gradient-to-br to-[#0044bf] p-6 pb-12 text-white">
        <div className="flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-white" aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Analytics</h1>
        </div>

        <div className="mt-6 flex gap-2 rounded-xl bg-[var(--color-surface-container-lowest)]/10 p-1">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                period === p
                  ? "text-brand-secondary bg-[var(--color-surface-container-lowest)]"
                  : "text-white/70"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="-mt-8 space-y-4 px-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-[var(--color-surface-container-lowest)] p-4"
              >
                <div className="mb-2 h-20 rounded bg-[var(--color-surface-container-high)]" />
                <div className="h-4 w-3/4 rounded bg-[var(--color-surface-container-high)]" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
                <p className="text-xs text-[var(--color-outline-variant)]">Total Deliveries</p>
                <p className="text-brand-secondary mt-1 text-3xl font-black">{totalDeliveries}</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
                <p className="text-xs text-[var(--color-outline-variant)]">Total Earnings</p>
                <p className="text-3xl font-black text-green-600">₹{totalEarnings}</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
                <p className="text-xs text-[var(--color-outline-variant)]">Avg Rating</p>
                <p className="text-3xl font-black text-amber-500">{avgRating} ★</p>
              </div>
              <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
                <p className="text-xs text-[var(--color-outline-variant)]">Avg Earning/Delivery</p>
                <p className="text-brand-secondary text-3xl font-black">
                  {totalDeliveries > 0 ? `₹${Math.round(totalEarnings / totalDeliveries)}` : "₹0"}
                </p>
              </div>
            </div>

            {/* Earnings Chart */}
            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">
                Earnings This {period.charAt(0).toUpperCase() + period.slice(1)}
              </h3>
              {totalEarnings === 0 ? (
                <div className="py-8 text-center text-[var(--color-outline-variant)]">
                  <span className="material-symbols-outlined text-4xl">bar_chart</span>
                  <p className="mt-2 text-sm">No deliveries yet this {period}</p>
                </div>
              ) : (
                <div className="flex h-40 items-end gap-1">
                  {weeklyData.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="bg-brand-secondary/20 relative w-full rounded-t-md"
                        style={{ height: "100%" }}
                      >
                        <div
                          className="from-brand-secondary absolute bottom-0 w-full rounded-t-md bg-gradient-to-t to-[#4489ff] transition-all"
                          style={{ height: `${Math.max((d.earnings / chartMax) * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex justify-between">
                {weeklyData.map((d, i) => (
                  <span key={i} className="text-[10px] text-[var(--color-outline-variant)]">
                    {d.day}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-3 rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
              <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <span className="material-symbols-outlined text-green-600">route</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Total Distance</p>
                    <p className="text-xs text-[var(--color-outline-variant)]">This {period}</p>
                  </div>
                </div>
                <p className="font-black text-green-600">
                  {totalDeliveries > 0 ? `${Math.round(totalDeliveries * 3)} km` : "0 km"}
                </p>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Rating Breakdown</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-black text-amber-500">{avgRating}</p>
                  <div className="mt-1 flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className="material-symbols-outlined text-sm text-amber-400"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-outline-variant)]">
                    {rider?.total_deliveries || 0} ratings
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

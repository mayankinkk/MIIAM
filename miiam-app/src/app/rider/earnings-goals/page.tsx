"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import logger from "@/lib/logger";

interface DeliveryRecord {
  id: string;
  order_id: string;
  amount: number;
  time: string;
  status: string;
}

export default function RiderEarningsGoalsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [dailyTarget, setDailyTarget] = useState(1500);
  const [weeklyTarget, setWeeklyTarget] = useState(10000);
  const [showSetGoal, setShowSetGoal] = useState(false);
  const [goalType, setGoalType] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [weeklyDeliveries, setWeeklyDeliveries] = useState(0);
  const [dailyData, setDailyData] = useState<number[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<DeliveryRecord[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    async function loadStats() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: myRider } = await supabase
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!myRider) {
        setLoading(false);
        return;
      }

      // Load saved goals
      const { data: goals } = await supabase
        .from("rider_settings")
        .select("daily_goal, weekly_goal")
        .eq("rider_id", myRider.id)
        .maybeSingle();
      if (goals) {
        if (goals.daily_goal) setDailyTarget(goals.daily_goal);
        if (goals.weekly_goal) setWeeklyTarget(goals.weekly_goal);
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, delivery_fee, placed_at, status")
        .eq("rider_id", myRider.id)
        .in("status", ["delivered", "completed"])
        .order("placed_at", { ascending: false });

      let totalE = 0;

      if (orders) {
        let dayE = 0,
          dayD = 0,
          weekE = 0,
          weekD = 0;
        const dayMap: Record<string, number> = {};
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const recent: DeliveryRecord[] = [];

        orders.forEach(
          (o: { placed_at: string; delivery_fee: number | null; id: string; status: string }) => {
            const d = new Date(o.placed_at);
            const earn = o.delivery_fee || 0;
            totalE += earn;
            if (d >= todayStart) {
              dayE += earn;
              dayD++;
            }
            if (d >= startOfWeek) {
              weekE += earn;
              weekD++;
            }
            const dayKey = dayNames[d.getDay()];
            dayMap[dayKey] = (dayMap[dayKey] || 0) + earn;
            if (recent.length < 10) {
              recent.push({
                id: o.id,
                order_id: o.id,
                amount: earn,
                time: o.placed_at,
                status: o.status,
              });
            }
          }
        );

        setTodayEarnings(dayE);
        setTodayDeliveries(dayD);
        setWeeklyEarnings(weekE);
        setWeeklyDeliveries(weekD);
        setTotalEarnings(totalE);
        setRecentDeliveries(recent);

        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const dd = new Date();
          dd.setDate(today.getDate() - i);
          last7.push(dayMap[dayNames[dd.getDay()]] || 0);
        }
        setDailyData(last7);
      }

      // Fallback: if total is 0, try reading from rider_wallets
      if (totalE === 0) {
        const { data: walletData } = await supabase
          .from("rider_wallets")
          .select("total_earnings")
          .eq("rider_id", myRider.id)
          .maybeSingle();
        if (walletData) {
          setTotalEarnings(Number(walletData.total_earnings) || 0);
        }
      }
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  const dailyProgress = Math.min((todayEarnings / dailyTarget) * 100, 100);
  const weeklyProgress = Math.min((weeklyEarnings / weeklyTarget) * 100, 100);
  const chartMax = Math.max(...dailyData, dailyTarget, 1);

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myRider } = await supabase
        .from("riders")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!myRider) return;

      await supabase.from("rider_settings").upsert(
        {
          rider_id: myRider.id,
          daily_goal: dailyTarget,
          weekly_goal: weeklyTarget,
        },
        { onConflict: "rider_id" }
      );
    } catch (err) {
      logger.error({ err }, "Failed to save goals");
    } finally {
      setSavingGoal(false);
      setShowSetGoal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)]">
      <header className="from-brand-secondary to-secondary-dim bg-gradient-to-br p-6 pb-12 text-white">
        <div className="flex items-center gap-4">
          <Link href="/rider/dashboard" className="text-white" aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter">Earnings Goals</h1>
        </div>
      </header>

      <main className="-mt-8 space-y-4 px-4 pb-24">
        {/* Total Earnings */}
        <div className="from-brand-secondary to-secondary-dim rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase opacity-80">Total Earnings (All Time)</p>
          <p className="mt-2 text-4xl font-black">₹{totalEarnings.toLocaleString()}</p>
        </div>

        {/* Daily Goal */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-on-surface)]">Daily Goal</h3>
            <button
              onClick={() => {
                setGoalType("daily");
                setShowSetGoal(true);
              }}
              className="text-brand-secondary text-xs font-bold"
            >
              Edit
            </button>
          </div>
          <p className="text-brand-secondary text-3xl font-black">₹{todayEarnings}</p>
          <p className="text-xs text-[var(--color-outline-variant)]">of ₹{dailyTarget}</p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-container)]">
            <div
              className="from-brand-secondary h-full rounded-full bg-gradient-to-r to-green-500 transition-all"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-[var(--color-outline)]">{todayDeliveries} deliveries</span>
            <span className="text-brand-secondary font-bold">{Math.round(dailyProgress)}%</span>
          </div>
        </div>

        {/* Weekly Goal */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-[var(--color-on-surface)]">Weekly Goal</h3>
            <button
              onClick={() => {
                setGoalType("weekly");
                setShowSetGoal(true);
              }}
              className="text-brand-secondary text-xs font-bold"
            >
              Edit
            </button>
          </div>
          <p className="text-3xl font-black text-green-600">₹{weeklyEarnings}</p>
          <p className="text-xs text-[var(--color-outline-variant)]">of ₹{weeklyTarget}</p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-container)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-amber-400 transition-all"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-[var(--color-outline)]">{weeklyDeliveries} deliveries</span>
            <span className="font-bold text-green-600">{Math.round(weeklyProgress)}%</span>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-[var(--color-on-surface)]">Earnings Breakdown</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3 text-center">
              <p className="text-brand-secondary text-2xl font-black">{todayDeliveries}</p>
              <p className="text-xs text-[var(--color-outline-variant)]">Today</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3 text-center">
              <p className="text-2xl font-black text-green-600">{weeklyDeliveries}</p>
              <p className="text-xs text-[var(--color-outline-variant)]">This Week</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3 text-center">
              <p className="text-2xl font-black text-amber-600">
                {todayDeliveries > 0 ? `₹${Math.round(todayEarnings / todayDeliveries)}` : "₹0"}
              </p>
              <p className="text-xs text-[var(--color-outline-variant)]">Avg/Delivery</p>
            </div>
          </div>
        </div>

        {/* Last 7 Days Chart */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Last 7 Days</h3>
          {dailyData.length === 0 ? (
            <div className="py-8 text-center text-[var(--color-outline-variant)]">
              <span className="material-symbols-outlined text-4xl">bar_chart</span>
              <p className="mt-2 text-sm">No deliveries yet</p>
            </div>
          ) : (
            <>
              <div className="flex h-32 items-end gap-1">
                {dailyData.map((amt, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="bg-brand-secondary/20 relative w-full rounded-t-md"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="from-brand-secondary to-accent/70 absolute bottom-0 w-full rounded-t-md bg-gradient-to-t transition-all"
                        style={{ height: `${Math.max((amt / chartMax) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                  <span key={i} className="text-[10px] text-[var(--color-outline-variant)]">
                    {d}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Deliveries */}
        <div className="rounded-2xl bg-[var(--color-surface-container-lowest)] p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-[var(--color-on-surface)]">Recent Deliveries</h3>
          {recentDeliveries.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-outline-variant)]">
              No deliveries yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentDeliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-bold text-[var(--color-on-surface)]">
                      #{d.order_id.slice(0, 6).toUpperCase()}
                    </p>
                    <p className="text-xs text-[var(--color-outline-variant)]">
                      {new Date(d.time).toLocaleDateString()}{" "}
                      {new Date(d.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-green-600">+₹{d.amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Set Goal Modal */}
      {showSetGoal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-container-lowest)] p-6">
            <h3 className="mb-4 text-xl font-bold">
              Set {goalType === "daily" ? "Daily" : "Weekly"} Goal
            </h3>
            <div className="space-y-3">
              {goalType === "daily"
                ? [500, 1000, 1500, 2000, 2500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDailyTarget(amount)}
                      className={`w-full rounded-xl py-3 text-sm font-bold ${
                        dailyTarget === amount
                          ? "bg-brand-secondary text-white"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
                      }`}
                    >
                      ₹{amount.toLocaleString()}
                    </button>
                  ))
                : [5000, 10000, 15000, 20000, 25000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setWeeklyTarget(amount)}
                      className={`w-full rounded-xl py-3 text-sm font-bold ${
                        weeklyTarget === amount
                          ? "bg-brand-secondary text-white"
                          : "bg-[var(--color-surface-container)] text-[var(--color-on-surface)]"
                      }`}
                    >
                      ₹{amount.toLocaleString()}
                    </button>
                  ))}
            </div>
            <button
              onClick={handleSaveGoal}
              disabled={savingGoal}
              className="bg-brand-secondary mt-3 w-full rounded-xl py-3 font-bold text-white disabled:opacity-50"
            >
              {savingGoal ? "Saving..." : "Save Goal"}
            </button>
            <button
              onClick={() => setShowSetGoal(false)}
              className="mt-2 w-full rounded-xl py-3 text-sm font-bold text-[var(--color-outline)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
